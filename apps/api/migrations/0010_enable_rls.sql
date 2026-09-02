-- Locks every public-schema table's Supabase-generated PostgREST API (the
-- anon/authenticated REST endpoint Supabase auto-creates for every table) by
-- enabling Row Level Security with zero policies — i.e. default-deny for any
-- non-owner role. This app never uses PostgREST or the Supabase client; the
-- NestJS API connects directly as the 'postgres' role (the table owner), and
-- Postgres RLS does not apply to table owners regardless of policies, so this
-- has zero effect on the app's own database access. It only closes the
-- publicly-reachable REST API surface flagged by Supabase's Security Advisor
-- (42 errors, "RLS Disabled in Public", one per table).
alter table users enable row level security;
alter table oauth_identities enable row level security;
alter table roles enable row level security;
alter table user_roles enable row level security;
alter table user_interests enable row level security;
alter table devices enable row level security;
alter table sessions enable row level security;
alter table follows enable row level security;
alter table blocks enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table group_invites enable row level security;
alter table prayer_requests enable row level security;
alter table prayer_interactions enable row level security;
alter table prayer_comments enable row level security;
alter table prayer_journals enable row level security;
alter table testimonies enable row level security;
alter table notifications enable row level security;
alter table reports enable row level security;
alter table audit_logs enable row level security;
alter table live_rooms enable row level security;
alter table room_participants enable row level security;
alter table room_events enable row level security;
alter table scheduled_rooms enable row level security;
alter table scripture_bookmarks enable row level security;
alter table daily_verses enable row level security;
alter table media_assets enable row level security;
alter table posts enable row level security;
alter table post_reactions enable row level security;
alter table post_comments enable row level security;
alter table testimony_reactions enable row level security;
alter table conversations enable row level security;
alter table conversation_members enable row level security;
alter table messages enable row level security;
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table organization_followers enable row level security;
alter table organization_announcements enable row level security;
alter table ai_conversations enable row level security;
alter table ai_messages enable row level security;
alter table moderation_cases enable row level security;
alter table group_discussions enable row level security;
