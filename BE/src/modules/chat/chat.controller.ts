import { Controller, Get } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat') // 👈 QUAN TRỌNG: Định nghĩa tiền tố URL là /chat
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('messages') // 👈 QUAN TRỌNG: Định nghĩa hành động là /messages
  async getRecentMessages() {
    // Logic gọi sang service lấy 50 tin nhắn cũ đã làm hôm qua
    return this.chatService.getRecentMessages();
  }
}