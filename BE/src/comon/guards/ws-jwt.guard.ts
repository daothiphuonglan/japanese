// src/comon/guards/ws-jwt.guard.ts
import { 
  CanActivate, 
  ExecutionContext, 
  Injectable, 
  Logger 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      
      // 1. Trích xuất token từ handshake.auth hoặc headers
      const token = this.extractToken(client);
      
      if (!token) {
        throw new WsException('Unauthorized: No token provided');
      }

      // 2. Verify Token
      // Lưu ý: secret phải khớp với secret lúc bạn sign token ở AuthModule
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET, 
      });

      // 3. Tìm user trong Database để đảm bảo user vẫn tồn tại/không bị khóa
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub || payload.id },
      });

      if (!user) {
        throw new WsException('Unauthorized: User not found');
      }

      // 4. Gán user vào client để Decorator @GetUser() có thể lấy ra
      client['user'] = user;

      return true;
    } catch (err) {
     
      throw new WsException('Unauthorized');
    }
  }

  private extractToken(client: Socket): string | undefined {
    // Ưu tiên lấy từ auth (Socket.io client thường gửi qua đây)
    const tokenFromAuth = client.handshake.auth?.token;
    if (tokenFromAuth) return tokenFromAuth;

    // Dự phòng lấy từ headers
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
      return authHeader.split(' ')[1];
    }

    return undefined;
  }
}