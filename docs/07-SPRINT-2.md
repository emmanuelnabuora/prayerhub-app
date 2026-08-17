# Sprint 2 — Prayer (matches Phase 2 of the master plan)

**Goal:** a user can post a prayer request, others can pray for it, comment, and the owner
gets notified — plus a private journal that can graduate an answered prayer into a testimony.

## Stories

**1. Create a prayer request**
- AC: `title`/`description` required; `visibility` must be one of public/followers/group/
  private; posting into a group requires membership (403 otherwise). ✅ `prayers.service.ts`.

**2. Feed shows only what the viewer is allowed to see**
- AC: a `private` request never appears to anyone but its owner; a `followers` request only
  appears to followers of the owner; a `group` request only appears to members of that group.
  This is enforced in the SQL `WHERE` clause itself (`VISIBILITY_CLAUSE`), not just in the
  controller, so it can't be bypassed by a future endpoint that forgets a check. ✅

**3. "I Prayed"**
- AC: tapping twice does not double-count (`unique(prayer_request_id, user_id, type)`
  constraint + `ON CONFLICT DO NOTHING`); the owner gets a `prayer_received` notification
  row (not a push yet — push delivery is Phase 2b once FCM/APNs are wired). ✅

**4. Comments**
- AC: rate-limited to 20/min per user; only visible to users who can already see the parent
  request (comments route re-checks visibility via `findOne`). ✅

**5. Anonymous requests**
- AC: `isAnonymous: true` hides the author from everyone but the owner, in the API response
  itself — the client never receives the real author to accidentally display. ✅

**6. Prayer journal**
- AC: entries are private by construction (no visibility field — every query is scoped to
  `user_id`); status moves `praying → waiting → answered`; only an `answered` entry can be
  converted to a testimony, which creates a real `testimonies` row. ✅

**7. Mobile: Pray tab + Journal screen**
- AC: Pray tab lists the feed, supports "I Prayed" and posting a new request via a modal;
  Journal is reachable from Profile (not a top-level tab, since it's private) and supports
  add / mark-answered / convert-to-testimony. ✅ `PrayScreen.tsx`, `JournalScreen.tsx`.

## Not in Sprint 2 (deliberately deferred)
Push notification delivery (FCM/APNs), group creation UI, testimony feed UI, moderation queue
UI. These follow once Sprint 2 is reviewed, per the phase ordering in the PRD.

## Definition of done
- `npm test` passes in `apps/api` (AuthService + PrayersService specs included).
- Manual check: register two users, have user B post a `followers`-visibility request, confirm
  user A cannot see it in `/prayers` until following user B.
