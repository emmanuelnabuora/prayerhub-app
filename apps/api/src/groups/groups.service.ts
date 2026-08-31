import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { CreateGroupDto, UpdateGroupDto, ChangeMemberRoleDto, SetScheduleDto, PostDiscussionDto } from './dto';

// Visibility rules for discovery, mirroring the same defense-in-depth pattern used
// for prayer_requests: private/invite_only groups are only ever returned if the
// viewer is already a member, enforced in SQL, not just by hiding a "join" button.
const DISCOVERY_CLAUSE = `
  (g.visibility = 'public' or exists (
     select 1 from group_members gm where gm.group_id = g.id and gm.user_id = $1))
`;

@Injectable()
export class GroupsService {
  constructor(@Inject(PG_POOL) private readonly db: Pool) {}

  async create(userId: string, dto: CreateGroupDto) {
    const result = await this.db.query(
      `insert into groups (name, description, cover_image_url, visibility, group_type, owner_id)
       values ($1, $2, $3, $4, $5, $6) returning *`,
      [dto.name, dto.description ?? null, dto.coverImageUrl ?? null, dto.visibility,
       dto.groupType ?? 'prayer', userId],
    );
    const group = result.rows[0];
    await this.db.query(
      `insert into group_members (group_id, user_id, role) values ($1, $2, 'leader')`,
      [group.id, userId],
    );
    return this.findOne(group.id, userId);
  }

  async discover(userId: string, groupType?: string) {
    const result = await this.db.query(
      `select g.*, u.display_name as owner_name,
              (select count(*) from group_members gm where gm.group_id = g.id) as member_count,
              exists(select 1 from group_members gm where gm.group_id = g.id and gm.user_id = $1) as is_member
       from groups g
       join users u on u.id = g.owner_id
       where g.deleted_at is null and ${DISCOVERY_CLAUSE}
         ${groupType ? 'and g.group_type = $2' : ''}
       order by g.created_at desc`,
      groupType ? [userId, groupType] : [userId],
    );
    return result.rows.map(this.serialize);
  }

  async myGroups(userId: string) {
    const result = await this.db.query(
      `select g.*, u.display_name as owner_name,
              (select count(*) from group_members gm2 where gm2.group_id = g.id) as member_count,
              true as is_member, gm.role as viewer_role
       from group_members gm
       join groups g on g.id = gm.group_id
       join users u on u.id = g.owner_id
       where gm.user_id = $1 and g.deleted_at is null
       order by gm.joined_at desc`,
      [userId],
    );
    return result.rows.map(this.serialize);
  }

  async findOne(id: string, userId: string) {
    const result = await this.db.query(
      `select g.*, u.display_name as owner_name,
              (select count(*) from group_members gm where gm.group_id = g.id) as member_count,
              exists(select 1 from group_members gm where gm.group_id = g.id and gm.user_id = $1) as is_member,
              (select role from group_members gm where gm.group_id = g.id and gm.user_id = $1) as viewer_role
       from groups g join users u on u.id = g.owner_id
       where g.id = $2 and g.deleted_at is null and ${DISCOVERY_CLAUSE}`,
      [userId, id],
    );
    if (!result.rowCount) throw new NotFoundException('Group not found or not visible');
    return this.serialize(result.rows[0]);
  }

  async update(id: string, userId: string, dto: UpdateGroupDto) {
    await this.assertLeader(id, userId);
    await this.db.query(
      `update groups set name = coalesce($2, name), description = coalesce($3, description),
         cover_image_url = coalesce($4, cover_image_url), visibility = coalesce($5, visibility),
         updated_at = now()
       where id = $1`,
      [id, dto.name, dto.description, dto.coverImageUrl, dto.visibility],
    );
    return this.findOne(id, userId);
  }

  // Public groups: instant join. Private/invite-only: creates a pending self-request
  // that a leader must approve (see approveJoinRequest). This keeps one consistent
  // table (group_invites) for both leader-issued invites and member-issued requests.
  async join(id: string, userId: string) {
    const group = await this.db.query('select visibility from groups where id = $1 and deleted_at is null', [id]);
    if (!group.rowCount) throw new NotFoundException('Group not found');

    const existing = await this.db.query(
      'select 1 from group_members where group_id = $1 and user_id = $2', [id, userId],
    );
    if (existing.rowCount) throw new ConflictException('Already a member');

    if (group.rows[0].visibility === 'public') {
      await this.db.query(
        `insert into group_members (group_id, user_id, role) values ($1, $2, 'member')`,
        [id, userId],
      );
      return { status: 'joined' };
    }

    await this.db.query(
      `insert into group_invites (group_id, invited_user_id, invited_by, status)
       values ($1, $2, $2, 'pending')
       on conflict do nothing`,
      [id, userId],
    );
    return { status: 'pending_approval' };
  }

  async leave(id: string, userId: string) {
    const member = await this.db.query(
      'select role from group_members where group_id = $1 and user_id = $2', [id, userId],
    );
    if (!member.rowCount) throw new NotFoundException('Not a member');
    if (member.rows[0].role === 'leader') {
      const otherLeaders = await this.db.query(
        `select 1 from group_members where group_id = $1 and role = 'leader' and user_id != $2`,
        [id, userId],
      );
      if (!otherLeaders.rowCount) {
        throw new ForbiddenException('Assign another leader before leaving — a group cannot be leaderless');
      }
    }
    await this.db.query('delete from group_members where group_id = $1 and user_id = $2', [id, userId]);
    return { success: true };
  }

