import { MessagesService } from '../src/messages/messages.service';
import { ForbiddenException } from '@nestjs/common';

describe('MessagesService', () => {
  function makeService(opts: { blocked?: boolean; isMember?: boolean }) {
    const db = {
      query: jest.fn((sql: string) => {
        if (sql.includes('from blocks')) return { rows: opts.blocked ? [{}] : [], rowCount: opts.blocked ? 1 : 0 };
        if (sql.includes('from conversation_members where conversation_id')) {
          return { rows: opts.isMember ? [{}] : [], rowCount: opts.isMember ? 1 : 0 };
        }
        if (sql.includes('select user_id from conversation_members')) return { rows: [{ user_id: 'other-user' }], rowCount: 1 };
        return { rows: [{ id: 'convo-1' }], rowCount: 1 };
      }),
    };
    const gateway = { broadcastMessage: jest.fn() };
    return new MessagesService(db as any, gateway as any);
  }

  it('refuses to start a direct conversation with a blocked user', async () => {
    const service = makeService({ blocked: true });
    await expect(service.findOrCreateDirect('user-1', 'user-2')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses to start a conversation with yourself', async () => {
    const service = makeService({});
    await expect(service.findOrCreateDirect('user-1', 'user-1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks sending a message when the recipient has since blocked the sender', async () => {
    const service = makeService({ isMember: true, blocked: true });
    await expect(
      service.sendMessage('convo-1', 'user-1', { type: 'text', body: 'hi' } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks a non-member from sending into a conversation', async () => {
    const service = makeService({ isMember: false });
    await expect(
      service.sendMessage('convo-1', 'user-1', { type: 'text', body: 'hi' } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
