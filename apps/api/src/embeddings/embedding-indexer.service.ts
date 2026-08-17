import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { EmbeddingProvider } from './embedding-provider.interface';

export const EMBEDDING_PROVIDER = 'EMBEDDING_PROVIDER';

// Called fire-and-forget after a prayer request or post is created (see
// PrayersService/PostsService) — indexing failure never blocks or fails the
// original create request. This is the deliberate trade-off documented in
// docs/14-SPRINT-9.md: a request could theoretically return before its
// embedding is written, so it's briefly absent from semantic search results
// until the next indexing pass, which is an acceptable staleness window for a
// "find similar prayers" feature, unlike, say, payment processing.
@Injectable()
export class EmbeddingIndexerService {
  private readonly logger = new Logger(EmbeddingIndexerService.name);

  constructor(
    @Inject(PG_POOL) private readonly db: Pool,
    @Inject(EMBEDDING_PROVIDER) private readonly provider: EmbeddingProvider,
  ) {}

  async indexPrayerRequest(id: string, text: string) {
    const embedding = await this.provider.embed(text);
    if (!embedding) return;
    await this.db.query('update prayer_requests set embedding = $2 where id = $1', [id, this.toVectorLiteral(embedding)])
      .catch((err) => this.logger.warn(`Failed to store embedding for prayer_request ${id}: ${err}`));
  }

  async indexPost(id: string, text: string) {
    const embedding = await this.provider.embed(text);
    if (!embedding) return;
    await this.db.query('update posts set embedding = $2 where id = $1', [id, this.toVectorLiteral(embedding)])
      .catch((err) => this.logger.warn(`Failed to store embedding for post ${id}: ${err}`));
  }

  private toVectorLiteral(embedding: number[]) {
    return `[${embedding.join(',')}]`;
  }
}
