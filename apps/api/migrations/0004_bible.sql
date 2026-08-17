-- PrayerHubApp — Phase 5 schema: Bible integration
-- Run with: psql $DATABASE_URL -f 0004_bible.sql
-- Depends on 0001_init.sql (users).

create table scripture_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  translation text not null,       -- provider-specific translation id, e.g. "KJV", "de4e12af7f28f599-02"
  book_id text not null,           -- provider-specific book id, e.g. "JHN", "GEN"
  chapter int not null,
  verse_start int not null,
  verse_end int,
  reference_label text not null,   -- human-readable, e.g. "John 3:16"
  note text,
  highlighted_color text,          -- null = bookmark only, else a highlight color key
  created_at timestamptz not null default now()
);
create index idx_scripture_bookmarks_user on scripture_bookmarks(user_id);

-- Curated rotation for the home screen's "Daily Scripture" card — deterministic by
-- date so every user sees the same verse on a given day without needing a cron job
-- to pick one. Seeded with a handful of well-known encouragement verses; expand
-- freely, order doesn't matter since selection is `day_of_year % count`.
create table daily_verses (
  id uuid primary key default gen_random_uuid(),
  book_id text not null,
  chapter int not null,
  verse_start int not null,
  verse_end int,
  reference_label text not null
);

insert into daily_verses (book_id, chapter, verse_start, verse_end, reference_label) values
  ('PHP', 4, 6, 7, 'Philippians 4:6-7'),
  ('JER', 29, 11, 11, 'Jeremiah 29:11'),
  ('PSA', 23, 1, 3, 'Psalm 23:1-3'),
  ('ISA', 41, 10, 10, 'Isaiah 41:10'),
  ('ROM', 8, 28, 28, 'Romans 8:28'),
  ('PRO', 3, 5, 6, 'Proverbs 3:5-6'),
  ('MAT', 11, 28, 28, 'Matthew 11:28'),
  ('2CO', 12, 9, 9, '2 Corinthians 12:9'),
  ('JOS', 1, 9, 9, 'Joshua 1:9'),
  ('PSA', 46, 1, 1, 'Psalm 46:1');
