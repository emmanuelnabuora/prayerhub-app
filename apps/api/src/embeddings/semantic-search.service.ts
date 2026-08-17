import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { EmbeddingProvider } from './embedding-provider.interface';
import { EMBEDDING_PROVIDER } from './embedding-indexer.service';

@Injectable()
export class SemanticSearchService {
  constructor(
    @Inject(PG_POOL) private readonly db: Pool,
    @Inject(EMBEDDING_PROVIDER) private readonly provider: EmbeddingProvider,
  ) {}

  // Finds prayer requests semantically similar to the query (pgvector cosine
  // distance, `<=>`), respecting the same visibility rule as the regular prayer
  // feed. Falls back to a plain ILIKE keyword search when no embedding provider
  // is configured — degraded, not broken, and the response tells the caller
  // which mode ran so a UI can be honest about it.
  async searchPrayerRequests(userId: string, query: string, limit = 10) {
    const queryEmbedding = await this.provider.embed(query);

    if (queryEmbedding) {
      const result = await this.db.query(
        `select pr.id, pr.title, pr.description, pr.visibility,
                1 - (pr.embedding <=> $2) as similarity
         from prayer_requests pr
         where pr.deleted_at is null and pr.embedding is not null and (
           pr.visibility = 'public' or pr.user_id = $1 or
           (pr.visibility = 'followers' and exists(select 1 from follows f where f.follower_id = $1 and f.followee_id = pr.user_id)) or
           (pr.visibility = 'group' and pr.group_id is not null and exists(select 1 from group_members gm where gm.group_id = pr.group_id and gm.user_id = $1))
         )
         order by pr.embedding <=> $2 asc limit $3`,
        [userId, this.toVectorLiteral(queryEmbedding), limit],
      );
      return { mode: 'semantic', results: result.rows };
    }

    const result = await this.db.query(
      `select id, title, description, visibility from prayer_requests
       where deleted_at is null and (title ilike $1 or description ilike $1)
         and (visibility = 'public' or user_id = $2)
       limit $3`,
      [`%${query}%`, userId, limit],
    );
    return { mode: 'keyword_fallback', results: result.rows };
  }

  private toVectorLiteral(embedding: number[]) {
    return `[${embedding.join(',')}]`;
  }
}
