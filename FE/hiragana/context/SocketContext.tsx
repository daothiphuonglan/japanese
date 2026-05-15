'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { socket } from '../lib/socket';

interface SocketContextType {
  isConnected: boolean;
  socket: typeof socket;
  user: any | null;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  useEffect(() => {
    // Lấy token từ localStorage (giả định từ phần Auth hôm qua)
    const token = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');

   if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      socket.auth = { token };
      socket.connect();
    }

    function onConnect() { setIsConnected(true); }
    function onDisconnect() { setIsConnected(false); }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ isConnected, socket, user }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};