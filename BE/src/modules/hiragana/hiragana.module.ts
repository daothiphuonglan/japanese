import { Module } from '@nestjs/common';
import { KanaService } from './hiragana.service';
import { KanaController } from './hiragana.controller';
import { PrismaService } from 'src/database/prisma.service';

@Module({
  controllers: [KanaController],
  providers: [KanaService, PrismaService],
})
export class KanaModule {}