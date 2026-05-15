import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3001', // Cho phép chính xác địa chỉ của Frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Cho phép gửi kèm Token/Cookie nếu cần
  });
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
