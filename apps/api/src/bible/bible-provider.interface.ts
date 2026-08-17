// Never assume a Bible translation is copyright-free — see docs/02-ARCHITECTURE.md
// section 10. This interface lets the app switch between a licensed provider
// (API.Bible, which requires a key and handles per-translation licensing) and a
// public-domain provider (KJV/WEB, safe to serve with no key) without any caller
// caring which one is active.
export interface BibleBook {
  id: string;
  name: string;
  testament: 'OT' | 'NT';
}

export interface BibleChapterRef {
  bookId: string;
  chapter: number;
}

export interface BiblePassage {
  reference: string;
  text: string;
  translation: string;
  copyright?: string;
}

export interface BibleProvider {
  readonly translationId: string;
  readonly translationName: string;
  listBooks(): Promise<BibleBook[]>;
  getChapter(ref: BibleChapterRef): Promise<BiblePassage>;
  getVerses(bookId: string, chapter: number, verseStart: number, verseEnd?: number): Promise<BiblePassage>;
  search(query: string): Promise<BiblePassage[]>;
}
