import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { UpdateProfileDto } from './dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UsersService {
  constructor(@Inject(PG_POOL) private readonly db: Pool, private readonly notifications: NotificationsService) {}

  async findById(id: string, requestingUserId?: string) {
    const result = await this.db.query(
      `select u.id, u.username, u.display_name as "displayName", u.avatar_url as "avatarUrl",
              u.country, u.timezone, u.languages,
              u.church_affiliation as "churchAffiliation", u.bio, u.created_at as "createdAt",
              coalesce(
                (select array_agg(ui.interest) from user_interests ui where ui.user_id = u.id),
                array[]::text[]
              ) as interests
       from users u where u.id = $1 and u.deleted_at is null`,
      [id],
    );
    if (!result.rowCount) throw new NotFoundException('User not found');
    return result.rows[0];
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.db.query(
      `update users set
         display_name = coalesce($2, display_name),
         country = coalesce($3, country),
         timezone = coalesce($4, timezone),
         languages = coalesce($5, languages),
         church_affiliation = coalesce($6, church_affiliation),
         bio = coalesce($7, bio),
         updated_at = now()
       where id = $1`,
      [userId, dto.displayName, dto.country, dto.timezone, dto.languages,
       dto.churchAffiliation, dto.bio],
    );

    if (dto.interests) {
      await this.db.query('delete from user_interests where user_id = $1', [userId]);
      for (const interest of dto.interests) {
        await this.db.query(
          'insert into user_interests (user_id, interest) values ($1, $2)',
          [userId, interest],
        );
      }
    }

    return this.findById(userId);
  }

  async follow(followerId: string, followeeId: string) {
    if (followerId === followeeId) throw new ForbiddenException('Cannot follow yourself');
    const blocked = await this.db.query(
      'select 1 from blocks where (blocker_id = $1 and blocked_id = $2) or (blocker_id = $2 and blocked_id = $1)',
      [followerId, followeeId],
    );
    if (blocked.rowCount) throw new ForbiddenException('Cannot follow a blocked user');

    await this.db.query(
      `insert into follows (follower_id, followee_id) values ($1, $2) on conflict do nothing`,
      [followerId, followeeId],
    );
    await this.notifications.create(followeeId, 'new_follower', { followerId });
    return { success: true };
  }

  async unfollow(followerId: string, followeeId: string) {
    await this.db.query('delete from follows where follower_id = $1 and followee_id = $2', [followerId, followeeId]);
    return { success: true };
  }

  async block(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) throw new ForbiddenException('Cannot block yourself');
    await this.db.query('insert into blocks (blocker_id, blocked_id) values ($1, $2) on conflict do nothing', [blockerId, blockedId]);
    // Blocking severs any existing follow relationship in both directions.
    await this.db.query(
      'delete from follows where (follower_id = $1 and followee_id = $2) or (follower_id = $2 and followee_id = $1)',
      [blockerId, blockedId],
    );
    return { success: true };
  }

  async listFollowers(userId: string) {
    const result = await this.db.query(
      `select u.id, u.username, u.display_name, u.avatar_url from follows f
       join users u on u.id = f.follower_id where f.followee_id = $1`,
      [userId],
    );
    return result.rows;
  }

  async listFollowing(userId: string) {
    const result = await this.db.query(
      `select u.id, u.username, u.display_name, u.avatar_url from follows f
       join users u on u.id = f.followee_id where f.follower_id = $1`,
      [userId],
    );
    return result.rows;
  }

  async search(query: string) {
    const result = await this.db.query(
      `select id, username, display_name, avatar_url from users
       where deleted_at is null and (username ilike $1 or display_name ilike $1)
       limit 20`,
      [`%${query}%`],
    );
    return result.rows;
  }
}
