import { GroupsService } from '../src/groups/groups.service';
import { ForbiddenException } from '@nestjs/common';

describe('GroupsService authorization', () => {
  function makeService(role: string | undefined) {
    const db = {
      query: jest.fn((sql: string) => {
        if (sql.includes('select role from group_members')) {
          return { rows: role ? [{ role }] : [], rowCount: role ? 1 : 0 };
        }
        return { rows: [{}], rowCount: 1 };
      }),
    };
    return new GroupsService(db as any);
  }

  it('blocks a plain member from changing another member\'s role', async () => {
    const service = makeService('member');
    await expect(
      service.changeMemberRole('group-1', 'member-user', 'target', { role: 'moderator' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks a moderator (non-leader) from changing roles — leader only', async () => {
    const service = makeService('moderator');
    await expect(
      service.changeMemberRole('group-1', 'mod-user', 'target', { role: 'moderator' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows a moderator to remove a member', async () => {
    const service = makeService('moderator');
    await expect(service.removeMember('group-1', 'mod-user', 'target')).resolves.toEqual({ success: true });
  });
});
