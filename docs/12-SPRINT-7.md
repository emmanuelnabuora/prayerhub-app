# Sprint 7 — Messaging (completes Phase 6 of the master plan)

**Goal:** 1:1 and group messaging, with the same block-awareness and real-time delivery
pattern established in Sprints 3 (live rooms) and 6 (feed).

## Stories

**1. Direct conversations — exactly one per pair**
- AC: `POST /conversations/direct` is idempotent — calling it twice for the same two users
  returns the same conversation, enforced by a unique `direct_pair_key` (sorted, hashed user
  ids) rather than a race-prone "check then insert." Blocked users cannot start a
  conversation in either direction. ✅ `messages.service.ts` —
  covered by `messages.service.spec.ts`.

**2. Group conversations**
- AC: `POST /conversations/group` with a title and member list; creator is auto-included.

**3. Sending messages**
- AC: sender must be a conversation member (checked server-side, not inferred from the
  client); block status is **re-checked at send time**, not just at conversation creation —
  if two members block each other mid-thread, new messages stop immediately even though the
  conversation and history remain. Rate-limited to 30/min per user. ✅

**4. Real-time delivery**
- AC: a WebSocket gateway (`messages.gateway.ts`, same pattern as `live.gateway.ts`) fans a
  sent message out to other members' open sockets. As with the live-room gateway, the socket
  is a UI-latency layer only — the REST endpoint remains the sole path that can actually
  create a message, so a compromised socket client still can't forge messages as another
  user. ✅

**5. Read state**
- AC: `POST /conversations/:id/read` updates `last_read_at`; conversation list shows an
  unread count computed from messages after that timestamp. ✅

**6. Content types**
- AC: `text` implemented in the mobile composer today; `scripture`, `image`, `audio`, and
  `prayer_request` share are supported by the schema and API (same `mediaAssetId` pattern as
  Sprint 6's audio posts) but not yet in the `ChatScreen` UI — documented here as the
  immediate next UI increment rather than built as a fake button.

**7. Block/report integration**
- AC: blocking (Sprint 6) immediately affects messaging, as above. Reporting a message reuses
  the existing `reports` table (`target_type: 'message'`) from the Phase 1 schema — no new
  moderation plumbing needed, just a report button in the chat UI, left for the moderation-
  queue sprint (Phase admin/8) where the review side will actually be built.

## Mobile
- `ConversationsScreen` — list with unread badges, reachable from Profile
- `ChatScreen` — message list, composer, real-time updates via `useMessagesSocket`
- `UserProfileScreen` now has a **Message** button that starts/opens a direct conversation

## Definition of done
- `npm test` passes, including `messages.service.spec.ts`.
- Manual check: user A starts a conversation with user B, sends a message, user B's
  `ChatScreen` (if open) receives it over the socket without a manual refresh; user B blocks
  user A, and A's next send attempt is rejected with 403.
