'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { socket } from '../lib/socket';

interface SocketContextType {
  isConnected: boolean;
  socket: typeof socket;
  user: any | null;
  loginContext: (userData: any, token: string) => void; // Hàm kích hoạt khi login thành công
  logoutContext: () => void;                           // Hàm kích hoạt khi logout
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<any | null>(null);

  // 🌟 HÀM THẦN THÁNH 1: Gọi hàm này ở trang Login khi đăng nhập thành công
  const loginContext = useCallback((userData: any, token: string) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    setUser(userData);
    socket.auth = { token };
    if (!socket.connected) {
      socket.connect();
    }
  }, []);

  // 🌟 HÀM THẦN THÁNH 2: Gọi hàm này khi người dùng ấn nút Đăng xuất
  const logoutContext = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
    socket.disconnect();
  }, []);

  // Hàm bổ trợ đồng bộ trạng thái kết nối
  useEffect(() => {
    // 1. Tự động kiểm tra nạp lại dữ liệu (Re-hydrate) một lần duy nhất nếu F5 trang
    const token = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        socket.auth = { token };
        socket.connect();
      } catch (e) {
        console.error("Lỗi parse thông tin user từ localStorage", e);
      }
    }

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

  return (
    <SocketContext.Provider value={{ isConnected, socket, user, loginContext, logoutContext }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};