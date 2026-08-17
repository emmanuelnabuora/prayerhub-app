import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { SendMessageDto, StartGroupConversationDto } from './dto';
import { createHash } from 'crypto';
import { MessagesGateway } from './messages.gateway';

@Injectable()
export class MessagesService {
  constructor(
    @Inject(PG_POOL) private readonly db: Pool,
    private readonly gateway: MessagesGateway,
  ) {}

  // One direct conversation per unordered pair, enforced via a deterministic key
  // (sorted user ids, hashed) rather than a query-time existence check racing a
  // concurrent create — the unique constraint on conversations.direct_pair_key is
  // the actual guarantee; this just computes the same key both callers would.
  private directPairKey(userA: string, userB: string) {
    const [a, b] = [userA, userB].sort();
    return createHash('sha256').update(`${a}:${b}`).digest('hex');
  }

  async findOrCreateDirect(userId: string, otherUserId: string) {
    if (userId === otherUserId) throw new ForbiddenException('Cannot message yourself');

    const blocked = await this.db.query(
      'select 1 from blocks where (blocker_id = $1 and blocked_id = $2) or (blocker_id = $2 and blocked_id = $1)',
      [userId, otherUserId],
    );
    if (blocked.rowCount) throw new ForbiddenException('Cannot message a blocked user');

    const key = this.directPairKey(userId, otherUserId);
    const existing = await this.db.query('select id from conversations where direct_pair_key = $1', [key]);
    if (existing.rowCount) return this.getConversation(existing.rows[0].id, userId);

    const conversation = await this.db.query(
      `insert into conversations (type, created_by, direct_pair_key) values ('direct', $1, $2) returning *`,
      [userId, key],
    );
    await this.db.query(
      `insert into conversation_members (conversation_id, user_id) values ($1, $2), ($1, $3)`,
      [conversation.rows[0].id, userId, otherUserId],
    );
    return this.getConversation(conversation.rows[0].id, userId);
  }

  async createGroupConversation(userId: string, dto: StartGroupConversationDto) {
    const conversation = await this.db.query(
      `insert into conversations (type, title, created_by) values ('group', $1, $2) returning *`,
      [dto.title, userId],
    );
    const memberIds = Array.from(new Set([userId, ...dto.memberIds]));
    for (const memberId of memberIds) {
      await this.db.query(
        `insert into conversation_members (conversation_id, user_id) values ($1, $2)`,
        [conversation.rows[0].id, memberId],
      );
    }
    return this.getConversation(conversation.rows[0].id, userId);
  }

  async listConversations(userId: string) {
    const result = await this.db.query(
      `select c.*,
              (select body from messages m where m.conversation_id = c.id and m.deleted_at is null
                 order by m.created_at desc limit 1) as last_message_body,
              (select created_at from messages m where m.conversation_id = c.id and m.deleted_at is null
                 order by m.created_at desc limit 1) as last_message_at,
              (select count(*) from messages m where m.conversation_id = c.id and m.deleted_at is null
                 and m.created_at > coalesce(cm.last_read_at, 'epoch')) as unread_count
       from conversations c
       join conversation_members cm on cm.conversation_id = c.id and cm.user_id = $1
       order by coalesce(
         (select created_at from messages m2 where m2.conversation_id = c.id order by created_at desc limit 1),
         c.created_at
       ) desc`,
      [userId],
    );
    return result.rows;
  }

  async getConversation(id: string, userId: string) {
    await this.assertMember(id, userId);
    const conversation = await this.db.query('select * from conversations where id = $1', [id]);
    if (!conversation.rowCount) throw new NotFoundException('Conversation not found');

    const members = await this.db.query(
      `select u.id, u.username, u.display_name, u.avatar_url from conversation_members cm
       join users u on u.id = cm.user_id where cm.conversation_id = $1`,
      [id],
    );
    return { ...conversation.rows[0], members: members.rows };
  }

  async listMessages(conversationId: string, userId: string, before?: string) {
    await this.assertMember(conversationId, userId);
    const result = await this.db.query(
      `select m.*, u.username, u.display_name, u.avatar_url
       from messages m join users u on u.id = m.sender_id
       where m.conversation_id = $1 and m.deleted_at is null
         ${before ? 'and m.created_at < $3' : ''}
       order by m.created_at desc limit $2`,
      before ? [conversationId, 50, before] : [conversationId, 50],
    );
    return result.rows.reverse().map(this.serializeMessage);
  }

  async sendMessage(conversationId: string, userId: string, dto: SendMessageDto) {
    await this.assertMember(conversationId, userId);

    // Re-check block status at send time, not just at conversation creation — a
    // block that happens mid-thread should stop new messages immediately.
    const otherMembers = await this.db.query(
      `select user_id from conversation_members where conversation_id = $1 and user_id != $2`,
      [conversationId, userId],
    );
    for (const row of otherMembers.rows) {
      const blocked = await this.db.query(
        'select 1 from blocks where (blocker_id = $1 and blocked_id = $2) or (blocker_id = $2 and blocked_id = $1)',
        [userId, row.user_id],
      );
      if (blocked.rowCount) throw new ForbiddenException('Cannot message a blocked user');
    }

    const result = await this.db.query(
      `insert into messages (conversation_id, sender_id, type, body, scripture_reference,
                              media_asset_id, shared_prayer_request_id)
       values ($1, $2, $3, $4, $5, $6, $7) returning *`,
      [conversationId, userId, dto.type, dto.body ?? null, dto.scriptureReference ?? null,
       dto.mediaAssetId ?? null, dto.sharedPrayerRequestId ?? null],
    );

    const withUser = await this.db.query(
      `select m.*, u.username, u.display_name, u.avatar_url from messages m
       join users u on u.id = m.sender_id where m.id = $1`,
      [result.rows[0].id],
    );
    const serialized = this.serializeMessage(withUser.rows[0]);
    this.gateway.broadcastMessage(conversationId, serialized);
    return serialized;
  }

  async markRead(conversationId: string, userId: string) {
    await this.assertMember(conversationId, userId);
    await this.db.query(
      `update conversation_members set last_read_at = now()
       where conversation_id = $1 and user_id = $2`,
      [conversationId, userId],
    );
    return { success: true };
  }

  private async assertMember(conversationId: string, userId: string) {
    const result = await this.db.query(
      'select 1 from conversation_members where conversation_id = $1 and user_id = $2',
      [conversationId, userId],
    );
    if (!result.rowCount) throw new ForbiddenException('Not a member of this conversation');
  }

  private serializeMessage(row: any) {
    return {
      id: row.id,
      conversationId: row.conversation_id,
      type: row.type,
      body: row.body,
      scriptureReference: row.scripture_reference,
      mediaAssetId: row.media_asset_id,
      sharedPrayerRequestId: row.shared_prayer_request_id,
      sender: { id: row.sender_id, username: row.username, displayName: row.display_name, avatarUrl: row.avatar_url },
      createdAt: row.created_at,
    };
  }
}
