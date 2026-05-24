

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

  // Bản đồ lưu trữ: Key là socket.id, Value là { userId, name }
  private activeUsers = new Map<string, { userId: number; name: string }>();

  constructor(private prisma: PrismaService) {}

  afterInit(server: Server) {
    this.logger.log('Init Socket Server thành công');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client kết nối thô: ${client.id}`);
  }

  

  // Xử lý khi User báo danh là tôi đã online
  @SubscribeMessage('user_online')
  handleUserOnline(client: Socket, payload: { userId: number; name: string }) {
    // Lưu thông tin user gắn liền với socket id này
    this.activeUsers.set(client.id, { userId: Number(payload.userId), name: payload.name });
    this.logger.log(`User ${payload.name} (ID: ${payload.userId}) đang Online`);

    // Gửi danh sách những người đang online về cho TẤT CẢ mọi người
    this.broadcastOnlineUsers();
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Xóa user ra khỏi danh sách online khi họ tắt tab/đăng xuất
    this.activeUsers.delete(client.id);
    this.broadcastOnlineUsers();
  }

  // Hàm bổ trợ gom danh sách user online duy nhất gửi về FE
  private broadcastOnlineUsers() {
    const users = Array.from(this.activeUsers.values());
    // Lọc trùng trùng lặp nếu 1 user mở nhiều tab
    const uniqueUsers = users.filter((value, index, self) =>
      index === self.findIndex((t) => t.userId === value.userId)
    );
    this.server.emit('get_online_users', uniqueUsers);
  }

  // Lắng nghe tin nhắn chat 1-1
  @SubscribeMessage('send_private_message')
  async handlePrivateMessage(
    client: Socket,
    payload: { senderId: number; receiverId: number; content: string },
  ) {
    try {
      // Lưu vào database
      const newMessage = await this.prisma.message.create({
        data: {
          content: payload.content,
          userId: Number(payload.senderId),
          receiverId: Number(payload.receiverId),
        },
        include: { user: true },
      });

      // Phát tin nhắn này về cho tất cả mọi người (ở mức đơn giản) 
      // Hoặc phát riêng cho người nhận nếu bạn cấu hình nâng cao. 
      // Để đơn giản cho UI hiện tại, ta bắn chung, FE tự lọc theo cặp ID
      this.server.emit('receive_private_message', newMessage);
    } catch (error) {
      this.logger.error('Lỗi chat private:', error);
    }
  }
}