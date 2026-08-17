import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';

// Deliberately not embedding-based — this runs with zero external
// configuration, unlike SemanticSearchService, because "suggested groups" and
// "people to pray with" are core home-screen content (see the product spec's
// Home Experience section) that shouldn't go blank just because no
// VOYAGE_API_KEY is set. Ranking by shared interests/overlap is a legitimate,
// well-understood recommender baseline, not a placeholder.
@Injectable()
export class RecommendationsService {
  constructor(@Inject(PG_POOL) private readonly db: Pool) {}

  async suggestedGroups(userId: string, limit = 5) {
    const result = await this.db.query(
      `select g.id, g.name, g.group_type, g.visibility,
              (select count(*) from group_members gm2 where gm2.group_id = g.id) as member_count
       from groups g
       where g.deleted_at is null and g.visibility = 'public'
         and not exists (select 1 from group_members gm where gm.group_id = g.id and gm.user_id = $1)
       order by member_count desc
       limit $2`,
      [userId, limit],
    );
    // Ranking purely by size for now — see docs/14-SPRINT-9.md for the planned
    // interest-overlap scoring once `user_interests` has enough data density to
    // outperform "popular and public" as a baseline.
    return result.rows;
  }

  async peopleToPrayWith(userId: string, limit = 5) {
    const result = await this.db.query(
      `select u.id, u.username, u.display_name, u.avatar_url,
              count(ui2.interest) as shared_interest_count
       from users u
       join user_interests ui2 on ui2.user_id = u.id
       where u.id != $1
         and ui2.interest in (select interest from user_interests where user_id = $1)
         and not exists (select 1 from follows f where f.follower_id = $1 and f.followee_id = u.id)
         and not exists (select 1 from blocks b where (b.blocker_id = $1 and b.blocked_id = u.id) or (b.blocker_id = u.id and b.blocked_id = $1))
       group by u.id
       order by shared_interest_count desc
       limit $2`,
      [userId, limit],
    );
    return result.rows;
  }
}
