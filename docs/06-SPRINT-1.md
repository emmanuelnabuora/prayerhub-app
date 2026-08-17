# Sprint 1 — Foundation (matches Phase 1 of the master plan)

**Goal:** a user can register, log in, complete onboarding, and land on the 5-tab home shell,
end-to-end against a real Postgres database. This sprint's code is included in this delivery.

## Stories

**1. User registration**
- *As a visitor, I can register with email + password.*
- AC: duplicate email → 409; password < 8 chars → 400; success returns access + refresh
  token and creates a `member` role row. ✅ implemented in `auth.service.ts`.

**2. Login**
- *As a user, I can log in with email + password.*
- AC: wrong credentials → 401 (no distinction between "no such user" and "wrong password" in
  the response, to avoid user enumeration). ✅ implemented.

**3. Token refresh & logout**
- *As a client app, I can silently refresh an expired access token.*
- AC: refresh token is single-use (rotated); revoked/expired refresh token → 401. ✅ implemented,
  including the mobile Axios interceptor that does this automatically.

**4. Profile & onboarding fields**
- *As a user, I can view and update my profile and interests.*
- AC: `PATCH /users/me` updates only provided fields; interests replace the prior set
  atomically. ✅ implemented.

**5. Mobile navigation shell**
- *As a user, I land on a 5-tab app (Home/Pray/Live/Community/Profile) after auth.*
- AC: tabs render, theme matches the existing PrayerHubApp brand (indigo/parchment/flame).
  ✅ implemented in `apps/mobile/src/navigation`.

## Not in Sprint 1 (deliberately deferred)
Live audio rooms, prayer request feed UI, Bible integration, messaging, admin console — these
are real Phase 2+ work with their own stories once Sprint 1 is reviewed.

## Definition of done
- `npm test` passes in `apps/api` (starter AuthService spec included).
- Migration `0001_init.sql` applies cleanly to a fresh Postgres 15+ database.
- No secrets committed — only `.env.example`.
