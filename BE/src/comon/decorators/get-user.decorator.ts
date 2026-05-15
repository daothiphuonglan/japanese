// src/comon/decorators/get-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const type = ctx.getType();

    if (type === 'http') {
      // Xử lý cho HTTP (REST API)
      const request = ctx.switchToHttp().getRequest();
      const user = request.user;
      return data ? user?.[data] : user;
    } else if (type === 'ws') {
      // Xử lý cho WebSocket (Socket.io)
      const client = ctx.switchToWs().getClient();
      
      // Lưu ý: 'user' ở đây phải khớp với client['user'] bạn đã gán trong WsJwtGuard
      const user = client.user; 
      return data ? user?.[data] : user;
    }
    
    return null;
  },
);