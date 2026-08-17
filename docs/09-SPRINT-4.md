# Sprint 4 — Prayer Groups (matches Phase 4 of the master plan)

**Goal:** users can create/discover/join prayer groups, group leaders manage membership and
roles, groups can carry a recurring meeting schedule, and members can post group-scoped
prayer requests — all of which Sprint 2's `prayer_requests.group_id` and Sprint 3's
`live_rooms.group_id` were already built to expect.

## Stories

**1. Create a group**
- AC: creator is automatically added as `leader`; visibility is public/private/invite_only.
  ✅ `groups.service.ts`.

**2. Discovery respects visibility**
- AC: private/invite-only groups never appear to non-members in `/groups` — enforced in the
  SQL `DISCOVERY_CLAUSE`, same defense-in-depth pattern as prayer request visibility. ✅

**3. Join flow**
- AC: public groups → instant membership. Private/invite-only → creates a pending row in
  `group_invites` (reusing the same table for both leader-issued invites and member
  self-requests, distinguished by `invited_by == invited_user_id`) that a leader/moderator
  must approve via `/groups/invites/:id/approve`. ✅

**4. Roles: member / moderator / leader**
- AC: only a `leader` can change another member's role; leader or moderator can remove a
  member; a group can never be left leaderless (leaving as the sole leader is blocked until
  another leader is assigned). ✅ — covered by `groups.service.spec.ts`.

**5. Recurring schedule**
- AC: leader sets `{days, time, timezone, durationMinutes}` via `PATCH /groups/:id/schedule`;
  stored as JSONB on `groups.recurring_schedule` (migration `0003`). Reminder delivery itself
  (the "Morning Prayer begins in 10 minutes" push from the master prompt's section 20) needs
  a scheduled job + FCM/APNs, which is Phase 2b/8 infrastructure — deliberately out of scope
  here; the schedule data model is in place for it to consume.

**6. Group-scoped prayer requests**
- AC: posting a `visibility: 'group'` request requires membership in that group — this check
  already existed in `PrayersService.create` from Sprint 2 and needed no changes; Sprint 4
  just adds the UI to reach it.

**7. Mobile: Community tab + Group detail**
- AC: My Groups / Discover tabs, create-group modal, join/request-to-join, group detail with
  member list, recurring-schedule display, and a group-scoped "share a prayer request" flow
  reusing the Sprint 2 `useCreatePrayerRequest` hook. ✅ `CommunityScreen.tsx`,
  `GroupDetailScreen.tsx`.

## Not in Sprint 4 (deliberately deferred)
Cell-group-specific features (attendance tracking, shared notes) and Bible-study-specific
features (reading plans, chapter discussion) reuse this same `groups` table via `group_type`
but need their own screens — that's Sprint 5 territory per the PRD's phase ordering.
Scheduled reminder delivery needs the notifications/push infrastructure from Phase 2b.

## Definition of done
- `npm test` passes, including `groups.service.spec.ts` (role-authorization checks).
- Manual check: create a private group as user A, user B requests to join, user A approves,
  user B now appears in `/groups/:id/members` and can post a `group`-visibility request.
