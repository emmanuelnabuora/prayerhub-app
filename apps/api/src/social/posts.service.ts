import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { CreatePostDto, CreateCommentDto } from './dto';
import { EmbeddingIndexerService } from '../embeddings/embedding-indexer.service';

// Same defense-in-depth visibility pattern used for prayer requests and groups —
// enforced in SQL, not just hidden by the client.
const VISIBILITY_CLAUSE = `
  (
    p.visibility = 'public'
    or p.user_id = $1
    or (p.visibility = 'followers' and exists (
          select 1 from follows f where f.follower_id = $1 and f.followee_id = p.user_id))
    or (p.visibility = 'group' and p.group_id is not null and exists (
          select 1 from group_members gm where gm.group_id = p.group_id and gm.user_id = $1))
  )
`;

@Injectable()
export class PostsService {
  constructor(
    @Inject(PG_POOL) private readonly db: Pool,
    private readonly embeddingIndexer: EmbeddingIndexerService,
  ) {}

  async create(userId: string, dto: CreatePostDto) {
    if (dto.type === 'audio' && !dto.mediaAssetId) {
      throw new ForbiddenException('Audio posts require a mediaAssetId (see /media/upload-url)');
    }
    if (dto.groupId) {
      const membership = await this.db.query(
        'select 1 from group_members where group_id = $1 and user_id = $2', [dto.groupId, userId],
      );
      if (!membership.rowCount) throw new ForbiddenException('Not a member of that group');
    }

    const result = await this.db.query(
      `insert into posts (user_id, group_id, type, body, scripture_reference, media_asset_id,
                           shared_testimony_id, visibility)
       values ($1, $2, $3, $4, $5, $6, $7, $8) returning *`,
      [userId, dto.groupId ?? null, dto.type, dto.body ?? null, dto.scriptureReference ?? null,
       dto.mediaAssetId ?? null, dto.sharedTestimonyId ?? null, dto.visibility ?? 'public'],
    );
    if (result.rows[0].body) {
      this.embeddingIndexer.indexPost(result.rows[0].id, result.rows[0].body).catch(() => undefined);
    }
    return this.findOne(result.rows[0].id, userId);
  }

  async feed(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const result = await this.db.query(
      `select p.*, u.username, u.display_name, u.avatar_url,
              m.public_url as media_url, m.duration_seconds as media_duration,
              (select count(*) from post_reactions pr where pr.post_id = p.id) as reaction_count,
              (select count(*) from post_comments pc where pc.post_id = p.id and pc.deleted_at is null) as comment_count
       from posts p
       join users u on u.id = p.user_id
       left join media_assets m on m.id = p.media_asset_id
       where p.deleted_at is null and ${VISIBILITY_CLAUSE}
       order by p.created_at desc
       limit $2 offset $3`,
      [userId, limit, offset],
    );
    return result.rows.map(this.serialize);
  }

  async findOne(id: string, userId: string) {
    const result = await this.db.query(
      `select p.*, u.username, u.display_name, u.avatar_url,
              m.public_url as media_url, m.duration_seconds as media_duration,
              (select count(*) from post_reactions pr where pr.post_id = p.id) as reaction_count,
              (select count(*) from post_comments pc where pc.post_id = p.id and pc.deleted_at is null) as comment_count
       from posts p
       join users u on u.id = p.user_id
       left join media_assets m on m.id = p.media_asset_id
       where p.id = $2 and p.deleted_at is null and ${VISIBILITY_CLAUSE}`,
      [userId, id],
    );
    if (!result.rowCount) throw new NotFoundException('Post not found or not visible');
    return this.serialize(result.rows[0]);
  }

  async react(id: string, userId: string, type: string) {
    await this.findOne(id, userId);
    await this.db.query(
      `insert into post_reactions (post_id, user_id, type) values ($1, $2, $3)
       on conflict (post_id, user_id, type) do nothing`,
      [id, userId, type],
    );
    return { success: true };
  }

  async listComments(id: string, userId: string) {
    await this.findOne(id, userId);
    const result = await this.db.query(
      `select c.*, u.username, u.display_name, u.avatar_url from post_comments c
       join users u on u.id = c.user_id
       where c.post_id = $1 and c.deleted_at is null order by c.created_at asc`,
      [id],
    );
    return result.rows;
  }

  async addComment(id: string, userId: string, dto: CreateCommentDto) {
    await this.findOne(id, userId);
    const result = await this.db.query(
      `insert into post_comments (post_id, user_id, body) values ($1, $2, $3) returning *`,
      [id, userId, dto.body],
    );
    return result.rows[0];
  }

  async remove(id: string, userId: string) {
    const existing = await this.db.query('select user_id from posts where id = $1 and deleted_at is null', [id]);
    if (!existing.rowCount) throw new NotFoundException('Post not found');
    if (existing.rows[0].user_id !== userId) throw new ForbiddenException('Not the owner');
    await this.db.query('update posts set deleted_at = now() where id = $1', [id]);
    return { success: true };
  }

  private serialize(row: any) {
    return {
      id: row.id,
      type: row.type,
      body: row.body,
      scriptureReference: row.scripture_reference,
      groupId: row.group_id,
      visibility: row.visibility,
      author: { id: row.user_id, username: row.username, displayName: row.display_name, avatarUrl: row.avatar_url },
      media: row.media_url ? { url: row.media_url, durationSeconds: row.media_duration } : null,
      sharedTestimonyId: row.shared_testimony_id,
      reactionCount: Number(row.reaction_count ?? 0),
      commentCount: Number(row.comment_count ?? 0),
      createdAt: row.created_at,
    };
  }
}
