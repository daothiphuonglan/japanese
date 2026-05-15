import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'CHOOSE_A_STRONG_SECRET', // Nên để trong file .env
    });
  }

  async validate(payload: any) {
    // Trả về dữ liệu này sẽ được gán vào req.user
    return { userId: payload.sub, email: payload.email };
  }
}