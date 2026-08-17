import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { BIBLE_PROVIDER } from './bible-provider.factory';
import { BibleProvider } from './bible-provider.interface';
import { CreateBookmarkDto } from './dto';

@Injectable()
export class BibleService {
  constructor(
    @Inject(PG_POOL) private readonly db: Pool,
    @Inject(BIBLE_PROVIDER) private readonly provider: BibleProvider,
  ) {}

  listBooks() {
    return this.provider.listBooks();
  }

  getChapter(bookId: string, chapter: number) {
    return this.provider.getChapter({ bookId, chapter });
  }

  getVerses(bookId: string, chapter: number, verseStart: number, verseEnd?: number) {
    return this.provider.getVerses(bookId, chapter, verseStart, verseEnd);
  }

  search(query: string) {
    return this.provider.search(query);
  }

  // Deterministic by calendar day so every user sees the same verse without a
  // cron job — see migration 0004_bible.sql for the seeded rotation.
  async dailyVerse() {
    const countResult = await this.db.query('select count(*) from daily_verses');
    const count = Number(countResult.rows[0].count);
    if (!count) throw new NotFoundException('No daily verses seeded');

    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
    );
    const offset = dayOfYear % count;

    const row = await this.db.query('select * from daily_verses order by id limit 1 offset $1', [offset]);
    const verse = row.rows[0];
    const passage = await this.provider.getVerses(verse.book_id, verse.chapter, verse.verse_start, verse.verse_end);
    return { ...passage, referenceLabel: verse.reference_label };
  }

  async listBookmarks(userId: string) {
    const result = await this.db.query(
      'select * from scripture_bookmarks where user_id = $1 order by created_at desc', [userId],
    );
    return result.rows;
  }

  async addBookmark(userId: string, dto: CreateBookmarkDto) {
    const result = await this.db.query(
      `insert into scripture_bookmarks
         (user_id, translation, book_id, chapter, verse_start, verse_end, reference_label, note, highlighted_color)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *`,
      [userId, this.provider.translationId, dto.bookId, dto.chapter, dto.verseStart,
       dto.verseEnd ?? null, dto.referenceLabel, dto.note ?? null, dto.highlightedColor ?? null],
    );
    return result.rows[0];
  }

  async removeBookmark(id: string, userId: string) {
    await this.db.query('delete from scripture_bookmarks where id = $1 and user_id = $2', [id, userId]);
    return { success: true };
  }
}
