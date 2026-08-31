import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { SfuProvider } from './sfu.provider';
import { CreateRoomDto, RoomRoleChangeDto } from './dto';
import { randomUUID } from 'crypto';
import { NotificationsService } from '../notifications/notifications.service';

// Room membership/role state is written to Postgres on every change (source of
// truth for history/moderation, per docs/02-ARCHITECTURE.md section 3). A real
// deployment additionally mirrors "who's live right now" into Redis for fast
// reads; that mirror is a caching concern layered on top of this service, not a
// replacement for it, so it's omitted here to keep this sprint's code testable
// without a Redis dependency.
@Injectable()
export class LiveRoomsService {
  constructor(
    @Inject(PG_POOL) private readonly db: Pool,
    private readonly sfu: SfuProvider,
    private readonly notifications: NotificationsService,
  ) {}

  async list() {
    const result = await this.db.query(
      `select lr.*, u.username as host_username, u.display_name as host_display_name,
              (select count(*) from room_participants rp
                 where rp.room_id = lr.id and rp.left_at is null) as listener_count
       from live_rooms lr
       join users u on u.id = lr.host_id
       where lr.status in ('live','scheduled')
       order by (lr.status = 'live') desc, coalesce(lr.started_at, lr.scheduled_for) asc`,
    );
    return result.rows.map(this.serializeRoom);
  }

  async create(hostId: string, dto: CreateRoomDto) {
    if (dto.groupId) {
      const membership = await this.db.query(
        'select 1 from group_members where group_id = $1 and user_id = $2',
        [dto.groupId, hostId],
      );
      if (!membership.rowCount) throw new ForbiddenException('Not a member of that group');
    }

    const sfuRoomName = `room-${randomUUID()}`;
    const isImmediate = !dto.scheduledFor;

    const result = await this.db.query(
      `insert into live_rooms (host_id, group_id, title, topic, status, sfu_room_name,
                                scheduled_for, recurring_rule, started_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *`,
      [hostId, dto.groupId ?? null, dto.title, dto.topic ?? null,
       isImmediate ? 'live' : 'scheduled', sfuRoomName,
       dto.scheduledFor ?? null, dto.recurringRule ?? null,
       isImmediate ? new Date() : null],
    );
    const room = result.rows[0];

    if (isImmediate) {
      await this.sfu.createRoom(sfuRoomName);
      await this.upsertParticipant(room.id, hostId, 'host', false);
      await this.logEvent(room.id, hostId, undefined, 'joined', { role: 'host' });
      const followers = await this.db.query('select follower_id from follows where followee_id = $1', [hostId]);
      for (const f of followers.rows) {
        await this.notifications.create(f.follower_id, 'room_live', { roomId: room.id, hostId, title: dto.title });
      }
    }

    return this.serializeRoom({ ...room, host_username: null, host_display_name: null, listener_count: isImmediate ? 1 : 0 });
  }

  async startScheduled(roomId: string, hostId: string) {
    const room = await this.assertHost(roomId, hostId);
    if (room.status !== 'scheduled') throw new ForbiddenException('Room is not in scheduled state');

    await this.sfu.createRoom(room.sfu_room_name);
    await this.db.query(
      `update live_rooms set status = 'live', started_at = now(), updated_at = now() where id = $1`,
      [roomId],
    );
    await this.upsertParticipant(roomId, hostId, 'host', false);
    await this.logEvent(roomId, hostId, undefined, 'joined', { role: 'host' });
    return this.getRoom(roomId);
  }

  async getRoom(roomId: string) {
    const result = await this.db.query(
      `select lr.*, u.username as host_username, u.display_name as host_display_name
       from live_rooms lr join users u on u.id = lr.host_id where lr.id = $1`,
      [roomId],
    );
    if (!result.rowCount) throw new NotFoundException('Room not found');

    const participants = await this.db.query(
      `select rp.*, u.username, u.display_name, u.avatar_url
       from room_participants rp join users u on u.id = rp.user_id
       where rp.room_id = $1 and rp.left_at is null
       order by (rp.role = 'host') desc, (rp.role = 'co_host') desc, (rp.role = 'speaker') desc, rp.joined_at asc`,
      [roomId],
    );

    return {
      ...this.serializeRoom({ ...result.rows[0], listener_count: participants.rowCount }),
      participants: participants.rows.map((p) => ({
        userId: p.user_id, username: p.username, displayName: p.display_name,
        avatarUrl: p.avatar_url, role: p.role, handRaised: p.hand_raised, muted: p.muted,
      })),
    };
  }

