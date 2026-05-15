import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatModule } from '../../modules/chat/chat.module';

@Module({
  imports: [ChatModule],
  providers: [ChatGateway],
})
export class GatewayModule {}