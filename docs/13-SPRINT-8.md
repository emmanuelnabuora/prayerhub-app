# Sprint 8 — Church & Ministry Hubs (matches Phase 7 of the master plan)

**Goal:** churches and ministries can register a verified organizational profile, gather
followers, post announcements, and operate multiple prayer/cell/Bible-study groups and live
rooms under one roof.

## Design decision: one `organizations` table, typed
Rather than separate `churches` and `ministries` tables (as loosely implied by the master
schema list), this sprint uses one `organizations` table with `type: 'church' | 'ministry'` —
the same pattern already established for `groups.group_type` (prayer/cell/bible_study) in
Sprint 4. Both are "an org with leadership, followers, and content," differing only in a
label; a shared table avoids duplicating every feature (announcements, verification, group
linking) across two schemas that would only ever diverge cosmetically.

## Stories

**1. Register an organization**
- AC: creator becomes its first `leader`; slug must be unique; starts `verified: false`.
  ✅ `organizations.service.ts`.

**2. Verification is platform-admin-only**
- AC: `POST /organizations/:id/verify` is gated by a new `RolesGuard` + `@Roles('admin',
  'super_admin')` checked against `user_roles` (platform scope) — an organization's own
  leaders have no path to self-verify, matching the RBAC matrix from Sprint 1
  (`04-RBAC-MATRIX.md`: "Verify organization" is Admin/Super Admin only). This is also the
  first real enforcement of the platform-role guard the docs described back then — it existed
  on paper since Sprint 1 and is implemented now that something actually needs it. ✅ —
  covered by `organizations.spec.ts`.

**3. Leadership & followers are distinct**
- AC: `organization_members` (leadership/staff, can manage the org) is a separate table from
  `organization_followers` (anyone who wants updates) — matching the product spec's explicit
  "Leadership" vs. "Followers" feature list rather than conflating the two the way a single
  group's membership table does.

**4. Announcements**
- AC: leader-only to post; visible to anyone viewing the org. ✅

**5. Link existing groups to an organization**
- AC: requires the actor to lead **both** the organization and the group being linked — an
  org leader can't unilaterally annex someone else's independent prayer group. ✅ — covered
  by `organizations.spec.ts`.

**6. Mobile: Organizations directory + detail**
- AC: reachable from Community ("Churches & Ministries"); register modal, follow, post
  announcement (leaders only), linked-groups list. ✅ `OrganizationsScreen.tsx`,
  `OrganizationDetailScreen.tsx`.

## What's simplified for this sprint (documented, not hidden)
- Sermons and livestream embeds are not built — `livestreamUrl` exists as a field on the org
  (settable via `PATCH /organizations/:id`) but there's no sermon-library UI yet; that's a
  content-management feature worth its own pass once organizations have real usage to design
  around.
- The `verify` endpoint has no admin *console* to call it from yet — it's a real, authorized
  API endpoint, callable today via `curl` by anyone holding the `admin`/`super_admin` role,
  and is exactly what Phase "Admin Platform" (master plan section 26) will build a UI on top
  of rather than needing new backend work.

## Definition of done
- `npm test` passes, including `organizations.spec.ts` (RolesGuard behavior + group-linking
  authorization).
- Manual check: user A registers a church, it shows `verified: false`; a user holding the
  `admin` role calls `/organizations/:id/verify` successfully; a non-admin user gets 403 on
  the same call.
