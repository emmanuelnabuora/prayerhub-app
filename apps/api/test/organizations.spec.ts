import { RolesGuard } from '../src/auth/roles.guard';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { OrganizationsService } from '../src/organizations/organizations.service';

function makeContext(userId: string | undefined) {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user: userId ? { userId } : undefined }) }),
  } as any;
}

describe('RolesGuard', () => {
  it('rejects a user without the required platform role', async () => {
    const db = { query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }) };
    const reflector = { getAllAndOverride: () => ['admin', 'super_admin'] } as unknown as Reflector;
    const guard = new RolesGuard(reflector, db as any);
    await expect(guard.canActivate(makeContext('user-1'))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows a user who holds one of the required roles', async () => {
    const db = { query: jest.fn().mockResolvedValue({ rows: [{ key: 'admin' }], rowCount: 1 }) };
    const reflector = { getAllAndOverride: () => ['admin', 'super_admin'] } as unknown as Reflector;
    const guard = new RolesGuard(reflector, db as any);
    await expect(guard.canActivate(makeContext('admin-user'))).resolves.toBe(true);
  });

  it('passes through when no roles are required on the route', async () => {
    const db = { query: jest.fn() };
    const reflector = { getAllAndOverride: () => undefined } as unknown as Reflector;
    const guard = new RolesGuard(reflector, db as any);
    await expect(guard.canActivate(makeContext('any-user'))).resolves.toBe(true);
  });
});

describe('OrganizationsService authorization', () => {
  it('blocks linking a group the actor does not lead', async () => {
    const db = {
      query: jest.fn((sql: string) => {
        if (sql.includes('from organization_members')) return { rows: [{}], rowCount: 1 }; // is org leader
        if (sql.includes('from group_members')) return { rows: [], rowCount: 0 }; // not group leader
        return { rows: [], rowCount: 0 };
      }),
    };
    const service = new OrganizationsService(db as any);
    await expect(service.linkGroup('org-1', 'user-1', 'group-1')).rejects.toThrow(
      'You must lead the group to link it to an organization',
    );
  });
});
