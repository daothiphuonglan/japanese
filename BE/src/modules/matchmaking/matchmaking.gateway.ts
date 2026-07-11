// BE: src/modules/matchmaking/matchmaking.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MatchmakingService } from './matchmaking.service';

@WebSocketGateway({
  cors: { origin: 'http://localhost:3001', credentials: true },
})
export class MatchmakingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger('MatchmakingGateway');

  constructor(private matchmakingService: MatchmakingService) {}

  afterInit(server: Server) {
    this.matchmakingService.setServer(server);
    this.logger.log('Matchmaking Gateway đã khởi động');
  }

  handleConnection(client: Socket) {
    this.logger.log(`[Matchmaking] Client kết nối: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.matchmakingService.leaveQueue(client.id);
    this.logger.log(`[Matchmaking] Client ngắt kết nối: ${client.id}`);
  }

  /**
   * Sự kiện: join_queue
   * FE gửi: { userId: number; name: string }
   */
  @SubscribeMessage('join_queue')
  handleJoinQueue(
    client: Socket,
    payload: { userId: number; name: string },
  ) {
    const added = this.matchmakingService.joinQueue({
      userId: Number(payload.userId),
      name: payload.name,
      socketId: client.id,
    });

    if (added) {
      client.emit('queue_joined', {
        message: 'Đã vào hàng đợi, đang tìm đối thủ...',
      });
    } else {
      client.emit('queue_error', {
        message: 'Bạn đã có trong hàng đợi rồi.',
      });
    }
  }

  /**
   * Sự kiện: leave_queue
   * FE gửi khi người chơi bấm "Huỷ tìm trận"
   */
  @SubscribeMessage('leave_queue')
  handleLeaveQueue(client: Socket) {
    this.matchmakingService.leaveQueue(client.id);
    client.emit('queue_left', { message: 'Đã huỷ tìm trận.' });
  }

  /**
   * Sự kiện: submit_score
   * FE gửi khi trận đấu kết thúc: { roomId: string; userId: number; score: number }
   * BE nhận → so sánh 2 điểm → emit game_result về toàn bộ room
   */
  @SubscribeMessage('submit_score')
  handleSubmitScore(
    client: Socket,
    payload: { roomId: string; userId: number; score: number },
  ) {
    this.logger.log(
      `submit_score: userId=${payload.userId} score=${payload.score} room=${payload.roomId}`,
    );
    this.matchmakingService.submitScore(
      payload.roomId,
      Number(payload.userId),
      Number(payload.score),
    );
  }
}
