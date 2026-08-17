import { PrayersService } from '../src/prayers/prayers.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('PrayersService', () => {
  function makeService(queryImpl: (sql: string, params: any[]) => any) {
    const db = { query: jest.fn(queryImpl) };
    return new PrayersService(db as any);
  }

  it('throws NotFoundException when a request is not visible to the viewer', async () => {
    const service = makeService(() => ({ rows: [], rowCount: 0 }));
    await expect(service.findOne('req-1', 'viewer-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('blocks creating a request in a group the user does not belong to', async () => {
    const service = makeService((sql: string) => {
      if (sql.includes('group_members')) return { rows: [], rowCount: 0 };
      return { rows: [], rowCount: 0 };
    });
    await expect(
      service.create('user-1', {
        title: 't', description: 'd', visibility: 'group', groupId: 'group-1',
      } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
