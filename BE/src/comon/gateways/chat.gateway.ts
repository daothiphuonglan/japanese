

// BE: src/modules/chat/chat.gateway.ts
import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { PrismaService } from '../../database/prisma.service';

@WebSocketGateway({
  cors: { origin: 'http://localhost:3001', credentials: true },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('ChatGateway');

  private activeUsers = new Map<string, { userId: number; name: string }>();

  constructor(private prisma: PrismaService) {}

  afterInit(server: Server) {
    this.logger.log('Init Socket Server thành công');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client kết nối thô: ${client.id}`);
  }
// Backend: src/modules/chat/chat.gateway.ts

  
  @SubscribeMessage('user_online')
  handleUserOnline(client: Socket, payload: { userId: number; name: string }) {
    this.activeUsers.set(client.id, { userId: Number(payload.userId), name: payload.name });
    this.logger.log(`User ${payload.name} (ID: ${payload.userId}) đang Online`);
    this.broadcastOnlineUsers();
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.activeUsers.delete(client.id);
    this.broadcastOnlineUsers();
  }

  private broadcastOnlineUsers() {
    const users = Array.from(this.activeUsers.values());
    const uniqueUsers = users.filter((value, index, self) =>
      index === self.findIndex((t) => t.userId === value.userId)
    );
    this.server.emit('get_online_users', uniqueUsers);
  }

  @SubscribeMessage('send_private_message')
  async handlePrivateMessage(
    client: Socket,
    payload: { senderId: number; receiverId: number; content: string },
  ) {
    try {

      const newMessage = await this.prisma.message.create({
        data: {
          content: payload.content,
          userId: Number(payload.senderId),
          receiverId: Number(payload.receiverId),
        },
        include: { user: true },
      });

      this.server.emit('receive_private_message', newMessage);
    } catch (error) {
      this.logger.error('Lỗi chat private:', error);
    }
  }
}