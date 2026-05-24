'use client';

import { useEffect, useState, useRef } from 'react';
import { useSocket } from '@/context/SocketContext';
import { api } from '../../lib/axios';

export default function ChatBox({ currentUser }: { currentUser: any }) {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  
  // State lưu người mà bạn đang bấm chọn để chat cùng (ví dụ bấm chọn Member)
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const userRef = useRef(currentUser);

  useEffect(() => {
    userRef.current = currentUser;
  }, [currentUser]);

  // 1. Báo danh với Server là tôi Online + Lắng nghe danh sách Online
  useEffect(() => {
    if (!socket || !currentUser) return;

    // Báo danh
    socket.emit('user_online', { userId: currentUser.id, name: currentUser.name });

    // Lắng nghe danh sách Online từ BE đổ về
    socket.on('get_online_users', (users: any[]) => {
      // Lọc bỏ chính bản thân mình ra khỏi danh sách hiển thị bên cột online
      const filtered = users.filter(u => Number(u.userId) !== Number(currentUser.id));
      setOnlineUsers(filtered);
    });

    // Lắng nghe tin nhắn private real-time
    socket.on('receive_private_message', (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      socket.off('get_online_users');
      socket.off('receive_private_message');
    };
  }, [socket, currentUser]);

  // 2. Load lịch sử chat (Chỉnh sửa để sau này gọi API lọc theo phòng chat)
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await api.get('/chat/messages');
        setMessages(res.data);
      } catch (error) {
        console.error("Lỗi tải lịch sử chat:", error);
      }
    };
    loadHistory();
  }, []);

  // 3. Tự động cuộn xuống
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4. Hàm gửi tin nhắn Private
  const handleSend = () => {
    if (!input.trim() || !currentUser || !selectedUser) return;

    socket.emit('send_private_message', {
      senderId: Number(currentUser.id),
      receiverId: Number(selectedUser.userId), // Gửi tới ID người được chọn
      content: input,
    });
    setInput('');
  };

  // 5. Lọc tin nhắn: Chỉ hiển thị tin nhắn giữa (currentUser và selectedUser)
  const displayMessages = messages.filter(msg => {
    if (!selectedUser) return false;
    const msgSenderId = Number(msg.userId || msg.senderId);
    const msgReceiverId = Number(msg.receiverId);
    const myId = Number(currentUser?.id);
    const targetId = Number(selectedUser.userId);

    // Điều kiện: (Tôi gửi -> Họ nhận) HOẶC (Họ gửi -> Tôi nhận)
    return (msgSenderId === myId && msgReceiverId === targetId) || 
           (msgSenderId === targetId && msgReceiverId === myId);
  });

  return (
    <div className="flex h-[500px] w-full max-w-4xl border rounded-lg bg-white overflow-hidden shadow-lg text-black">
      
      {/* CỘT TRÁI: DANH SÁCH ACCOUNT ĐANG ONLINE */}
      <div className="w-1/3 border-r bg-gray-50 flex flex-col">
        <div className="p-3 border-b bg-gray-100 font-bold flex justify-between items-center">
          <span>Người dùng Online</span>
          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-normal">
            {onlineUsers.length} đang on
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {onlineUsers.length === 0 ? (
            <p className="text-xs text-gray-400 text-center mt-4">Chưa có ai online</p>
          ) : (
            onlineUsers.map((user, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedUser(user)}
                className={`w-full text-left p-2.5 rounded-lg text-sm transition-all flex items-center gap-2 ${
                  selectedUser?.userId === user.userId 
                    ? 'bg-blue-600 text-white font-medium shadow-sm' 
                    : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></span>
                <span className="truncate">{user.name}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* CỘT PHẢI: KHUNG CHAT 1-1 CHÍNH CHỦ */}
      <div className="w-2/3 flex flex-col bg-white">
        {selectedUser ? (
          <>
            {/* Header người đang chat cùng */}
            <div className="p-3 border-b flex justify-between bg-gray-50 items-center">
              <span className="font-bold text-gray-800">Đang chat với: <span className="text-blue-600">{selectedUser.name}</span></span>
              <span className={isConnected ? "text-green-500 text-xs" : "text-red-500 text-xs"}>
                {isConnected ? "● Kết nối ổn định" : "○ Mất kết nối"}
              </span>
            </div>

            {/* Vùng nội dung tin nhắn chat 1-1 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {displayMessages.map((msg, i) => {
                const msgUserId = Number(msg.user?.id || msg.userId || msg.senderId);
                const isMyMessage = msgUserId === Number(currentUser?.id);
                const senderName = isMyMessage ? (currentUser?.name || 'Tôi') : selectedUser.name;

                return (
                  <div key={i} className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] text-gray-400 mb-0.5 px-1">{senderName}</span>
                    <div className={`px-3 py-2 rounded-xl max-w-[75%] text-sm break-words shadow-sm ${
                      isMyMessage ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            {/* Input gõ tin nhắn */}
            <div className="p-3 border-t flex gap-2 bg-white">
              <input
                className="flex-1 border rounded-lg px-3 py-2 text-sm text-black outline-none focus:border-blue-500 transition-all bg-gray-50"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={`Nhắn tin cho ${selectedUser.name}...`}
              />
              <button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-sm rounded-lg transition-colors font-medium">Gửi</button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
            <svg className="w-16 h-16 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            <p className="text-sm">Chọn một tài khoản đang online bên trái để bắt đầu chat 1-1</p>
          </div>
        )}
      </div>

    </div>
  );
}