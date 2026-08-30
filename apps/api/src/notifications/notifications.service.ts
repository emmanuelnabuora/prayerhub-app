import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';

// Notification creation is called from other services (prayers, live, groups,
// organizations, follows) whenever something notification-worthy happens —
// this service itself has no idea what a "prayer" or "room" is, it just
// stores/serves typed, payload-carrying rows. Keeping type+payload generic
// (rather than a table per notification kind) means adding a new
// notification type later never requires a migration.
@Injectable()
export class NotificationsService {
  constructor(@Inject(PG_POOL) private readonly db: Pool) {}

  async create(userId: string, type: string, payload: Record<string, any> = {}) {
    await this.db.query(
      `insert into notifications (user_id, type, payload) values ($1, $2, $3)`,
      [userId, type, JSON.stringify(payload)],
    );
  }

  async list(userId: string) {
    const result = await this.db.query(
      `select id, type, payload, read_at as "readAt", created_at as "createdAt"
       from notifications where user_id = $1
       order by created_at desc limit 50`,
      [userId],
    );
    return result.rows;
  }

  async unreadCount(userId: string) {
    const result = await this.db.query(
      `select count(*)::int as count from notifications where user_id = $1 and read_at is null`,
      [userId],
    );
    return { count: result.rows[0].count };
  }

  async markRead(userId: string, notificationId: string) {
    await this.db.query(
      `update notifications set read_at = now() where id = $1 and user_id = $2 and read_at is null`,
      [notificationId, userId],
    );
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.db.query(
      `update notifications set read_at = now() where user_id = $1 and read_at is null`,
      [userId],
    );
    return { success: true };
  }
}
