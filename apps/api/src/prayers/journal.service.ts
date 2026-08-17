import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { CreateJournalEntryDto } from './dto';

// The journal is always scoped to the owning user — every query includes user_id = $1,
// so there is no endpoint shape that can return one person's journal to another.
@Injectable()
export class JournalService {
  constructor(@Inject(PG_POOL) private readonly db: Pool) {}

  async list(userId: string) {
    const result = await this.db.query(
      'select * from prayer_journals where user_id = $1 order by created_at desc',
      [userId],
    );
    return result.rows;
  }

  async create(userId: string, dto: CreateJournalEntryDto) {
    const result = await this.db.query(
      `insert into prayer_journals (user_id, title, body, scripture_reference, category)
       values ($1, $2, $3, $4, $5) returning *`,
      [userId, dto.title ?? null, dto.body, dto.scriptureReference ?? null, dto.category ?? null],
    );
    return result.rows[0];
  }

  async markAnswered(id: string, userId: string) {
    const entry = await this.assertOwner(id, userId);
    const result = await this.db.query(
      `update prayer_journals set status = 'answered', answered_at = now(), updated_at = now()
       where id = $1 returning *`,
      [id],
    );
    return result.rows[0];
  }

  async convertToTestimony(id: string, userId: string) {
    const entry = await this.assertOwner(id, userId);
    if (entry.status !== 'answered') {
      throw new ForbiddenException('Only answered prayers can become testimonies');
    }

    const testimony = await this.db.query(
      `insert into testimonies (user_id, category, body, media_type)
       values ($1, coalesce($2, 'Answered Prayer'), $3, 'text') returning *`,
      [userId, entry.category, entry.body],
    );

    await this.db.query(
      'update prayer_journals set converted_to_testimony_id = $1, updated_at = now() where id = $2',
      [testimony.rows[0].id, id],
    );

    return testimony.rows[0];
  }

  private async assertOwner(id: string, userId: string) {
    const result = await this.db.query('select * from prayer_journals where id = $1', [id]);
    if (!result.rowCount) throw new NotFoundException('Journal entry not found');
    if (result.rows[0].user_id !== userId) throw new ForbiddenException('Not the owner');
    return result.rows[0];
  }
}
