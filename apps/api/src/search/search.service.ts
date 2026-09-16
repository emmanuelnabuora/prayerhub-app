import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';

// Unified global search — one endpoint, four category queries run in
// parallel rather than four separate round-trips from the client. Each
// query is capped at a small limit since this powers a live-typing search
// screen, not a full results page; a person wanting more from one category
// already has a dedicated discover screen for it (Community tab, Live tab).
@Injectable()
export class SearchService {
  constructor(@Inject(PG_POOL) private readonly db: Pool) {}

  async search(query: string) {
    const like = `%${query}%`;

    const [people, rooms, groups, organizations] = await Promise.all([
      this.db.query(
        `select id, username, display_name as "displayName", avatar_url as "avatarUrl"
         from users where deleted_at is null and (username ilike $1 or display_name ilike $1)
         limit 8`,
        [like],
      ),
      this.db.query(
        `select id, title, topic, status
         from live_rooms where status in ('live', 'scheduled') and (title ilike $1 or topic ilike $1)
         limit 8`,
        [like],
      ),
      this.db.query(
        `select id, name, description, group_type as "groupType"
         from groups where deleted_at is null and visibility = 'public'
           and (name ilike $1 or description ilike $1)
         limit 8`,
        [like],
      ),
      this.db.query(
        `select id, name, description, type
         from organizations where deleted_at is null and (name ilike $1 or description ilike $1)
         limit 8`,
        [like],
      ),
    ]);

    return {
      people: people.rows,
      rooms: rooms.rows,
      groups: groups.rows,
      organizations: organizations.rows,
    };
  }
}
