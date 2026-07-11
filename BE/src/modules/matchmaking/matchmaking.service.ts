// BE: src/modules/matchmaking/matchmaking.service.ts
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';
import { PrismaService } from 'src/database/prisma.service';

export interface QueuePlayer {
  userId: number;
  name: string;
  socketId: string;
}

// Lưu kana kèm romaji để BE truyền về FE (dùng cho chế độ voice)
export interface KanaWord {
  char: string;
  romaji: string;
}

interface RoomScore {
  player1: { id: number; name: string; score: number; submitted: boolean };
  player2: { id: number; name: string; score: number; submitted: boolean };
}

@Injectable()
export class MatchmakingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('MatchmakingService');
  private matchmaking_queue: QueuePlayer[] = [];
  private server: Server;
  private intervalHandle: NodeJS.Timeout;

  // Map roomId → điểm số của 2 player
  private roomScores = new Map<string, RoomScore>();

  constructor(private prisma: PrismaService) {}

  /** Được gọi từ Gateway để inject Server instance */
  setServer(server: Server) {
    this.server = server;
  }

  onModuleInit() {
    this.intervalHandle = setInterval(() => this.processQueue(), 3000);
    this.logger.log('Matchmaking Interval đã khởi động (mỗi 3 giây)');
  }

  onModuleDestroy() {
    clearInterval(this.intervalHandle);
  }

  /** Thêm người chơi vào hàng đợi */
  joinQueue(player: QueuePlayer) {
    const alreadyInQueue = this.matchmaking_queue.some(
      (p) => p.userId === player.userId,
    );
    if (alreadyInQueue) {
      this.logger.warn(`User ${player.userId} đã có trong hàng đợi, bỏ qua.`);
      return false;
    }
    this.matchmaking_queue.push(player);
    this.logger.log(
      `User ${player.name} (${player.userId}) đã vào hàng đợi. Hàng đợi: ${this.matchmaking_queue.length} người`,
    );
    return true;
  }

  /** Xoá người chơi khỏi hàng đợi khi disconnect */
  leaveQueue(socketId: string) {
    const before = this.matchmaking_queue.length;
    this.matchmaking_queue = this.matchmaking_queue.filter(
      (p) => p.socketId !== socketId,
    );
    if (this.matchmaking_queue.length < before) {
      this.logger.log(`Socket ${socketId} đã rời khỏi hàng đợi.`);
    }
  }

  /**
   * Nhận điểm cuối trận từ một player.
   * Khi cả 2 player đều submit → tính kết quả và emit game_result.
   */
  submitScore(roomId: string, userId: number, score: number) {
    const room = this.roomScores.get(roomId);
    if (!room) {
      this.logger.warn(`submitScore: Room ${roomId} không tồn tại`);
      return;
    }

    if (room.player1.id === userId) {
      room.player1.score = score;
      room.player1.submitted = true;
    } else if (room.player2.id === userId) {
      room.player2.score = score;
      room.player2.submitted = true;
    }

    this.logger.log(
      `[${roomId}] Score submitted - ${room.player1.name}:${room.player1.score} | ${room.player2.name}:${room.player2.score}`,
    );

    // Cả 2 đã nộp điểm → tính kết quả
    if (room.player1.submitted && room.player2.submitted) {
      this.emitGameResult(roomId, room);
    }
  }

  /**
   * Emit kết quả thắng/thua về phòng.
   * Nếu 1 người chờ quá 10 giây mà đối thủ chưa submit → cũng tính kết quả.
   */
  private emitGameResult(roomId: string, room: RoomScore) {
    const p1 = room.player1;
    const p2 = room.player2;

    let winnerId: number | null = null;
    let resultText: 'win' | 'lose' | 'draw';

    if (p1.score > p2.score) {
      winnerId = p1.id;
    } else if (p2.score > p1.score) {
      winnerId = p2.id;
    }
    // else: hòa

    const result = {
      roomId,
      player1: { id: p1.id, name: p1.name, score: p1.score },
      player2: { id: p2.id, name: p2.name, score: p2.score },
      winnerId, // null = hòa
    };

    this.server.to(roomId).emit('game_result', result);
    this.logger.log(
      `[${roomId}] Kết quả: ${p1.name}(${p1.score}) vs ${p2.name}(${p2.score}) → Winner: ${winnerId ?? 'Hòa'}`,
    );

    // Dọn dẹp bộ nhớ
    this.roomScores.delete(roomId);
  }

  /** Logic ghép cặp FIFO chạy định kỳ */
  private async processQueue() {
    if (!this.server) return;
    if (this.matchmaking_queue.length < 2) return;

    const [player1, player2] = this.matchmaking_queue.splice(0, 2);
    const roomId = `room_${player1.userId}_${player2.userId}_${Date.now()}`;

    // Lấy danh sách kana ngẫu nhiên từ database (kèm romaji)
    const wordsList = await this.getRandomKana(10);

    // Khởi tạo bảng điểm cho room
    this.roomScores.set(roomId, {
      player1: { id: player1.userId, name: player1.name, score: 0, submitted: false },
      player2: { id: player2.userId, name: player2.name, score: 0, submitted: false },
    });

    const matchData = {
      roomId,
      player1: { id: player1.userId, name: player1.name },
      player2: { id: player2.userId, name: player2.name },
      gameData: {
        duration: 60,
        wordsList, // [{ char: 'あ', romaji: 'a' }, ...]
      },
    };

    const socket1 = this.server.sockets.sockets.get(player1.socketId);
    const socket2 = this.server.sockets.sockets.get(player2.socketId);

    if (socket1) socket1.join(roomId);
    if (socket2) socket2.join(roomId);

    this.server.to(roomId).emit('match_found', matchData);

    this.logger.log(
      `Ghép cặp thành công: ${player1.name} vs ${player2.name} → Room: ${roomId}`,
    );

    // Timeout: Nếu sau 90 giây (60s game + 30s buffer) mà room chưa bị xoá
    // → tự động emit kết quả với điểm đã có
    setTimeout(() => {
      const room = this.roomScores.get(roomId);
      if (room) {
        this.logger.warn(`[${roomId}] Timeout 90s - tự động tính kết quả`);
        this.emitGameResult(roomId, room);
      }
    }, 90_000);
  }

  /** Lấy ngẫu nhiên N ký tự kana từ DB (kèm romaji) */
  private async getRandomKana(count: number): Promise<KanaWord[]> {
    try {
      const allKana = await this.prisma.kana.findMany({
        select: { char: true, romaji: true },
      });
      const shuffled = allKana.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count).map((k) => ({
        char: k.char,
        romaji: k.romaji,
      }));
    } catch {
      // Fallback nếu DB lỗi
      return [
        { char: 'あ', romaji: 'a' }, { char: 'い', romaji: 'i' },
        { char: 'う', romaji: 'u' }, { char: 'え', romaji: 'e' },
        { char: 'お', romaji: 'o' }, { char: 'か', romaji: 'ka' },
        { char: 'き', romaji: 'ki' }, { char: 'く', romaji: 'ku' },
        { char: 'け', romaji: 'ke' }, { char: 'こ', romaji: 'ko' },
      ];
    }
  }
}
