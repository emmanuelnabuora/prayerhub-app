import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { BibleProvider, BibleBook, BibleChapterRef, BiblePassage } from '../bible-provider.interface';

// Licensed provider using API.Bible (scripture.api.bible), which manages per-
// translation licensing (including copyrighted modern translations like NIV, ESV
// where the org holds a license) — the right choice for production per
// docs/02-ARCHITECTURE.md section 10. Requires BIBLE_API_KEY and BIBLE_ID env vars;
// BIBLE_ID selects which licensed translation this provider instance serves.
@Injectable()
export class ApiBibleProvider implements BibleProvider {
  readonly translationId = process.env.BIBLE_ID ?? '';
  readonly translationName = process.env.BIBLE_TRANSLATION_NAME ?? 'Licensed translation';
  private readonly baseUrl = 'https://api.scripture.api.bible/v1';
  private readonly headers = { 'api-key': process.env.BIBLE_API_KEY ?? '' };

  async listBooks(): Promise<BibleBook[]> {
    const { data } = await axios.get(`${this.baseUrl}/bibles/${this.translationId}/books`, { headers: this.headers });
    return data.data.map((b: any) => ({ id: b.id, name: b.name, testament: this.inferTestament(b.id) }));
  }

  async getChapter(ref: BibleChapterRef): Promise<BiblePassage> {
    const chapterId = `${ref.bookId}.${ref.chapter}`;
    const { data } = await axios.get(
      `${this.baseUrl}/bibles/${this.translationId}/chapters/${chapterId}`,
      { headers: this.headers, params: { 'content-type': 'text', 'include-verse-numbers': true } },
    );
    return {
      reference: data.data.reference,
      text: data.data.content,
      translation: this.translationId,
      copyright: data.data.copyright,
    };
  }

  async getVerses(bookId: string, chapter: number, verseStart: number, verseEnd?: number): Promise<BiblePassage> {
    const verseId = verseEnd && verseEnd !== verseStart
      ? `${bookId}.${chapter}.${verseStart}-${bookId}.${chapter}.${verseEnd}`
      : `${bookId}.${chapter}.${verseStart}`;
    const { data } = await axios.get(
      `${this.baseUrl}/bibles/${this.translationId}/verses/${verseId}`,
      { headers: this.headers, params: { 'content-type': 'text' } },
    );
    return {
      reference: data.data.reference,
      text: data.data.content,
      translation: this.translationId,
      copyright: data.data.copyright,
    };
  }

  async search(query: string): Promise<BiblePassage[]> {
    const { data } = await axios.get(
      `${this.baseUrl}/bibles/${this.translationId}/search`,
      { headers: this.headers, params: { query, limit: 20 } },
    );
    return (data.data.verses ?? []).map((v: any) => ({
      reference: v.reference, text: v.text, translation: this.translationId,
    }));
  }

  private inferTestament(bookId: string): 'OT' | 'NT' {
    const NT_BOOKS = ['MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL',
      '1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD','REV'];
    return NT_BOOKS.includes(bookId) ? 'NT' : 'OT';
  }
}
