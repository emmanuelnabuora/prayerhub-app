import { Injectable } from '@nestjs/common';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

// Thin wrapper around the LiveKit server SDK, isolated behind an interface so a
// different managed SFU (Agora, 100ms) can be swapped in without touching
// LiveRoomsService — see docs/02-ARCHITECTURE.md section 3 for why we chose a
// managed SFU over building one.
@Injectable()
export class SfuProvider {
  private client: RoomServiceClient;

  constructor() {
    this.client = new RoomServiceClient(
      process.env.LIVEKIT_URL!,
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
    );
  }

  async createRoom(name: string) {
    return this.client.createRoom({ name, emptyTimeout: 60 * 30, maxParticipants: 500 });
  }

  // Scoped, short-lived token: only grants publish (mic) rights for hosts/co-hosts/
  // speakers; listeners get subscribe-only. This is the server-authoritative
  // enforcement point — the client cannot upgrade its own role.
  async createToken(roomName: string, userId: string, username: string, canPublish: boolean) {
    const token = new AccessToken(process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!, {
      identity: userId,
      name: username,
      ttl: '4h',
    });
    token.addGrant({ room: roomName, roomJoin: true, canPublish, canSubscribe: true });
    return token.toJwt();
  }

  async muteParticipant(roomName: string, userId: string, muted: boolean) {
    return this.client.mutePublishedTrack(roomName, userId, '', muted).catch(() => undefined);
    // In production, iterate the participant's actual track SIDs from listParticipants();
    // simplified here since Sprint 3 focuses on the moderation/authorization flow.
  }

  async removeParticipant(roomName: string, userId: string) {
    return this.client.removeParticipant(roomName, userId);
  }

  async endRoom(roomName: string) {
    return this.client.deleteRoom(roomName);
  }
}
