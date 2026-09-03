import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Parse cookies từ request — cần thiết để đọc accessToken từ cookie
  app.use(cookieParser());

  // CORS: cho phép cả dev (localhost) và production (Vercel)
  const allowedOrigins = [
    'http://localhost:3001',
    process.env.FRONTEND_URL, // Set trên Render: https://your-app.vercel.app
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Cho phép gửi kèm Token/Cookie nếu cần
  });
  
  // Listen trên 0.0.0.0 để Render/container có thể truy cập
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
