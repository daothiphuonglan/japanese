'use client';

import { useEffect, useState, useRef } from 'react';
import { useSocket } from '@/context/SocketContext';
import { api } from '../../lib/axios'; // Giả định bạn đã có axios config

export default function ChatBox({ currentUser }: { currentUser: any }) {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Load 50 tin nhắn cũ từ Backend (Logic getRecentMessages hôm qua)
  useEffect(() => {
    const loadHistory = async () => {
      const res = await api.get('/chat/messages');
      setMessages(res.data); // Đảo lại để tin mới nhất ở dưới
    };
    loadHistory();
  }, []);

  // 2. Lắng nghe tin nhắn Real-time
  useEffect(() => {
    socket.on('receive_message', (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });
    return () => { socket.off('receive_message'); };
  }, [socket]);

  // 3. Tự động cuộn xuống khi có tin mới
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    socket.emit('send_message', {
      senderId: currentUser.id,
      content: input,
    });
    setInput('');
  };

  return (
    <div className="flex flex-col h-[500px] w-full max-w-md border rounded-lg bg-white">
      <div className="p-3 border-b flex justify-between">
        <span className="font-bold">Global Chat</span>
        <span className={isConnected ? "text-green-500" : "text-red-500"}>
          {isConnected ? "● Online" : "○ Offline"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
       {messages.map((msg, i) => {
  // 1. Tách điều kiện ra thành một biến Boolean rõ ràng
  const isMyMessage = msg.user?.id === currentUser.id || msg.userId === currentUser.id;

  return (
    <div key={i} className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}>
      <span className="text-xs text-gray-500">
        {msg.user?.name || 'User'}
      </span>
      
      {/* 2. Áp dụng biến đó vào phần đổi màu nền cực kỳ gọn gàng */}
      <div className={`px-3 py-2 rounded-lg ${isMyMessage ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
        {msg.content}
      </div>
    </div>
  );
})}
        <div ref={scrollRef} />
      </div>

      <div className="p-3 border-t flex gap-2">
        <input 
          className="flex-1 border rounded px-2 py-1 text-black"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend} className="bg-blue-600 text-white px-4 py-1 rounded">Gửi</button>
      </div>
    </div>
  );
}