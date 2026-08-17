# Sprint 9 — Intelligence (matches Phase 8 of the master plan)

**Goal:** the PrayerHub Assistant (Scripture lookup, study questions, devotional prompts,
reading plans, discussion summaries, prayer structuring), interest-based recommendations,
semantic prayer-request search, and AI-assisted (never AI-automated) content moderation.

## Safety is the load-bearing requirement here
The master spec is explicit (section 21): never present generated text as God's direct
speech, prophecy, divine revelation, or guaranteed spiritual instruction; always distinguish
quotations from commentary; always cite references. This sprint enforces that at the
**system-prompt level** (`ai/assistant.prompts.ts`), shared across all six assistant modes so
it can't be silently dropped when a new mode is added, and again at the **UI level** — the
disclaimer in `AssistantScreen` is permanent, not a dismissible one-time modal.

## Stories

**1. AI Assistant — six modes**
- `POST /assistant/ask` (general Scripture/context questions, with optional conversation
  continuity), `/study-questions`, `/devotional-prompt`, `/reading-plan`,
  `/summarize-discussion`, `/structure-prayer`. Uses the Anthropic API directly
  (`ANTHROPIC_API_KEY` required); conversations persist to `ai_conversations`/`ai_messages`
  so history isn't just a client-side illusion. ✅ `ai/assistant.service.ts` — covered by
  `ai.spec.ts`, including a test that a supplied `conversationId` never leaks another user's
  prior turns.
- Rate-limited more tightly than normal CRUD (15/min) since each call has real inference cost.

**2. Recommendations**
- `GET /recommendations/groups` and `/people` — deliberately **not** embedding-dependent, so
  Home's "Suggested Communities" / "People to Pray With" cards (product spec section 5) work
  with zero external configuration. Ranks by group size and shared `user_interests` overlap —
  a legitimate baseline recommender, documented as a starting point for smarter ranking once
  there's real interaction data to learn from. ✅

**3. Semantic discovery**
- `GET /search/prayers?q=` uses pgvector cosine similarity over prayer-request embeddings
  (Voyage AI, `VOYAGE_API_KEY`), respecting the same visibility rule as the regular feed.
  **Honestly degrades**, not silently: with no `VOYAGE_API_KEY` configured, it falls back to
  keyword search and the response says `mode: "keyword_fallback"` so a UI can be transparent
  about which one ran rather than pretending semantic search always works. Indexing is
  fire-and-forget on create (`EmbeddingIndexerService`) — a slow or failed embedding call
  never blocks posting a prayer request. ✅ Requires the `pgvector` Postgres extension
  (`migrations/0008_intelligence.sql`).

**4. Content moderation assistance**
- `POST /reports` (finally implemented — spec'd since Sprint 1's API doc, built now that
  moderation has somewhere to route to) files a report and kicks off `AiTriageService`
  fire-and-forget, which asks Claude for a suggested severity/action/rationale and writes it
  to `moderation_cases`. **This is advisory only** — the AI triage service has no code path
  that changes report status, removes content, or bans a user; `GET /admin/moderation/queue`
  and `POST /admin/moderation/:caseId/resolve` are gated by the same `RolesGuard`
  (moderator/admin/super_admin) from Sprint 8, and resolution requires a human-written
  `resolutionNotes` string every time. ✅ — covered by `ai.spec.ts`.

## What's simplified for this sprint (documented, not hidden)
- No admin console UI yet for the moderation queue (same situation as Sprint 8's
  verification endpoint) — `GET /admin/moderation/queue` is real and callable today, waiting
  on the Admin Platform phase's UI.
- Recommendations use interest-overlap and popularity, not the AI/embeddings from this same
  sprint — a deliberate choice so core Home content doesn't depend on an external API key
  being configured (see Story 2). Blending in semantic similarity is a natural follow-up once
  `VOYAGE_API_KEY` is a given in production.
- `pgvector` availability is a real infrastructure requirement, not assumed — most managed
  Postgres providers support it, but self-hosted deployments need to confirm it's installed
  before running migration `0008`.

## Definition of done
- `npm test` passes, including `ai.spec.ts`.
- Manual check: `POST /assistant/study-questions` with a passage returns numbered questions
  with the Scripture reference and commentary visibly distinguished; `POST /reports` returns
  immediately and a `moderation_cases` row appears moments later with an AI severity
  suggestion (or without one, if `ANTHROPIC_API_KEY` triage fails — the report itself is never
  blocked either way).
