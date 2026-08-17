-- PrayerHubApp — Phase 8 schema: AI assistant, semantic search, moderation cases
-- Run with: psql $DATABASE_URL -f 0008_intelligence.sql
-- Depends on 0001_init.sql (users, reports), 0005_social.sql (posts), prayer_requests.
--
-- REQUIRES the pgvector extension (https://github.com/pgvector/pgvector). Most
-- managed Postgres providers (Supabase, Neon, RDS 15+, Cloud SQL) support it via
-- `CREATE EXTENSION vector;` — if yours doesn't, semantic search degrades to the
-- keyword fallback already documented in SemanticSearchService rather than
-- failing the whole app; only this migration's vector columns are unavailable.
create extension if not exists vector;

-- Assistant conversations are persisted per-user (not just fire-and-forget
-- completions) so "continue where we left off" and a visible history are
-- possible later, and so every response can be traced back to what was asked —
-- relevant given the safety framing every assistant reply carries (see
-- ai/assistant.service.ts system prompt).
create table ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  kind text not null check (kind in ('ask','study_questions','devotional','reading_plan','summarize','structure_prayer')),
  created_at timestamptz not null default now()
);

create table ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index idx_ai_messages_conversation on ai_messages(conversation_id, created_at);

-- Semantic search embeddings — nullable and populated best-effort after create
-- (see embeddings/embedding-indexer.service.ts). A row with a null embedding
-- simply doesn't participate in semantic ranking; it's never a hard failure.
-- 1024 dimensions matches Voyage AI's voyage-3 model — change if you swap
-- embedding providers/models (see embeddings/embedding-provider.interface.ts).
alter table prayer_requests add column if not exists embedding vector(1024);
alter table posts add column if not exists embedding vector(1024);
create index if not exists idx_prayer_requests_embedding on prayer_requests
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists idx_posts_embedding on posts
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Moderation cases: AI produces an advisory triage (severity + suggested action
-- + rationale) the moment a report is filed, but never acts on it automatically
-- — a human moderator always makes the final call. See moderation/ for the
-- enforcement of that boundary in code, not just in this comment.
create table moderation_cases (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  ai_suggested_severity text check (ai_suggested_severity in ('low','medium','high')),
  ai_suggested_action text,
  ai_rationale text,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  reviewed_by uuid references users(id),
  reviewed_at timestamptz,
  resolution_notes text,
  created_at timestamptz not null default now()
);
create index idx_moderation_cases_status on moderation_cases(status);
