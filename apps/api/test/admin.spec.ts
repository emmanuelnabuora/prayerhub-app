import { AdminService } from '../src/admin/admin.service';
import { ForbiddenException } from '@nestjs/common';

describe('AdminService.grantRole', () => {
  function makeService(actorIsSuperAdmin: boolean) {
    const db = {
      query: jest.fn((sql: string) => {
        if (sql.includes(`r.key = 'super_admin'`)) {
          return { rows: actorIsSuperAdmin ? [{ key: 'super_admin' }] : [], rowCount: actorIsSuperAdmin ? 1 : 0 };
        }
        if (sql.includes('select id from roles where key')) return { rows: [{ id: 'role-id' }], rowCount: 1 };
        return { rows: [], rowCount: 0 };
      }),
    };
    return new AdminService(db as any);
  }

  it('blocks a plain admin from granting the admin role (escalation attempt)', async () => {
    const service = makeService(false);
    await expect(service.grantRole('admin-user', 'target-user', 'admin')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks a plain admin from granting super_admin', async () => {
    const service = makeService(false);
    await expect(service.grantRole('admin-user', 'target-user', 'super_admin')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows any admin to grant moderator', async () => {
    const service = makeService(false);
    await expect(service.grantRole('admin-user', 'target-user', 'moderator')).resolves.toEqual({ success: true });
  });

  it('allows a super_admin to grant admin', async () => {
    const service = makeService(true);
    await expect(service.grantRole('super-admin-user', 'target-user', 'admin')).resolves.toEqual({ success: true });
  });
});