  // A listener joining gets a subscribe-only token; hosts/co-hosts/speakers get
  // publish rights. The role stored server-side — never a client-supplied field —
  // decides which token is minted.
  async joinAndGetToken(roomId: string, userId: string, username: string) {
    const room = await this.db.query('select * from live_rooms where id = $1', [roomId]);
    if (!room.rowCount) throw new NotFoundException('Room not found');
    if (room.rows[0].status !== 'live') throw new ForbiddenException('Room is not live');

    const existing = await this.db.query(
      'select role from room_participants where room_id = $1 and user_id = $2', [roomId, userId],
    );
    const role = existing.rows[0]?.role ?? 'listener';
    await this.upsertParticipant(roomId, userId, role, role === 'listener');
    await this.logEvent(roomId, userId, undefined, 'joined', { role });

    const canPublish = role === 'host' || role === 'co_host' || role === 'speaker';
    const token = await this.sfu.createToken(room.rows[0].sfu_room_name, userId, username, canPublish);
    return { token, sfuUrl: process.env.LIVEKIT_URL, role };
  }

  async raiseHand(roomId: string, userId: string) {
    await this.db.query(
      `update room_participants set hand_raised = true where room_id = $1 and user_id = $2`,
      [roomId, userId],
    );
    await this.logEvent(roomId, userId, undefined, 'hand_raised', {});
    return { success: true };
  }

  // Only a host/co-host may promote a hand-raised listener to speaker, or demote a
  // speaker back to listener. Checked against the DB, never trusted from the client.
  async changeRole(roomId: string, actorId: string, dto: RoomRoleChangeDto) {
    await this.assertModerator(roomId, actorId);
    const room = await this.db.query('select sfu_room_name from live_rooms where id = $1', [roomId]);

    await this.db.query(
      `update room_participants set role = $3, hand_raised = false, muted = ($3 = 'listener')
       where room_id = $1 and user_id = $2`,
      [roomId, dto.targetUserId, dto.role],
    );
    await this.logEvent(roomId, actorId, dto.targetUserId, 'promoted', { role: dto.role });

    if (dto.role === 'listener') {
      await this.sfu.muteParticipant(room.rows[0].sfu_room_name, dto.targetUserId, true);
    }
    return { success: true };
  }

  async removeParticipant(roomId: string, actorId: string, targetUserId: string, reason?: string) {
    await this.assertModerator(roomId, actorId);
    const room = await this.db.query('select sfu_room_name from live_rooms where id = $1', [roomId]);

    await this.db.query(
      `update room_participants set left_at = now(), removed_by = $3 where room_id = $1 and user_id = $2`,
      [roomId, targetUserId, actorId],
    );
    await this.logEvent(roomId, actorId, targetUserId, 'removed', { reason });
    await this.sfu.removeParticipant(room.rows[0].sfu_room_name, targetUserId);
    return { success: true };
  }

  async endRoom(roomId: string, hostId: string) {
    const room = await this.assertHost(roomId, hostId);
    await this.db.query(
      `update live_rooms set status = 'ended', ended_at = now(), updated_at = now() where id = $1`,
      [roomId],
    );
    await this.db.query(
      `update room_participants set left_at = now() where room_id = $1 and left_at is null`,
      [roomId],
    );
    await this.sfu.endRoom(room.sfu_room_name);
    return { success: true };
  }

  private async upsertParticipant(roomId: string, userId: string, role: string, muted: boolean) {
    await this.db.query(
      `insert into room_participants (room_id, user_id, role, muted)
       values ($1, $2, $3, $4)
       on conflict (room_id, user_id)
       do update set role = excluded.role, muted = excluded.muted, left_at = null`,
      [roomId, userId, role, muted],
    );
  }

  private async logEvent(roomId: string, actorId: string | undefined, targetUserId: string | undefined, eventType: string, metadata: object) {
    await this.db.query(
      `insert into room_events (room_id, actor_id, target_user_id, event_type, metadata)
       values ($1, $2, $3, $4, $5)`,
      [roomId, actorId ?? null, targetUserId ?? null, eventType, JSON.stringify(metadata)],
    );
  }

  private async assertHost(roomId: string, userId: string) {
    const result = await this.db.query('select * from live_rooms where id = $1', [roomId]);
    if (!result.rowCount) throw new NotFoundException('Room not found');
    if (result.rows[0].host_id !== userId) throw new ForbiddenException('Only the host can do this');
    return result.rows[0];
  }

  private async assertModerator(roomId: string, userId: string) {
    const result = await this.db.query(
      `select role from room_participants where room_id = $1 and user_id = $2`, [roomId, userId],
    );
    const role = result.rows[0]?.role;
    if (role !== 'host' && role !== 'co_host') throw new ForbiddenException('Host/co-host only');
  }

  private serializeRoom(row: any) {
    return {
      id: row.id,
      title: row.title,
      topic: row.topic,
      status: row.status,
      host: { id: row.host_id, username: row.host_username, displayName: row.host_display_name },
      groupId: row.group_id,
      listenerCount: Number(row.listener_count ?? 0),
      startedAt: row.started_at,
      scheduledFor: row.scheduled_for,
      recurringRule: row.recurring_rule,
    };
  }
}
