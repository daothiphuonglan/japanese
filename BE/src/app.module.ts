import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KanaModule } from './modules/hiragana/hiragana.module';

@Module({
  imports: [KanaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
