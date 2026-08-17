-- PrayerHubApp — Phase 4 addition: recurring meeting schedule for prayer/cell groups
-- Run with: psql $DATABASE_URL -f 0003_group_schedule.sql
-- Depends on 0001_init.sql (groups, group_members, group_invites).

alter table groups
  add column if not exists recurring_schedule jsonb;
  -- e.g. {"days":["MO","TU","WE","TH","FR"],"time":"06:00","timezone":"America/Los_Angeles","durationMinutes":30}

-- group_invites already supports leader-issued invites (invited_by != invited_user_id).
-- We reuse the same table for user-initiated "request to join" a private group by
-- storing a row with invited_by = invited_user_id (a self-request), so private-group
-- joins go through one consistent approval table rather than a second schema.
comment on column group_invites.invited_by is
  'If equal to invited_user_id, this row is a self-initiated join request awaiting leader approval.';
