import { Controller, Get } from '@nestjs/common';
import { KanaService } from './hiragana.service';

@Controller('kana')
export class KanaController {
  constructor(private readonly kanaService: KanaService) {}

  @Get()
  getAllKana() {
    return this.kanaService.findAll();
  }
}