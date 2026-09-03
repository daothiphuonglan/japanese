import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class KanaService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const data = await this.prisma.kana.findMany();
    return { data, total: data.length };
  }

  async findByType(type: string) {
    const data = await this.prisma.kana.findMany({
      where: { type },
    });
    return { data, total: data.length };
  }
}