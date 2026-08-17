# PrayerHubApp — Monorepo (Work Package 1)

This is the real starting foundation for PrayerHubApp: docs + a working Sprint 1.

## Structure
```
docs/                  Product & technical documentation (read these first)
apps/api/              NestJS backend — auth + users implemented against Postgres
apps/mobile/           Expo/React Native app — 5-tab navigation shell + API client
apps/web-admin/        Placeholder for the Next.js admin console (Phase 7+)
```

## Run the API locally
```bash
cd apps/api
npm install
cp .env.example .env        # fill in real secrets, including LIVEKIT_* for live audio
createdb prayerhub
npm run migrate             # applies migrations 0001–0008 (auth, live rooms, group schedule, bible, social, messaging, organizations, intelligence — requires the pgvector extension)
npm run start:dev           # http://localhost:4000/api/v1
```

## Run the mobile app
```bash
cd apps/mobile
npm install
npx expo start
```

## Docs index
1. `01-PRD.md` — product requirements, personas, feature matrix
2. `02-ARCHITECTURE.md` — system, mobile, live-audio, security architecture
3. `03-DATABASE-ERD.md` — entity relationships (see also `apps/api/migrations/0001_init.sql`)
4. `04-RBAC-MATRIX.md` — roles and permissions
5. `05-API-SPEC.md` — versioned REST API for the Phase 1–2 slice
6. `06-SPRINT-1.md` — Sprint 1 stories and acceptance criteria (auth + profile + nav shell)
7. `07-SPRINT-2.md` — Sprint 2 stories and acceptance criteria (prayer requests + journal)
8. `08-SPRINT-3.md` — Sprint 3 stories and acceptance criteria (live audio prayer rooms)
9. `09-SPRINT-4.md` — Sprint 4 stories and acceptance criteria (prayer groups)
10. `10-SPRINT-5.md` — Sprint 5 stories and acceptance criteria (Bible integration)
11. `11-SPRINT-6.md` — Sprint 6 stories and acceptance criteria (social: follow, feed, audio posts, testimonies, discovery)
12. `12-SPRINT-7.md` — Sprint 7 stories and acceptance criteria (messaging)
13. `13-SPRINT-8.md` — Sprint 8 stories and acceptance criteria (church & ministry hubs)
14. `14-SPRINT-9.md` — Sprint 9 stories and acceptance criteria (AI assistant, recommendations, semantic search, AI-assisted moderation)
15. `15-ADMIN-CONSOLE.md` — the Next.js admin console: auth, dashboard, moderation queue, org verification, user roles, audit log
16. `16-DESIGN-PASS.md` — the design system pass applied across all 17 mobile screens

## Deploying
`infra/DEPLOYING.md` — Dockerfiles, Cloud Build pipeline (with GitHub push-to-deploy trigger),
and Terraform for Cloud SQL (pgvector-enabled, private VPC), Memorystore, and Artifact
Registry. Start there for GCP deployment.

## What's real vs. what's next
Auth, users, prayer requests, the prayer journal, live audio rooms, prayer groups, Bible
integration, the social feed, testimonies, people search, messaging, church/ministry
organizations, the PrayerHub Assistant, recommendations, semantic search, AI-assisted report
triage, and now the **admin console itself** (`apps/web-admin`) — dashboard, moderation
queue with human-required resolution, organization verification, role management with a
server-enforced escalation guard, and a full audit log — are all genuine, runnable code in
this delivery. What's left from the master plan is primarily production DevOps/deployment
(CI/CD, staging/prod environments, infra-as-code) and UI polish across existing screens as
real usage surfaces what's missing.

## Running the admin console
```bash
cd apps/web-admin
npm install
cp .env.example .env.local
npm run dev   # http://localhost:3000 — log in with a moderator/admin/super_admin account
```
See `docs/15-ADMIN-CONSOLE.md` for the first-super-admin bootstrap step.
