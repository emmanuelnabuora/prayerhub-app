import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { CreateTestimonyDto } from './dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TestimoniesService {
  constructor(@Inject(PG_POOL) private readonly db: Pool, private readonly notifications: NotificationsService) {}

  // Testimonies are public by design once shared — there's no visibility field in
  // the schema (unlike prayer requests), matching the product intent that a
  // testimony is meant to be a public encouragement once someone chooses to post
  // it. Draft/answered-but-private prayers stay in the journal until the user
  // explicitly converts them (see prayers/journal.service.ts).
  async list(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const result = await this.db.query(
      `select t.*, u.username, u.display_name, u.avatar_url,
              (select count(*) from testimony_reactions tr where tr.testimony_id = t.id) as reaction_count
       from testimonies t join users u on u.id = t.user_id
       where t.deleted_at is null
       order by t.created_at desc limit $1 offset $2`,
      [limit, offset],
    );
    return result.rows.map(this.serialize);
  }

  async create(userId: string, dto: CreateTestimonyDto, mediaUrl?: string) {
    const result = await this.db.query(
      `insert into testimonies (user_id, category, body, media_url, media_type)
       values ($1, $2, $3, $4, $5) returning *`,
      [userId, dto.category, dto.body ?? null, mediaUrl ?? null, dto.mediaType],
    );
    return this.serialize({ ...result.rows[0], reaction_count: 0 });
  }

  async react(id: string, userId: string, type: 'amen' | 'encourage') {
    const testimony = await this.db.query('select user_id from testimonies where id = $1 and deleted_at is null', [id]);
    if (!testimony.rowCount) throw new NotFoundException('Testimony not found');
    await this.db.query(
      `insert into testimony_reactions (testimony_id, user_id, type) values ($1, $2, $3)
       on conflict (testimony_id, user_id, type) do nothing`,
      [id, userId, type],
    );
    const ownerId = testimony.rows[0].user_id;
    if (ownerId !== userId) {
      await this.notifications.create(ownerId, 'testimony_encouragement', { testimonyId: id, type, fromUserId: userId });
    }
    return { success: true };
  }

  async remove(id: string, userId: string) {
    const existing = await this.db.query('select user_id from testimonies where id = $1 and deleted_at is null', [id]);
    if (!existing.rowCount) throw new NotFoundException('Testimony not found');
    if (existing.rows[0].user_id !== userId) throw new ForbiddenException('Not the owner');
    await this.db.query('update testimonies set deleted_at = now() where id = $1', [id]);
    return { success: true };
  }

  private serialize(row: any) {
    return {
      id: row.id,
      category: row.category,
      body: row.body,
      mediaUrl: row.media_url,
      mediaType: row.media_type,
      author: { id: row.user_id, username: row.username, displayName: row.display_name, avatarUrl: row.avatar_url },
      reactionCount: Number(row.reaction_count ?? 0),
      createdAt: row.created_at,
    };
  }
}
