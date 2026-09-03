/**
 * Shared User type — dùng thay thế `any` ở toàn bộ project.
 * Đây là shape user trả về từ API /auth/login.
 */
export interface User {
  id: number;
  email: string;
  name: string;
}
