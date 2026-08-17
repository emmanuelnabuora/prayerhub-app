-- One-time bootstrap: every RBAC path in this app requires the granter to
-- already hold super_admin (see admin/admin.service.ts grantRole), which means
-- the very first super_admin can't be created through the API — a standard
-- chicken-and-egg problem for any RBAC system's first operator. Run this once,
-- by hand, after the first real admin account has registered normally through
-- the app.
--
-- Usage: psql $DATABASE_URL -v email="'admin@yourchurch.org'" -f bootstrap-super-admin.sql

insert into user_roles (user_id, role_id, scope_type)
select u.id, r.id, 'platform'
from users u, roles r
where u.email = :email and r.key = 'super_admin'
on conflict do nothing;
