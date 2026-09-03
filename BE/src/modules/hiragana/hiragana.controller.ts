import { Controller, Get } from '@nestjs/common';
import { KanaService } from './hiragana.service';

@Controller('kana')
export class KanaController {
  constructor(private readonly kanaService: KanaService) {}

  @Get()
  getAllKana() {
    return this.kanaService.findAll();
  }

  @Get('hiragana')
  getHiragana() {
    return this.kanaService.findByType('hiragana');
  }

  @Get('katakana')
  getKatakana() {
    return this.kanaService.findByType('katakana');
  }
}