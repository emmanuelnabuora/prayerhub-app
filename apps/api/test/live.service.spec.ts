import { LiveRoomsService } from '../src/live/live.service';
import { ForbiddenException } from '@nestjs/common';

describe('LiveRoomsService authorization', () => {
  function makeService(participantRole: string | undefined) {
    const db = {
      query: jest.fn((sql: string) => {
        if (sql.includes('select role from room_participants')) {
          return { rows: participantRole ? [{ role: participantRole }] : [], rowCount: participantRole ? 1 : 0 };
        }
        return { rows: [{ sfu_room_name: 'room-1' }], rowCount: 1 };
      }),
    };
    const sfu = { muteParticipant: jest.fn(), removeParticipant: jest.fn() };
    return new LiveRoomsService(db as any, sfu as any);
  }

  it('blocks a plain listener from changing another participant\'s role', async () => {
    const service = makeService('listener');
    await expect(
      service.changeRole('room-1', 'listener-user', { targetUserId: 'target', role: 'speaker' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks a plain listener from removing another participant', async () => {
    const service = makeService('listener');
    await expect(
      service.removeParticipant('room-1', 'listener-user', 'target'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows a co_host to change roles', async () => {
    const service = makeService('co_host');
    await expect(
      service.changeRole('room-1', 'cohost-user', { targetUserId: 'target', role: 'speaker' }),
    ).resolves.toEqual({ success: true });
  });
});
