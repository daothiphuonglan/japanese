'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useRouter } from 'next/navigation';
import ChatBox from './ChatBox';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useSocket(); // Giữ nguyên lấy 'user' từ Context
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Đảm bảo code chạy ở Client-side hoàn toàn trước khi check render
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleToggle = () => {
    if (!user) {
      if (confirm('Bạn cần đăng nhập để chat. Đến trang đăng nhập?')) {
        router.push('/login');
      }
      return;
    }
    setIsOpen(!isOpen);
  };

  if (!isMounted) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* 🌟 ĐỒNG BỘ: Truyền biến 'user' từ Context vào thuộc tính currentUser của ChatBox 
      */}
      {isOpen && user && (
        <div className="mb-4 shadow-2xl">
          <ChatBox currentUser={user} />
        </div>
      )}

      <button
        onClick={handleToggle}
        className={`p-4 rounded-full shadow-lg text-white transition-all ${
          user ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-500 hover:bg-gray-600'
        }`}
      >
        {isOpen ? '✖ Đóng' : '💬 Thảo luận'}
      </button>
    </div>
  );
}