import { Logger, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect,
  SubscribeMessage, WebSocketGateway, WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

// This gateway carries *app-state* events (hand raised, someone promoted, reactions,
// listener joined/left) — NOT audio. Audio media flows directly between clients and
// the SFU (LiveKit), never through this server. Keeping these concerns separate is
// what lets the audio path scale independently of the app server (see
// docs/02-ARCHITECTURE.md section 3).
@WebSocketGateway({ namespace: '/live', cors: { origin: '*' } })
export class LiveGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(LiveGateway.name);

  constructor(private readonly jwt: JwtService) {}

  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth?.token as string;
      const payload = await this.jwt.verifyAsync(token, { secret: process.env.JWT_ACCESS_SECRET });
      socket.data.userId = payload.sub;
      socket.data.username = payload.username;
    } catch {
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    const roomId = socket.data.roomId;
    if (roomId) {
      this.server.to(roomId).emit('participant_left', { userId: socket.data.userId });
    }
  }

  @SubscribeMessage('join_room')
  onJoinRoom(@ConnectedSocket() socket: Socket, @MessageBody() data: { roomId: string }) {
    socket.join(data.roomId);
    socket.data.roomId = data.roomId;
    this.server.to(data.roomId).emit('participant_joined', {
      userId: socket.data.userId, username: socket.data.username,
    });
  }

  @SubscribeMessage('hand_raised')
  onHandRaised(@ConnectedSocket() socket: Socket) {
    // Persisted via POST /live/rooms/:id/raise-hand — this just fans the update out
    // to everyone else in the room in real time. The REST call remains the source
    // of truth; this event is a UI-latency optimization, not authorization.
    this.server.to(socket.data.roomId).emit('hand_raised', { userId: socket.data.userId });
  }

  @SubscribeMessage('reaction')
  onReaction(@ConnectedSocket() socket: Socket, @MessageBody() data: { emoji: string }) {
    this.server.to(socket.data.roomId).emit('reaction', {
      userId: socket.data.userId, emoji: data.emoji,
    });
  }

  // Called server-side by LiveRoomsService in a full implementation (e.g. via an
  // internal event emitter) whenever changeRole/removeParticipant runs, so every
  // client's UI updates immediately. Exposed here as a method other providers can
  // call directly since this is a single-process monolith for now.
  broadcastRoleChange(roomId: string, targetUserId: string, role: string) {
    this.server.to(roomId).emit('role_changed', { userId: targetUserId, role });
  }

  broadcastRemoval(roomId: string, targetUserId: string) {
    this.server.to(roomId).emit('participant_removed', { userId: targetUserId });
  }
}
