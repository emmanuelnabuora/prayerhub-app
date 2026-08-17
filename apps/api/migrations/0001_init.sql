-- PrayerHubApp — Phase 1 & 2 core schema
-- Run with: psql $DATABASE_URL -f 0001_init.sql

create extension if not exists "pgcrypto";

create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  phone text unique,
  password_hash text,               -- null for OAuth-only accounts
  username text unique not null,
  display_name text not null,
  avatar_url text,
  country text,
  timezone text,
  languages text[] default '{}',
  date_of_birth date,               -- required for age-gated safety rules
  church_affiliation text,
  bio text,
  email_verified_at timestamptz,
  phone_verified_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table oauth_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  provider text not null check (provider in ('google','apple')),
  provider_user_id text not null,
  created_at timestamptz not null default now(),
  unique(provider, provider_user_id)
);

create table roles (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,          -- member, group_leader, prayer_host, ministry, moderator, admin, super_admin
  description text
);

create table user_roles (
  user_id uuid not null references users(id) on delete cascade,
  role_id uuid not null references roles(id) on delete cascade,
  scope_type text not null default 'platform',  -- platform | group | organization
  scope_id uuid,                                  -- null for platform-scoped roles
  created_at timestamptz not null default now(),
  primary key (user_id, role_id, scope_type, scope_id)
);

create table user_interests (
  user_id uuid not null references users(id) on delete cascade,
  interest text not null,             -- Prayer, Bible Study, Marriage, ... (see PRD section 4)
  primary key (user_id, interest)
);

create table devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  push_token text,
  platform text check (platform in ('ios','android','web')),
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  refresh_token_hash text not null,
  device_id uuid references devices(id) on delete set null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_sessions_user on sessions(user_id);

create table follows (
  follower_id uuid not null references users(id) on delete cascade,
  followee_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create table blocks (
  blocker_id uuid not null references users(id) on delete cascade,
  blocked_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  cover_image_url text,
  visibility text not null check (visibility in ('public','private','invite_only')),
  group_type text not null default 'prayer' check (group_type in ('prayer','cell','bible_study')),
  owner_id uuid not null references users(id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table group_members (
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'member' check (role in ('member','moderator','leader')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  invited_user_id uuid references users(id) on delete cascade,
  invited_by uuid not null references users(id),
  status text not null default 'pending' check (status in ('pending','accepted','declined','revoked')),
  created_at timestamptz not null default now()
);

create table prayer_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  group_id uuid references groups(id) on delete set null,
  title text not null,
  description text not null,
  category text,
  visibility text not null check (visibility in ('public','followers','group','private')),
  is_anonymous boolean not null default false,
  image_url text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_prayer_requests_owner on prayer_requests(user_id);
create index idx_prayer_requests_group on prayer_requests(group_id);
create index idx_prayer_requests_visibility on prayer_requests(visibility);

create table prayer_interactions (
  id uuid primary key default gen_random_uuid(),
  prayer_request_id uuid not null references prayer_requests(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  type text not null default 'prayed' check (type in ('prayed','amen','encourage')),
  created_at timestamptz not null default now(),
  unique(prayer_request_id, user_id, type)
);
create index idx_prayer_interactions_request on prayer_interactions(prayer_request_id);

create table prayer_comments (
  id uuid primary key default gen_random_uuid(),
  prayer_request_id uuid not null references prayer_requests(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  body text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table prayer_journals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text,
  body text not null,
  scripture_reference text,
  category text,
  status text not null default 'praying' check (status in ('praying','waiting','answered')),
  answered_at timestamptz,
  converted_to_testimony_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table testimonies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  category text not null,
  body text,
  media_url text,
  media_type text check (media_type in ('text','audio','image','video')),
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_notifications_user on notifications(user_id, read_at);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references users(id),
  target_type text not null,        -- user | prayer_request | comment | message | room
  target_id uuid not null,
  reason text not null,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references users(id),
  action text not null,
  target_type text,
  target_id uuid,
  reason text,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-- Seed baseline roles
insert into roles (key, description) values
  ('member', 'Standard platform user'),
  ('group_leader', 'Manages prayer/cell/study groups'),
  ('prayer_host', 'Hosts and moderates live prayer rooms'),
  ('ministry', 'Verified church/ministry account'),
  ('moderator', 'Community safety and reports'),
  ('admin', 'Platform administrator'),
  ('super_admin', 'Full system access');

-- Phase 3+ tables (live_rooms, room_participants, room_events, scheduled_rooms,
-- bible_studies, study_sessions, study_members, study_notes, scripture_bookmarks,
-- organizations, organization_members, conversations, conversation_members,
-- messages, media_assets, post*, moderation_cases) are intentionally deferred to
-- migration 0002+ so Phase 1-2 (auth + prayer requests) can ship and be tested first.
