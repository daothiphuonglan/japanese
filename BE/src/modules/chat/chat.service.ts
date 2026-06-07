import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async saveMessage(userId: number, content: string) {
    return this.prisma.message.create({
      data: { 
        content, 
        userId: userId // Đổi từ senderId thành userId
      },
      include: { 
        user: { select: { id: true, email: true, name: true } } // Đổi từ sender thành user
      },
    });
  }

  async getRecentMessages() {
    // Lưu ý: findMany thường nên trả về tin nhắn cũ đến mới để hiển thị chat
    const messages = await this.prisma.message.findMany({
      take: 50,
      orderBy: { createdAt: 'asc' }, // 'asc' để tin nhắn mới nhất nằm dưới cùng
      include: { 
        user: { select: { id: true, email: true, name: true } } // Đổi từ sender thành user
      },
    });
    return messages;
  }

  async getMessagesBetweenUsers(userA: number, userB: number) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { userId: userA, receiverId: userB },
          { userId: userB, receiverId: userA },
        ],
      },
      orderBy: {
        createdAt: 'asc', 
      },
    });
  }

  async getAllUsersFromDb() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc', // Sắp xếp theo bảng chữ cái từ A-Z cho đẹp danh sách
      }
    });
  }
  
}