-- PrayerHubApp — messaging (direct + group threads)
-- Run with: psql $DATABASE_URL -f 0006_messaging.sql
-- Depends on 0001_init.sql (users, blocks), 0005_social.sql (media_assets).

create table conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('direct','group')),
  title text,                        -- group conversations only; direct threads derive a title client-side
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table conversation_members (
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  muted boolean not null default false,
  primary key (conversation_id, user_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references users(id),
  type text not null default 'text' check (type in ('text','scripture','image','audio','prayer_request')),
  body text,
  scripture_reference text,
  media_asset_id uuid references media_assets(id) on delete set null,
  shared_prayer_request_id uuid references prayer_requests(id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_messages_conversation on messages(conversation_id, created_at);

-- Enforces exactly one direct conversation per unordered pair of users: both
-- members' ids, sorted, hashed into a deterministic key. Populated by
-- MessagesService.findOrCreateDirect rather than a DB trigger, to keep the
-- "block prevents new conversations" rule in application code where the rest of
-- the authorization logic already lives.
alter table conversations add column if not exists direct_pair_key text unique;
