'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { socket } from '../lib/socket';
import { api } from '../lib/axios';
import type { User } from '@/types/user';

interface SocketContextType {
  isConnected: boolean;
  socket: typeof socket;
  user: User | null;
  loginContext: (userData: User) => void;   // Không cần token nữa — cookie tự quản lý
  logoutContext: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // 🌟 HÀM THẦN THÁNH 1: Gọi hàm này ở trang Login khi đăng nhập thành công
  // Token đã được BE set vào HttpOnly cookie → FE chỉ cần lưu user info
  const loginContext = useCallback((userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    // Socket.IO: connect với withCredentials để gửi cookie kèm handshake
    socket.io.opts.withCredentials = true;
    if (!socket.connected) {
      socket.connect();
    }
  }, []);

  // 🌟 HÀM THẦN THÁNH 2: Gọi hàm này khi người dùng ấn nút Đăng xuất
  const logoutContext = useCallback(async () => {
    try {
      // Gọi BE xóa cookie phía server
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Lỗi khi logout:', e);
    }
    localStorage.removeItem('user');
    setUser(null);
    socket.disconnect();
  }, []);

  // Hàm bổ trợ đồng bộ trạng thái kết nối
  useEffect(() => {
    // 1. Re-hydrate: Khi F5 trang, gọi /auth/session để verify cookie còn hợp lệ
    const rehydrate = async () => {
      const savedUser = localStorage.getItem('user');
      if (!savedUser) return; // Chưa từng login → bỏ qua

      try {
        // Gọi BE kiểm tra session (cookie tự gửi kèm)
        const res = await api.get('/auth/session');
        const sessionUser: User = res.data.user;
        setUser(sessionUser);

        // Cập nhật localStorage với thông tin mới nhất từ server
        localStorage.setItem('user', JSON.stringify(sessionUser));

        // Kết nối Socket.IO
        socket.io.opts.withCredentials = true;
        socket.connect();
      } catch {
        // Cookie hết hạn hoặc không hợp lệ → xóa user cũ
        console.warn('Session hết hạn, cần đăng nhập lại');
        localStorage.removeItem('user');
        setUser(null);
      }
    };

    rehydrate();

    // 2. Đăng ký sự kiện lắng nghe trạng thái kết nối Socket
    function onConnect() { setIsConnected(true); }
    function onDisconnect() { setIsConnected(false); }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const contextValue = useMemo(() => ({
    isConnected, socket, user, loginContext, logoutContext,
  }), [isConnected, user, loginContext, logoutContext]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};