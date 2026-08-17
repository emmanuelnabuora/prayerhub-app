-- PrayerHubApp — Phase 6 schema: social feed, audio posts, testimonies reactions
-- Run with: psql $DATABASE_URL -f 0005_social.sql
-- Depends on 0001_init.sql (users, groups, testimonies).

create table media_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  storage_key text not null,        -- object key in the bucket, not the public URL
  public_url text not null,
  media_type text not null check (media_type in ('audio','image','video')),
  duration_seconds int,             -- audio/video only
  mime_type text,
  created_at timestamptz not null default now()
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  group_id uuid references groups(id) on delete set null,
  type text not null check (type in ('text','scripture','audio','testimony_share')),
  body text,
  scripture_reference text,          -- for type = 'scripture'
  media_asset_id uuid references media_assets(id) on delete set null,  -- for type = 'audio'
  shared_testimony_id uuid references testimonies(id) on delete set null, -- for type = 'testimony_share'
  visibility text not null default 'public' check (visibility in ('public','followers','group')),
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_posts_user on posts(user_id);
create index idx_posts_group on posts(group_id);
create index idx_posts_created on posts(created_at desc);

create table post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  type text not null check (type in ('amen','pray','encourage')),
  created_at timestamptz not null default now(),
  unique(post_id, user_id, type)
);

create table post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  body text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

-- Testimonies (table already exists from 0001_init.sql) get the same lightweight
-- reaction model as posts, kept as a separate table rather than folding testimonies
-- into `posts` — testimonies have their own moderation/verification lifecycle in
-- the product spec and are likely to diverge further (e.g. featured testimonies).
create table testimony_reactions (
  id uuid primary key default gen_random_uuid(),
  testimony_id uuid not null references testimonies(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  type text not null check (type in ('amen','encourage')),
  created_at timestamptz not null default now(),
  unique(testimony_id, user_id, type)
);
