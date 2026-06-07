'use client';

import { useEffect, useState, useRef } from 'react';
import { useSocket } from '@/context/SocketContext';
import { api } from '../../lib/axios';

export default function ChatBox({ currentUser }: { currentUser: any }) {
  const { socket, isConnected } = useSocket();

  const [chatCache, setChatCache] = useState<{ [key: number]: any[] }>({});
  const [input, setInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [userLists, setUserList] = useState<any[]>([]); // Khung xương danh sách tổng lấy từ HTTP API

  // State lưu người mà bạn đang bấm chọn để chat cùng
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const userRef = useRef(currentUser);

  useEffect(() => {
    if (currentUser) {
      userRef.current = currentUser;
    }
  }, [currentUser]);

  // 1. LẤY KHUNG XƯƠNG: Gọi HTTP API lấy danh sách tất cả người dùng ngay khi vào phòng chat
  useEffect(() => {
    if (!currentUser) return;

    const fetchAllUsers = async () => {
      try {
        const res = await api.get('/chat/users');
        // Lọc bỏ chính bản thân mình ra khỏi danh sách hiển thị
        const filtered = res.data.filter((u: any) => Number(u.id) !== Number(currentUser.id));
        setUserList(filtered);
      } catch (error) {
        console.error("Lỗi tải danh sách thành viên qua HTTP:", error);
      }
    };

    fetchAllUsers();
  }, [currentUser?.id]);

  // 2. CHỈ ĐỂ SOCKET LO REAL-TIME: Báo danh Online và lắng nghe tín hiệu chợp tắt trạng thái
  useEffect(() => {
    if (!socket || !currentUser) return;

    // Báo danh với Backend là tôi đang kết nối mạng
    socket.emit('user_online', {
      userId: Number(currentUser.id),
      name: currentUser.name
    });

    // Lắng nghe danh sách các ID đang Online từ BE đổ về (Chỉ nhận mảng ID nhỏ gọn)
    socket.on('get_online_users', (users: any[]) => {
      const filtered = users.filter(u => Number(u.userId) !== Number(currentUser.id));
      setOnlineUsers(filtered);
    });

    // Lắng nghe tin nhắn private real-time
    socket.on('receive_private_message', (newMessage) => {
      const myId = Number(userRef.current?.id);
      const msgSenderId = Number(newMessage.userId || newMessage.senderId);
      const msgReceiverId = Number(newMessage.receiverId);

      const partnerId = msgSenderId === myId ? msgReceiverId : msgSenderId;

      setChatCache((prev) => ({
        ...prev,
        [partnerId]: [...(prev[partnerId] || []), newMessage]
      }));
    });

    return () => {
      socket.off('get_online_users');
      socket.off('receive_private_message');
    };
  }, [socket, currentUser]);

  // 3. 🌟 THẦN CHÚ KHÔI PHỤC LỊCH SỬ CHAT 1-1 (Giữ nguyên tối ưu Cache)
  useEffect(() => {
    if (!selectedUser || !currentUser) return;

    const targetId = Number(selectedUser.id); // Lấy từ khung xương HTTP nên chắc chắn trường là .id

    if (chatCache[targetId]) {
      return;
    }

    const fetchChatHistory = async () => {
      try {
        const res = await api.get(`/chat/history`, {
          params: {
            senderId: Number(currentUser.id),
            receiverId: targetId
          }
        });

        setChatCache(prev => ({
          ...prev,
          [targetId]: res.data
        }));
      } catch (error) {
        console.error("Lỗi khi lấy lịch sử tin nhắn:", error);
      }
    };

    fetchChatHistory();
  }, [selectedUser?.id, currentUser?.id]); 

  // 4. Tự động cuộn xuống
  const targetUserId = selectedUser ? Number(selectedUser.id) : 0;
  const displayMessages = selectedUser ? (chatCache[targetUserId] || []) : [];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages.length]);

  // 5. Hàm gửi tin nhắn Private
  const handleSend = () => {
    if (!input.trim() || !currentUser || !selectedUser) return;

    socket.emit('send_private_message', {
      senderId: Number(currentUser.id),
      receiverId: Number(selectedUser.id),
      content: input,
    });
    setInput('');
  };

  return (
    <div className="flex h-[500px] w-full max-w-4xl border rounded-lg bg-white overflow-hidden shadow-lg text-black">

      {/* CỘT TRÁI: HIỂN THỊ TRỘN DỮ LIỆU */}
      <div className="w-1/3 border-r bg-gray-50 flex flex-col">
        <div className="p-3 border-b bg-gray-100 font-bold flex justify-between items-center">
          <span>Danh sách thành viên</span>
          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-normal">
            {onlineUsers.length} online
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {userLists.length === 0 ? (
            <p className="text-xs text-gray-400 text-center mt-4">Không có thành viên nào</p>
          ) : (
            userLists.map((user, idx) => {
              // So khớp ID từ khung xương HTTP với danh sách Online từ Socket
              const isOnline = onlineUsers.some(onlineUser => Number(onlineUser.userId) === Number(user.id));
              const isSelected = Number(selectedUser?.id) === Number(user.id);

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full text-left p-2.5 rounded-lg text-sm transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full border border-white transition-colors duration-300 ${
                    isOnline ? 'bg-green-500' : 'bg-gray-300'
                  }`}></span>
                  <span className="truncate">{user.name}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* CỘT PHẢI: KHUNG CHAT 1-1 CHÍNH CHỦ */}
      <div className="w-2/3 flex flex-col bg-white">
        {selectedUser ? (
          <>
            <div className="p-3 border-b flex justify-between bg-gray-50 items-center">
              <span className="font-bold text-gray-800">Đang chat với: <span className="text-blue-600">{selectedUser.name}</span></span>
              <span className={isConnected ? "text-green-500 text-xs" : "text-red-500 text-xs"}>
                {isConnected ? "● Kết nối ổn định" : "○ Mất kết nối"}
              </span>
            </div>

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
            <p className="text-sm">Chọn một tài khoản bên trái để bắt đầu chat 1-1</p>
          </div>
        )}
      </div>

    </div>
  );
}