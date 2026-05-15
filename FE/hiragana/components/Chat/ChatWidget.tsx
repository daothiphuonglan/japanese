// components/Chat/ChatWidget.tsx
'use client';

import { useState } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useRouter } from 'next/navigation';
import  ChatBox from './ChatBox';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useSocket(); // Lấy user từ Context (tự động có sau khi login)
  const router = useRouter();

  const handleToggle = () => {
    if (!user) {
      if (confirm('Bạn cần đăng nhập để chat. Đến trang đăng nhập?')) {
        router.push('/login');
      }
      return;
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* ĐÂY LÀ CHỖ KẾT HỢP: 
          Lấy 'user' từ Context truyền vào 'currentUser' của ChatBox 
      */}
      {isOpen && user && (
        <div className="mb-4 shadow-2xl">
          <ChatBox currentUser={user} />
        </div>
      )}

      <button
        onClick={handleToggle}
        className={`p-4 rounded-full shadow-lg text-white ${user ? 'bg-blue-600' : 'bg-gray-500'}`}
      >
        {isOpen ? '✖ Đóng' : '💬 Thảo luận'}
      </button>
    </div>
  );
}