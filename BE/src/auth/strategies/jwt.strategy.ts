import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Đọc token từ 2 nguồn (ưu tiên cookie, fallback header)
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Cookie — cho web browser requests
        (req: Request) => req?.cookies?.accessToken ?? null,
        // 2. Authorization header — fallback cho API clients / WebSocket
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: 'CHOOSE_A_STRONG_SECRET', // Nên để trong file .env
    });
  }

  async validate(payload: any) {
    // Trả về dữ liệu này sẽ được gán vào req.user
    return { userId: payload.sub, email: payload.email };
  }
}