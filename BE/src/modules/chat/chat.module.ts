import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from '../../comon/gateways/chat.gateway';
import { ChatController } from './chat.controller';
import { PrismaService } from '../../database/prisma.service'; // Kiểm tra lại đường dẫn này

@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, PrismaService],
  exports: [ChatService], // Nếu bạn muốn dùng ChatService ở các module khác
})
export class ChatModule {} // QUAN TRỌNG: Phải có chữ 'export' ở đây