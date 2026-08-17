import { BibleService } from '../src/bible/bible.service';

describe('BibleService', () => {
  it('delegates chapter/verse/search calls to whichever provider is injected', async () => {
    const provider = {
      translationId: 'kjv',
      translationName: 'KJV',
      listBooks: jest.fn().mockResolvedValue([{ id: 'JHN', name: 'John', testament: 'NT' }]),
      getChapter: jest.fn().mockResolvedValue({ reference: 'John 3', text: '...', translation: 'kjv' }),
      getVerses: jest.fn().mockResolvedValue({ reference: 'John 3:16', text: 'For God so loved...', translation: 'kjv' }),
      search: jest.fn().mockResolvedValue([]),
    };
    const db = { query: jest.fn() };
    const service = new BibleService(db as any, provider as any);

    await service.listBooks();
    await service.getChapter('JHN', 3);
    await service.getVerses('JHN', 3, 16);
    await service.search('love');

    expect(provider.listBooks).toHaveBeenCalled();
    expect(provider.getChapter).toHaveBeenCalledWith({ bookId: 'JHN', chapter: 3 });
    expect(provider.getVerses).toHaveBeenCalledWith('JHN', 3, 16, undefined);
    expect(provider.search).toHaveBeenCalledWith('love');
  });

  it('picks the same daily verse for the same calendar day (deterministic, no randomness)', async () => {
    const provider = {
      translationId: 'kjv', translationName: 'KJV',
      listBooks: jest.fn(), getChapter: jest.fn(),
      getVerses: jest.fn().mockResolvedValue({ reference: 'Philippians 4:6-7', text: '...', translation: 'kjv' }),
      search: jest.fn(),
    };
    const db = {
      query: jest.fn((sql: string) => {
        if (sql.includes('count(*)')) return { rows: [{ count: '10' }] };
        return { rows: [{ book_id: 'PHP', chapter: 4, verse_start: 6, verse_end: 7, reference_label: 'Philippians 4:6-7' }] };
      }),
    };
    const service = new BibleService(db as any, provider as any);

    const first = await service.dailyVerse();
    const second = await service.dailyVerse();
    expect(first.referenceLabel).toEqual(second.referenceLabel);
  });
});
