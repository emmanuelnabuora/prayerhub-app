-- PrayerHubApp — minimal Bible Study Discussion tab support.
-- Reuses the group_members table (already enforced elsewhere) rather than a
-- separate discussion-participant concept — anyone in the group can post.
create table group_discussions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references users(id),
  body text not null,
  scripture_reference text,
  created_at timestamptz not null default now()
);
create index idx_group_discussions_group on group_discussions(group_id, created_at desc);
