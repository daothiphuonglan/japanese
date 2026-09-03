import { Controller, Post, Get, Body, Res, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import express from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /auth/login
   * Xác thực user → set accessToken vào HttpOnly cookie → trả về user info
   */
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.authService.login(dto);

    // Set accessToken vào HttpOnly cookie
    res.cookie('accessToken', result.access_token, {
      httpOnly: true,       // JS không đọc được → chống XSS
      secure: false,        // true khi deploy HTTPS (production)
      sameSite: 'lax',      // Chống CSRF cơ bản
      maxAge: 24 * 60 * 60 * 1000, // 1 ngày (khớp với JWT expiresIn)
      path: '/',
    });

    // Chỉ trả user info, KHÔNG trả token cho FE
    return { user: result.user };
  }

  /**
   * POST /auth/logout
   * Xóa cookie accessToken → user bị đăng xuất
   */
  @Post('logout')
  logout(@Res({ passthrough: true }) res: express.Response) {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });
    return { message: 'Đăng xuất thành công' };
  }

  /**
   * GET /auth/session
   * Kiểm tra cookie có hợp lệ không → trả về user info
   * Dùng khi FE reload trang (F5) để re-hydrate user state
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('session')
  getSession(@Req() req: express.Request) {
    // req.user được gán bởi JwtStrategy.validate()
    const user = req.user as { userId: number; email: string };
    return { user: { id: user.userId, email: user.email } };
  }
}