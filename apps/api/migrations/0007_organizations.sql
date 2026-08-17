-- PrayerHubApp — Phase 7 schema: church & ministry hubs
-- Run with: psql $DATABASE_URL -f 0007_organizations.sql
-- Depends on 0001_init.sql (users, roles, groups), 0002_live_rooms.sql (live_rooms).

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  type text not null check (type in ('church','ministry')),
  description text,
  cover_image_url text,
  website_url text,
  livestream_url text,
  owner_id uuid not null references users(id),
  verified boolean not null default false,
  verified_at timestamptz,
  verified_by uuid references users(id),   -- platform admin/super_admin who verified it
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Leadership/staff — distinct from followers below. Only members can post
-- announcements or manage the org; followers just get updates in their feed.
create table organization_members (
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'leader' check (role in ('leader','staff')),
  joined_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table organization_followers (
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  followed_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table organization_announcements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  created_by uuid not null references users(id),
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index idx_org_announcements_org on organization_announcements(organization_id, created_at desc);

-- Lets a church/ministry "own" prayer groups, cell groups, and Bible studies
-- (they're all rows in `groups`, distinguished by group_type) and live prayer
-- rooms, matching "churches should eventually operate multiple cell groups /
-- Bible studies / prayer rooms within their organization" from the product spec.
alter table groups add column if not exists organization_id uuid references organizations(id) on delete set null;
alter table live_rooms add column if not exists organization_id uuid references organizations(id) on delete set null;
create index if not exists idx_groups_organization on groups(organization_id);
create index if not exists idx_live_rooms_organization on live_rooms(organization_id);
