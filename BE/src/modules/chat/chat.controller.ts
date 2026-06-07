import { Controller, Get,Query } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat') 
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('messages') 
  async getRecentMessages() {
    return this.chatService.getRecentMessages();
  }

  @Get('history')
  async getChatHistory(
    @Query('senderId') senderId: string,
    @Query('receiverId') receiverId: string,
  ) {
    return this.chatService.getMessagesBetweenUsers(Number(senderId), Number(receiverId));
  }

  @Get('users')
  async getAllUsers() {
    return this.chatService.getAllUsersFromDb();
  }
}