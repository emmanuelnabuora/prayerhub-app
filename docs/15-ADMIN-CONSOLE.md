# Admin Console (Next.js) — matches master plan section 26

**Goal:** a secure web dashboard for platform admins/moderators — the UI that every
admin-gated backend endpoint since Sprint 8 has been waiting on, not new backend logic.

## What's real
- **Auth**: uses the exact same `/auth/login` every mobile user hits — there's no separate
  admin login endpoint. After login, the app calls `/admin/moderation/queue` (accessible to
  moderator/admin/super_admin) as an "are you allowed in here at all" check; a normal member
  account logs in fine but is bounced back to `/login` with an explanation, never silently
  into an empty dashboard. Session token is stored in an **httpOnly cookie**, never
  client-side JS-readable localStorage.
- **Dashboard**: real counts from `AdminService.stats()` (Sprint 9) — total/DAU/MAU users,
  active live rooms, prayer requests, groups, organizations, open moderation cases.
  Admin-only; a moderator-only account sees a graceful explanation instead of a 403 crash.
- **Moderation Queue**: lists open `moderation_cases` with the AI-suggested severity/action
  from Sprint 9's `AiTriageService`, and a resolve form that **requires a human-typed
  resolution note** — this page is the actual decision point the whole AI-triage pipeline
  was built to feed into, not a rubber stamp on the AI's suggestion.
- **Organizations**: pending-verification list with a one-click Verify button hitting the
  admin-gated `/organizations/:id/verify` endpoint from Sprint 8.
- **Users & Roles**: search users, see their platform roles, grant/revoke `moderator`/
  `admin`/`super_admin`. The privilege-escalation guard lives in the API
  (`AdminService.grantRole` — only a `super_admin` can grant `admin`/`super_admin`), not just
  hidden in this UI, so a crafted request can't bypass it.
- **Audit Log**: read-only view of `audit_logs` — every sensitive action across the whole
  app (role grants, org verification, moderation resolutions) writes here, so this one page
  is a complete trail.

## The bootstrap problem
Every role grant requires the granter to already hold `super_admin`. That means the very
first super_admin can't come from the API — a standard chicken-and-egg problem for any RBAC
system's first operator. Run `apps/api/scripts/bootstrap-super-admin.sql` once, by hand,
after registering the first real admin account normally through the app.

## What's simplified for this sprint (documented, not hidden)
- No user suspension/ban action yet — role revocation exists, but "ban this account
  entirely" (soft-delete + session revocation) is a natural next endpoint once there's a real
  case that needs it, rather than built speculatively now.
- No content moderation actions beyond resolving a case (e.g., a one-click "remove this
  prayer request" from the queue) — the moderator can see what was reported and resolve the
  case, but removing the underlying content still means finding it via its own screen. Wiring
  a direct "remove content" action into the queue is the natural next increment.
- Stats are simple counts, not a charting/trends dashboard — matches the "modular monolith,
  don't over-build" principle from `02-ARCHITECTURE.md`; a trends view is worth building once
  there's enough historical data to make a trend line meaningful.

## Running it
```bash
cd apps/web-admin
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL, defaults to localhost:4000
npm run dev                  # http://localhost:3000
```
Log in with any account that holds `moderator`, `admin`, or `super_admin` — see the
bootstrap script above if this is a fresh database.
