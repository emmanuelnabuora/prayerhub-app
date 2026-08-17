# Sprint 5 — Scripture / Bible Integration (matches Phase 5 of the master plan)

**Goal:** users can read Scripture by book/chapter, see a daily verse on Home, bookmark
passages, and tap a Scripture reference anywhere in the app to jump straight to it —
without the app ever assuming a translation is copyright-free.

## Licensing approach
Per `docs/02-ARCHITECTURE.md` section 10 ("never assume Bible translations are
copyright-free"), Bible content is served through a `BibleProvider` interface with two
implementations, switched by the `BIBLE_PROVIDER` env var:

- **`public_domain` (default)** — `bible-api.com`, serving KJV (public domain), no API key
  needed. This is what a fresh clone of the repo runs with zero configuration.
- **`api_bible`** — `scripture.api.bible`, a licensed aggregator that handles per-translation
  rights (including modern copyrighted translations like NIV/ESV where the org holds a
  license). Requires `BIBLE_API_KEY` and `BIBLE_ID` in production.

Swapping providers touches one factory (`bible-provider.factory.ts`) — no caller code
changes. This is the "architect translation providers so licensed and public-domain
translations can be configured independently" requirement from the master prompt, satisfied
directly rather than deferred.

## Stories

**1. Browse Scripture by book/chapter**
- AC: `GET /bible/books`, `GET /bible/chapters/:bookId/:chapter`; mobile `BibleReaderScreen`
  with a book picker and prev/next chapter nav. ✅

**2. Verse lookup**
- AC: `GET /bible/verses/:bookId/:chapter/:verseStart?verseEnd=`. ✅

**3. Search**
- AC: `GET /bible/search?q=`. Honest limitation: the public-domain provider (`bible-api.com`)
  has no search endpoint and returns `[]` — documented in code and here rather than faked.
  Full-text search works once `BIBLE_PROVIDER=api_bible` is configured.

**4. Daily Scripture**
- AC: `GET /bible/daily-verse` returns the same verse for everyone on a given calendar day,
  picked deterministically (`day_of_year % seeded_count`) from `daily_verses` — no cron job
  needed, no randomness to make non-deterministic in tests. Shown on the real `HomeScreen`
  now (replacing the Sprint 1 placeholder). ✅ — covered by `bible.service.spec.ts`.

**5. Bookmarks**
- AC: `POST/GET/DELETE /bible/bookmarks`, scoped to the owning user; stores the *reference*
  and provider translation id, not the passage text itself (so it stays correct if the
  provider's phrasing is ever updated). ✅

**6. Tap-anywhere Scripture references**
- AC: one reusable `<ScriptureLink>` component (not a per-screen reimplementation) that
  navigates into `BibleReaderScreen` with the right book/chapter/verse. ✅ Wired into the
  Home daily-verse card; ready to drop into testimonies/group posts as those screens land.

## What's simplified for this sprint (documented, not hidden)
- The public-domain provider's book list is a hardcoded partial canon (trimmed for brevity
  in the code, with a comment marking where to extend to the full 66 books) rather than
  fetched from an endpoint, since `bible-api.com` doesn't expose one.
- No offline caching of opened chapters yet — that's the Phase 5/offline-experience
  intersection (master prompt section 35), worth its own pass once more content types exist
  to cache alongside Scripture.

## Definition of done
- `npm test` passes, including `bible.service.spec.ts` (provider delegation + deterministic
  daily verse).
- Manual check: `GET /bible/daily-verse` twice on the same day returns the same reference;
  `GET /bible/chapters/JHN/3` returns real text from bible-api.com with no configuration.
