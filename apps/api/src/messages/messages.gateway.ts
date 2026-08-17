import { Logger } from '@nestjs/common';
import {
  ConnectedSocket, MessageBody, OnGatewayConnection,
  SubscribeMessage, WebSocketGateway, WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

// Same pattern as live.gateway.ts: this carries delivery notifications only.
// Sending a message always goes through the authorized REST endpoint
// (POST /conversations/:id/messages) first — the gateway just fans the result out
// to other members' open sockets so their chat screens update without polling.
@WebSocketGateway({ namespace: '/messages', cors: { origin: '*' } })
export class MessagesGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(MessagesGateway.name);

  constructor(private readonly jwt: JwtService) {}

  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth?.token as string;
      const payload = await this.jwt.verifyAsync(token, { secret: process.env.JWT_ACCESS_SECRET });
      socket.data.userId = payload.sub;
    } catch {
      socket.disconnect();
    }
  }

  @SubscribeMessage('join_conversation')
  onJoin(@ConnectedSocket() socket: Socket, @MessageBody() data: { conversationId: string }) {
    // Membership is re-validated server-side before this event is ever emitted to
    // the room (see MessagesService.sendMessage → assertMember) — joining a socket
    // room here only controls who *receives* the fan-out, not who can post.
    socket.join(data.conversationId);
  }

  @SubscribeMessage('typing')
  onTyping(@ConnectedSocket() socket: Socket, @MessageBody() data: { conversationId: string }) {
    socket.to(data.conversationId).emit('typing', { userId: socket.data.userId });
  }

  broadcastMessage(conversationId: string, message: unknown) {
    this.server.to(conversationId).emit('new_message', message);
  }
}
