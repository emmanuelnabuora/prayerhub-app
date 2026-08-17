import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { CreatePrayerRequestDto, UpdatePrayerRequestDto, CreateCommentDto } from './dto';
import { EmbeddingIndexerService } from '../embeddings/embedding-indexer.service';

// Visibility is enforced here, at the query layer, in addition to any controller-level
// checks — a private request is never returned to anyone but its owner, regardless of
// what a future controller bug might allow through.
const VISIBILITY_CLAUSE = `
  (
    pr.visibility = 'public'
    or (pr.visibility = 'private' and pr.user_id = $1)
    or (pr.visibility = 'followers' and exists (
          select 1 from follows f where f.follower_id = $1 and f.followee_id = pr.user_id))
    or (pr.visibility = 'group' and pr.group_id is not null and exists (
          select 1 from group_members gm where gm.group_id = pr.group_id and gm.user_id = $1))
    or pr.user_id = $1
  )
`;

@Injectable()
export class PrayersService {
  constructor(
    @Inject(PG_POOL) private readonly db: Pool,
    private readonly embeddingIndexer: EmbeddingIndexerService,
  ) {}

  async create(userId: string, dto: CreatePrayerRequestDto) {
    if (dto.groupId) {
      const membership = await this.db.query(
        'select 1 from group_members where group_id = $1 and user_id = $2',
        [dto.groupId, userId],
      );
      if (!membership.rowCount) throw new ForbiddenException('Not a member of that group');
    }

    const result = await this.db.query(
      `insert into prayer_requests (user_id, group_id, title, description, category,
                                     visibility, is_anonymous, image_url)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning *`,
      [userId, dto.groupId ?? null, dto.title, dto.description, dto.category ?? null,
       dto.visibility, dto.isAnonymous ?? false, dto.imageUrl ?? null],
    );
    const created = result.rows[0];

    // Fire-and-forget — see embeddings/embedding-indexer.service.ts for why a
    // slow/failed embedding call never blocks or fails prayer request creation.
    this.embeddingIndexer.indexPrayerRequest(created.id, `${dto.title}\n${dto.description}`).catch(() => undefined);

    return this.serialize(created, userId);
  }

  async feed(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const result = await this.db.query(
      `select pr.*, u.username, u.display_name, u.avatar_url,
              (select count(*) from prayer_interactions pi
                 where pi.prayer_request_id = pr.id and pi.type = 'prayed') as prayed_count,
              exists(select 1 from prayer_interactions pi
                 where pi.prayer_request_id = pr.id and pi.type = 'prayed'
                   and pi.user_id = $1) as viewer_has_prayed
       from prayer_requests pr
       join users u on u.id = pr.user_id
       where pr.deleted_at is null and ${VISIBILITY_CLAUSE}
       order by pr.created_at desc
       limit $2 offset $3`,
      [userId, limit, offset],
    );
    return result.rows.map((row) => this.serialize(row, userId));
  }

  async findOne(id: string, userId: string) {
    const result = await this.db.query(
      `select pr.*, u.username, u.display_name, u.avatar_url,
              (select count(*) from prayer_interactions pi
                 where pi.prayer_request_id = pr.id and pi.type = 'prayed') as prayed_count,
              exists(select 1 from prayer_interactions pi
                 where pi.prayer_request_id = pr.id and pi.type = 'prayed'
                   and pi.user_id = $1) as viewer_has_prayed
       from prayer_requests pr
       join users u on u.id = pr.user_id
       where pr.id = $2 and pr.deleted_at is null and ${VISIBILITY_CLAUSE}`,
      [userId, id],
    );
    if (!result.rowCount) throw new NotFoundException('Prayer request not found or not visible');
    return this.serialize(result.rows[0], userId);
  }

  async update(id: string, userId: string, dto: UpdatePrayerRequestDto) {
    const existing = await this.db.query(
      'select user_id from prayer_requests where id = $1 and deleted_at is null', [id],
    );
    if (!existing.rowCount) throw new NotFoundException('Prayer request not found');
    if (existing.rows[0].user_id !== userId) throw new ForbiddenException('Not the owner');

    await this.db.query(
      `update prayer_requests set
         title = coalesce($2, title),
         description = coalesce($3, description),
         visibility = coalesce($4, visibility),
         updated_at = now()
       where id = $1`,
      [id, dto.title, dto.description, dto.visibility],
    );
    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string) {
    const existing = await this.db.query(
      'select user_id from prayer_requests where id = $1 and deleted_at is null', [id],
    );
    if (!existing.rowCount) throw new NotFoundException('Prayer request not found');
    if (existing.rows[0].user_id !== userId) throw new ForbiddenException('Not the owner');

    await this.db.query('update prayer_requests set deleted_at = now() where id = $1', [id]);
    return { success: true };
  }

  // Idempotent per user — tapping "I Prayed" twice does not inflate the count, per the
  // unique(prayer_request_id, user_id, type) constraint in the schema.
  async markPrayed(id: string, userId: string) {
    await this.findOne(id, userId); // ensures visibility before allowing the interaction
    await this.db.query(
      `insert into prayer_interactions (prayer_request_id, user_id, type)
       values ($1, $2, 'prayed')
       on conflict (prayer_request_id, user_id, type) do nothing`,
      [id, userId],
    );

    const owner = await this.db.query('select user_id from prayer_requests where id = $1', [id]);
    if (owner.rows[0]?.user_id && owner.rows[0].user_id !== userId) {
      await this.db.query(
        `insert into notifications (user_id, type, payload)
         values ($1, 'prayer_received', $2)`,
        [owner.rows[0].user_id, JSON.stringify({ prayerRequestId: id, prayedBy: userId })],
      );
    }

    return this.findOne(id, userId);
  }

  async listComments(id: string, userId: string) {
    await this.findOne(id, userId);
    const result = await this.db.query(
      `select c.*, u.username, u.display_name, u.avatar_url
       from prayer_comments c
       join users u on u.id = c.user_id
       where c.prayer_request_id = $1 and c.deleted_at is null
       order by c.created_at asc`,
      [id],
    );
    return result.rows;
  }

  async addComment(id: string, userId: string, dto: CreateCommentDto) {
    await this.findOne(id, userId);
    const result = await this.db.query(
      `insert into prayer_comments (prayer_request_id, user_id, body)
       values ($1, $2, $3) returning *`,
      [id, userId, dto.body],
    );
    return result.rows[0];
  }

  private serialize(row: any, viewerId: string) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      visibility: row.visibility,
      groupId: row.group_id,
      // Anonymous requests hide author identity from everyone except the owner viewing
      // their own request.
      author: row.is_anonymous && row.user_id !== viewerId
        ? { anonymous: true }
        : { id: row.user_id, username: row.username, displayName: row.display_name, avatarUrl: row.avatar_url },
      imageUrl: row.image_url,
      prayedCount: Number(row.prayed_count ?? 0),
      viewerHasPrayed: Boolean(row.viewer_has_prayed),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
