import { PostsService } from '../src/social/posts.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('PostsService', () => {
  function makeService(queryImpl: (sql: string, params: any[]) => any) {
    const db = { query: jest.fn(queryImpl) };
    return new PostsService(db as any);
  }

  it('rejects an audio post with no mediaAssetId', async () => {
    const service = makeService(() => ({ rows: [], rowCount: 0 }));
    await expect(
      service.create('user-1', { type: 'audio' } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws NotFoundException when a post is not visible to the viewer', async () => {
    const service = makeService(() => ({ rows: [], rowCount: 0 }));
    await expect(service.findOne('post-1', 'viewer-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('blocks posting into a group the user does not belong to', async () => {
    const service = makeService((sql: string) => {
      if (sql.includes('group_members')) return { rows: [], rowCount: 0 };
      return { rows: [], rowCount: 0 };
    });
    await expect(
      service.create('user-1', { type: 'text', body: 'hi', groupId: 'group-1' } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
