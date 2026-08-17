# PrayerHubApp — System Architecture

## 1. High-level shape
A **modular monolith** (not microservices) with clear domain boundaries, so it can scale to
millions of users without premature distributed-systems complexity. Domains: `auth`, `users`,
`prayer`, `groups`, `live-audio`, `bible`, `feed`, `messaging`, `orgs`, `notifications`,
`moderation`, `admin`. Each domain is an isolated NestJS module with its own service/repository
layer — extractable into a separate service later if load demands it (live-audio and
notifications are the most likely first candidates).

```
Mobile (Expo/RN) ──┐
                    ├─▶ REST/WS API Gateway (NestJS) ─▶ Postgres (primary)
Web Admin (Next.js)─┘         │                       ─▶ Redis (cache/presence/pub-sub)
                               │                       ─▶ Object storage (media, signed URLs)
                               ├─▶ Real-time audio (WebRTC SFU / managed provider e.g. LiveKit)
                               ├─▶ Push (FCM + APNs)
                               └─▶ Bible content provider (licensed API)
```

## 2. Backend
- **Framework:** NestJS (TypeScript), REST for CRUD, WebSocket gateway for presence/room events
  and live notifications.
- **ORM:** Prisma (or TypeORM) against PostgreSQL. Migrations are explicit SQL, checked in.
- **Auth:** JWT access tokens (short-lived, ~15 min) + rotating refresh tokens stored hashed;
  OAuth (Google/Apple) via Passport strategies; session/device table for revocation.
- **Authorization:** RBAC evaluated at the API layer via guards, AND re-checked at the query
  layer (row-level filters) so a bug in a controller can't leak private prayer content.
- **Validation:** class-validator DTOs on every endpoint.
- **Rate limiting:** Redis-backed, per-user and per-IP.

## 3. Live audio architecture
Prayer rooms are the highest-risk real-time component, so:
- Use a **managed SFU provider** (e.g., LiveKit, Agora, or 100ms) rather than building a raw
  WebRTC SFU from scratch — this is the standard, defensible choice for a v1 with limited infra
  team, and all three support token-based room auth, mute/kick server callbacks, and recording.
- Flow: client requests a room token from `/api/v1/live/rooms/:id/token` → API validates
  membership/role → issues short-lived signed token scoped to (room, role: host/speaker/
  listener) → client connects directly to the SFU.
- Room state (who's on stage, hand-raise queue, mute state) lives in **Redis**, mirrored to
  Postgres (`room_participants`, `room_events`) for history/moderation/audit — Redis is the
  source of truth for "live now," Postgres is the source of truth for "what happened."
  auth-service is not scale-critical.
- Moderation actions (mute/remove) are server-authoritative: a host's "remove" tap calls the API,
  the API calls the SFU provider's server SDK, then broadcasts state via WebSocket — the client
  never has power to eject someone by itself.
- Scaling path: start on a single managed-SFU tier; when room counts grow, shard by region using
  the provider's built-in multi-region routing rather than operating our own SFU fleet.

## 4. Mobile architecture (React Native + Expo + TypeScript)
```
apps/mobile/src/
  navigation/        # 5-tab root: Home, Pray, Live, Community, Profile
  screens/
  components/
  api/               # typed API client (generated from OpenAPI) + React Query hooks
  state/             # Zustand/Redux Toolkit for session, room, and draft state
  audio/             # SFU SDK wrapper, waveform player
  theme/             # design tokens (see design system doc)
```
- **Networking:** React Query for server state (caching, retries, offline-aware refetch);
  Axios/fetch client with auth-token refresh interceptor.
- **Local state:** Zustand for ephemeral UI/room state; secure storage (Expo SecureStore) for
  tokens.
- **Offline:** persisted cache for Scripture/devotionals the user has opened; feed/rooms degrade
  gracefully to "last known" state when offline.

## 5. Security architecture
- **Transport:** TLS everywhere; HSTS on web/admin.
- **At rest:** Postgres encryption at rest (managed provider); sensitive fields (e.g., private
  prayer text) get column-level encryption if the hosting provider doesn't encrypt the whole
  volume.
- **Secrets:** environment-injected via the platform's secrets manager, never committed —
  `.env.example` only, real `.env` is gitignored.
- **AuthZ defense in depth:** guard at controller (role check) + repository-level scoping (a
  private prayer request query always includes `WHERE visibility = 'private' AND owner_id =
  :userId OR ...`, never trusts the controller alone).
- **Abuse prevention:** rate limits on request creation, room creation, and messaging;
  automated spam/harassment heuristics feeding the moderation queue rather than auto-banning.
- **Audit log:** every admin/moderator action (ban, remove content, verify org) writes an
  immutable `audit_logs` row with actor, target, reason, timestamp.
- **Youth safety:** age captured at signup; accounts under platform-defined minimum age get
  restricted discovery (no DM from unconnected adults, no 1:1 audio rooms with adults) by
  default — enforced server-side, not just hidden in the UI.

## 6. Web admin (Next.js)
Server-rendered dashboard behind its own auth (separate elevated-privilege session), consuming
the same versioned API with `admin`-scoped tokens. All destructive actions require a
confirmation step and are logged to `audit_logs`.
