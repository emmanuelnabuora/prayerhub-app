import { SetMetadata } from '@nestjs/common';

// Platform-scoped role check (admin/super_admin), distinct from the per-resource
// role checks used elsewhere (group leader, room host, org leader) which query
// their own membership tables directly. This one checks user_roles with
// scope_type = 'platform', matching the RBAC matrix in docs/04-RBAC-MATRIX.md.
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
