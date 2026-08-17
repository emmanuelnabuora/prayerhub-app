# Sprint 3 — Live Audio Prayer Rooms (matches Phase 3 of the master plan)

**Goal:** a host can start a live audio prayer room, others can join as listeners, raise a
hand, get promoted to speaker, and pray together over real-time audio — with the host/co-host
able to moderate (mute, remove) at any time.

## Why a managed SFU (LiveKit)
Building a raw WebRTC SFU is a serious distributed-systems project on its own. A managed
provider (LiveKit, chosen here; Agora/100ms are drop-in alternatives behind `SfuProvider`)
gives us token-based room auth, server-side mute/remove, and horizontal scaling on day one,
which matches the "don't prematurely build infrastructure" principle in the master plan
(section 34).

## Stories

**1. Create/start a room**
- AC: immediate rooms go straight to `status: 'live'` and provision an SFU room; scheduled
  rooms start `scheduled` and only the host can call `/start`. Posting into a group requires
  membership. ✅ `live.service.ts`.

**2. Join and get an audio token**
- AC: the token's publish/subscribe rights are decided **server-side** from the participant's
  stored role — never from anything the client sends. A listener physically cannot publish
  audio because the SFU token never grants it. ✅

**3. Raise hand → promote to speaker**
- AC: only host/co-host can promote (`assertModerator`, checked against `room_participants`,
  not a client-supplied flag); promoting re-issues implicit publish rights by changing the
  stored role, which the next microphone action respects. ✅

**4. Moderation: mute / remove**
- AC: `/role` and `/remove` are host/co-host-only; every action writes a `room_events` row
  with the actor, so there's a full audit trail per room. ✅

**5. Real-time room state**
- AC: joins, hand-raises, role changes, and removals fan out over a WebSocket namespace
  (`live.gateway.ts`) so every client's UI updates within ~1s — but the WebSocket is a UI
  convenience layer only; REST calls remain the source of truth and authorization boundary.
  ✅

**6. Mobile: Live tab + Room screen**
- AC: room list with LIVE badges, create-room modal, in-room speaker grid, raise-hand /
  mic controls, host-only moderation actions, end-room. ✅ `LiveScreen.tsx`, `RoomScreen.tsx`.
  Note: the audio connection itself needs a native Dev Client build, not Expo Go — see
  `apps/mobile/README.md`.

## What's simplified for this sprint (documented, not hidden)
- `SfuProvider.muteParticipant` mutes the whole participant rather than iterating individual
  track SIDs — fine for a single-mic voice room, needs the full track-listing call for a
  production build with, e.g., screen share.
- Redis mirroring of live room state (docs/02-ARCHITECTURE.md section 3) is not implemented
  yet — the service reads Postgres directly, which is correct but not yet optimized for very
  large concurrent rooms. That's a scaling-phase task, not a Sprint 3 blocker.
- Push notifications for "room starting in 10 minutes" are not wired (needs FCM/APNs setup).

## Environment setup required
You'll need a LiveKit Cloud project (or self-hosted LiveKit server) and its URL/API key/secret
in `apps/api/.env` — see the updated `.env.example`.

## Definition of done
- `npm test` passes in `apps/api`, including the new authorization tests in
  `live.service.spec.ts` (a plain listener cannot promote or remove anyone).
- Manual check: host starts a room, a second user joins, raises hand, host promotes them,
  second user's mic control appears, host removes them, they're kicked from the SFU room.
