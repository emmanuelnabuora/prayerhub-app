-- PrayerHubApp — Phase 3 schema: live audio prayer rooms
-- Run with: psql $DATABASE_URL -f 0002_live_rooms.sql
-- Depends on 0001_init.sql (users, groups, roles).

create table live_rooms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references users(id),
  group_id uuid references groups(id) on delete set null,
  title text not null,
  topic text,                         -- Morning Prayer, Healing Prayer, Intercession, etc.
  status text not null default 'scheduled'
    check (status in ('scheduled','live','ended','cancelled')),
  sfu_room_name text unique,          -- name/identifier in the LiveKit/Agora/100ms project
  started_at timestamptz,
  ended_at timestamptz,
  scheduled_for timestamptz,
  recurring_rule text,                -- e.g. "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR;BYHOUR=6"
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_live_rooms_status on live_rooms(status);
create index idx_live_rooms_group on live_rooms(group_id);

-- Current/last-known role per participant. This table is the durable record;
-- Redis holds the live, low-latency version while a room is active (see
-- docs/02-ARCHITECTURE.md section 3). Rows here are upserted as state changes
-- and are the source of truth once the room ends, for history and moderation.
create table room_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references live_rooms(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'listener'
    check (role in ('host','co_host','speaker','listener')),
  hand_raised boolean not null default false,
  muted boolean not null default true,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  removed_by uuid references users(id),  -- set if a moderator force-removed this participant
  unique(room_id, user_id)
);
create index idx_room_participants_room on room_participants(room_id);

-- Append-only event log for audit/moderation/analytics — every mute, promote,
-- remove, hand-raise, and reaction is recorded here with an actor.
create table room_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references live_rooms(id) on delete cascade,
  actor_id uuid references users(id),
  target_user_id uuid references users(id),
  event_type text not null,   -- joined, left, hand_raised, promoted, muted, unmuted, removed, reaction
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);
create index idx_room_events_room on room_events(room_id, created_at);

create table scheduled_rooms (
  id uuid primary key default gen_random_uuid(),
  live_room_id uuid not null references live_rooms(id) on delete cascade,
  reminder_sent boolean not null default false,
  created_at timestamptz not null default now()
);
