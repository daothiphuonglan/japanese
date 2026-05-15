// components/layout/Navbar.tsx
'use client';
import { BookOpen } from "lucide-react";
import Container from "./Container";
import { useState } from 'react';
import ChatBox from '@/components/Chat/ChatBox';

export default function Navbar() {
  const [isOpenChat, setIsOpenChat] = useState(false);
  const currentUser = { id: 1, name: 'Tên của bạn' };
  return (
    <div className="border-b bg-white">
      <Container>
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2 font-semibold">
            <BookOpen className="w-5 h-5 text-blue-500" />
            Kana Learning
          </div>

          <div className="hidden md:flex gap-6 text-sm">
            <a href="#hiragana">Hiragana</a>
            <a href="#katakana">Katakana</a>
          </div>

          <button className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm">
            Bắt đầu
          </button>
        </div>
      </Container>

      <div>
        {/* Nút bấm hiển thị Chat ở góc màn hình */}
        <div className="fixed bottom-5 right-5 z-50">
          <button
            onClick={() => setIsOpenChat(!isOpenChat)}
            className="bg-blue-600 p-4 rounded-full shadow-lg text-white"
          >
            {isOpenChat ? '✖' : '💬'}
          </button>

          {/* Hiển thị màn hình chat khi bấm vào */}
          {isOpenChat && (
            <div className="absolute bottom-16 right-0 w-[350px]">
              <ChatBox currentUser={currentUser} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}