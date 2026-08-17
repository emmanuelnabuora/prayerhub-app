# Sprint 6 — Social (matches Phase 6 of the master plan, minus Messaging)

**Goal:** users can follow each other, post to a community feed (text, Scripture, or audio),
share testimonies, and discover people — the social layer that sits alongside prayer and
groups.

## Scope note: Messaging deferred
The master plan's Phase 6 list includes Messaging alongside Follow/Feed/Audio Posts/
Testimonies/Discovery. Messaging is its own real subsystem (1:1 + group threads, spam/abuse
controls, block-aware delivery) and deserves a dedicated sprint rather than being squeezed in
as an afterthought here — it's next (Sprint 7), immediately after this one, not pushed
indefinitely.

## Stories

**1. Follow / unfollow / block**
- AC: these endpoints were spec'd in `05-API-SPEC.md` back in Sprint 1 but never actually
  implemented — Sprint 6 builds them for real. Blocking severs any existing follow in both
  directions; you cannot follow someone who's blocked you or vice versa. ✅ `users.service.ts`.

**2. Social feed (text + Scripture posts)**
- AC: same visibility model as prayer requests (public/followers/group), enforced in SQL.
  Posting into a group requires membership. ✅ `posts.service.ts`.

**3. Audio posts**
- AC: the API server never touches audio bytes — `POST /media/upload-url` returns a signed
  PUT URL (S3-compatible, provider-swappable like Bible/live-audio), the client uploads
  directly, then `POST /media/:id/confirm` finalizes it, and only then can a post reference
  that `mediaAssetId`. An audio post with no confirmed media asset is rejected. ✅ — covered
  by `posts.service.spec.ts`.

**4. Testimonies**
- AC: public by design (no visibility field, matching the product intent that a shared
  testimony is meant to encourage the whole community); lightweight `amen`/`encourage`
  reactions. Sits alongside the Sprint 2 journal→testimony conversion flow — this sprint adds
  the public feed and reactions on top of the table that already existed. ✅
  `testimonies.service.ts`.

**5. Discovery: user search**
- AC: `GET /users/search?q=` (username/display name, case-insensitive). Group discovery
  already existed from Sprint 4 (`GET /groups`); Bible search from Sprint 5
  (`GET /bible/search`). A unified search results screen merging all three is a follow-up UI
  task, noted in `SearchScreen.tsx` rather than faked with placeholder tabs today.

**6. Mobile: Feed, Testimonies, Search, user profiles**
- AC: `FeedScreen` (post + react), `TestimoniesScreen` (react), `SearchScreen` (people),
  `UserProfileScreen` (follow), all reachable from the Home stack — Home is now the social
  hub, alongside the Daily Scripture / Live Now cards from Sprint 5. ✅

## What's simplified for this sprint (documented, not hidden)
- The Feed's "new post" modal covers text/Scripture; audio recording needs the device
  microphone + `useRequestUpload`/`useConfirmUpload` wired to a recorder UI, which is a
  distinct native-audio task (similar caveat to Sprint 3's Dev Client requirement) — the API
  and hooks are ready, the recorder screen is next.
- `<ScriptureLink>` from Sprint 5 isn't yet wired into feed/testimony bodies for inline
  reference tapping — worth doing once post bodies commonly contain references.

## Definition of done
- `npm test` passes, including `posts.service.spec.ts`.
- Manual check: user A follows user B, B posts `followers`-visibility content, A sees it in
  `/feed` and a stranger does not.