  async invite(id: string, actorId: string, invitedUserId: string) {
    await this.assertModerator(id, actorId);
    await this.db.query(
      `insert into group_invites (group_id, invited_user_id, invited_by, status)
       values ($1, $2, $3, 'pending')`,
      [id, invitedUserId, actorId],
    );
    return { success: true };
  }

  async respondToInvite(inviteId: string, userId: string, accept: boolean) {
    const invite = await this.db.query('select * from group_invites where id = $1', [inviteId]);
    if (!invite.rowCount) throw new NotFoundException('Invite not found');
    const row = invite.rows[0];
    if (row.invited_user_id !== userId) throw new ForbiddenException('Not your invite');
    if (row.invited_by === row.invited_user_id) {
      throw new ForbiddenException('This is a join request awaiting leader approval, not an invite to respond to');
    }

    await this.db.query(
      `update group_invites set status = $2 where id = $1`,
      [inviteId, accept ? 'accepted' : 'declined'],
    );
    if (accept) {
      await this.db.query(
        `insert into group_members (group_id, user_id, role) values ($1, $2, 'member')
         on conflict do nothing`,
        [row.group_id, userId],
      );
    }
    return { success: true };
  }

  async approveJoinRequest(inviteId: string, actorId: string, approve: boolean) {
    const invite = await this.db.query('select * from group_invites where id = $1', [inviteId]);
    if (!invite.rowCount) throw new NotFoundException('Request not found');
    const row = invite.rows[0];
    if (row.invited_by !== row.invited_user_id) throw new ForbiddenException('Not a self-request');
    await this.assertModerator(row.group_id, actorId);

    await this.db.query('update group_invites set status = $2 where id = $1',
      [inviteId, approve ? 'accepted' : 'declined']);
    if (approve) {
      await this.db.query(
        `insert into group_members (group_id, user_id, role) values ($1, $2, 'member')
         on conflict do nothing`,
        [row.group_id, row.invited_user_id],
      );
    }
    return { success: true };
  }

  async listMembers(id: string, userId: string) {
    await this.findOne(id, userId); // enforces visibility
    const result = await this.db.query(
      `select gm.user_id, gm.role, gm.joined_at, u.username, u.display_name, u.avatar_url
       from group_members gm join users u on u.id = gm.user_id
       where gm.group_id = $1
       order by (gm.role = 'leader') desc, (gm.role = 'moderator') desc, gm.joined_at asc`,
      [id],
    );
    return result.rows;
  }

  async changeMemberRole(id: string, actorId: string, targetUserId: string, dto: ChangeMemberRoleDto) {
    await this.assertLeader(id, actorId);
    await this.db.query(
      'update group_members set role = $3 where group_id = $1 and user_id = $2',
      [id, targetUserId, dto.role],
    );
    return { success: true };
  }

  async removeMember(id: string, actorId: string, targetUserId: string) {
    await this.assertModerator(id, actorId);
    await this.db.query('delete from group_members where group_id = $1 and user_id = $2', [id, targetUserId]);
    return { success: true };
  }

  async setSchedule(id: string, actorId: string, dto: SetScheduleDto) {
    await this.assertLeader(id, actorId);
    await this.db.query(
      `update groups set recurring_schedule = $2, updated_at = now() where id = $1`,
      [id, JSON.stringify(dto.schedule)],
    );
    return this.findOne(id, actorId);
  }

  private async assertLeader(groupId: string, userId: string) {
    const result = await this.db.query(
      `select role from group_members where group_id = $1 and user_id = $2`, [groupId, userId],
    );
    if (result.rows[0]?.role !== 'leader') throw new ForbiddenException('Leader only');
  }

  private async assertModerator(groupId: string, userId: string) {
    const result = await this.db.query(
      `select role from group_members where group_id = $1 and user_id = $2`, [groupId, userId],
    );
    const role = result.rows[0]?.role;
    if (role !== 'leader' && role !== 'moderator') throw new ForbiddenException('Leader/moderator only');
  }

  async listDiscussions(groupId: string, userId: string) {
    const membership = await this.db.query(
      "select 1 from group_members where group_id = $1 and user_id = $2",
      [groupId, userId],
    );
    if (!membership.rowCount) throw new ForbiddenException("Not a member of that group");
    const result = await this.db.query(
      `select gd.id, gd.body, gd.scripture_reference as "scriptureReference", gd.created_at as "createdAt",
              u.id as "authorId", u.display_name as "authorName", u.avatar_url as "authorAvatarUrl"
       from group_discussions gd join users u on u.id = gd.user_id
       where gd.group_id = $1 order by gd.created_at asc`,
      [groupId],
    );
    return result.rows;
  }
  async postDiscussion(groupId: string, userId: string, dto: PostDiscussionDto) {
    const membership = await this.db.query(
      "select 1 from group_members where group_id = $1 and user_id = $2",
      [groupId, userId],
    );
    if (!membership.rowCount) throw new ForbiddenException("Not a member of that group");
    const result = await this.db.query(
      `insert into group_discussions (group_id, user_id, body, scripture_reference)
       values ($1, $2, $3, $4) returning id, created_at`,
      [groupId, userId, dto.body, dto.scriptureReference ?? null],
    );
    return result.rows[0];
  }
  private serialize(row: any) {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      coverImageUrl: row.cover_image_url,
      visibility: row.visibility,
      groupType: row.group_type,
      ownerName: row.owner_name,
      memberCount: Number(row.member_count ?? 0),
      isMember: Boolean(row.is_member),
      viewerRole: row.viewer_role ?? null,
      recurringSchedule: row.recurring_schedule ?? null,
      createdAt: row.created_at,
    };
  }
}
