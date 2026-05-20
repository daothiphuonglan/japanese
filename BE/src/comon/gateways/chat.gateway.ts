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
import { PrismaService } from '../../database/prisma.service'; // Đường dẫn tùy vào cấu trúc của bạn

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3001', 
    credentials: true,
    // Trong thực tế nên để domain của frontend ví dụ: 'http://localhost:3000'
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('ChatGateway');

  constructor(private prisma: PrismaService) { }

  // 1. Khởi tạo Gateway
  afterInit(server: Server) {
    this.logger.log('Init Socket Server thành công');
  }

  // 2. Xử lý khi có client kết nối
  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  // 3. Xử lý khi client ngắt kết nối
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // 4. Lắng nghe sự kiện 'send_message' từ client
  @SubscribeMessage('send_message')
  async handleMessage(client: Socket, payload: { senderId: number; content: string }) {
    this.logger.log(`Nhận tin nhắn từ ${payload.senderId}: ${payload.content}`);

    try {
      const newMessage = await this.prisma.message.create({
        data: {
          content: payload.content,
          userId: Number(payload.senderId), // Đảm bảo senderId là kiểu số
        },
        include: {
          user: true, // Bây giờ lỗi này sẽ biến mất
        },
      });

      this.server.emit('receive_message', {
        id: newMessage.id,
        content: newMessage.content,
        // Sử dụng optional chaining vì trường name có thể null
        userName: newMessage.user?.name || 'Người dùng ẩn danh',
        createdAt: newMessage.createdAt,
      });
    } catch (error) {
      this.logger.error('Lỗi khi xử lý tin nhắn:', error);
    }
  }
}