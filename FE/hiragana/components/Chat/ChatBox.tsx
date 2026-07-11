'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useSocket } from '@/context/SocketContext';
import { api } from '../../lib/axios';

export default function ChatBox({ currentUser }: { currentUser: any }) {
  const { socket, isConnected } = useSocket();

  const [chatCache, setChatCache] = useState<{ [key: number]: any[] }>({});
  const [input, setInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [userLists, setUserList] = useState<any[]>([]); // Khung xương danh sách lấy từ HTTP API

  // State lưu người mà bạn đang bấm chọn để chat cùng
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const userRef = useRef(currentUser);
  const isFirstLoad = useRef(true); // Lính canh quản lý cuộn thông minh khi mở hộp chat

  useEffect(() => {
    if (currentUser) {
      userRef.current = currentUser;
    }
  }, [currentUser]);

  // ==========================================
  // 🌟 TUYỆT CHIÊU TỐI ƯU: SẮP XẾP DANH SÁCH LÊN ĐẦU BẰNG USEMEMO
  // ==========================================
  const sortedUserList = useMemo(() => {
    return [...userLists].sort((a, b) => {
      const timeA = a.lastMessageTime || 0;
      const timeB = b.lastMessageTime || 0;
      
      // Nếu cả 2 chưa từng nhắn tin cho nhau, giữ nguyên sắp xếp theo bảng chữ cái A-Z
      if (timeA === 0 && timeB === 0) {
        return a.name.localeCompare(b.name);
      }
      
      // Ngược lại, ông nào có mốc thời gian tin nhắn lớn hơn (mới hơn) sẽ được đẩy lên đầu
      return timeB - timeA;
    });
  }, [userLists]); // Khối lệnh này chỉ chạy lại khi mảng gốc userLists bị cập nhật thuộc tính mốc thời gian

  // Mỗi khi bạn bấm đổi phòng chat với người khác, reset lại lính canh cuộn trang
  useEffect(() => {
    isFirstLoad.current = true;
  }, [selectedUser?.id]);


  // 1. LẤY KHUNG XƯƠNG TỪ HTTP API
  useEffect(() => {
    if (!currentUser) return;

    const fetchAllUsers = async () => {
      try {
        const res = await api.get('/chat/users');
        // Lọc bỏ chính bản thân mình ra khỏi danh sách, đồng thời nạp mốc thời gian mặc định là 0
        const filtered = res.data
          .filter((u: any) => Number(u.id) !== Number(currentUser.id))
          .map((u: any) => ({ ...u, lastMessageTime: 0 })); // 👈 Gắn mốc thời gian mặc định ban đầu
        setUserList(filtered);
      } catch (error) {
        console.error("Lỗi tải danh sách thành viên qua HTTP:", error);
      }
    };

    fetchAllUsers();
  }, [currentUser?.id]);


  // 2. CHỈ ĐỂ SOCKET LO REAL-TIME & TIN NHẮN ĐẾN
  useEffect(() => {
    if (!socket || !currentUser) return;

    // Báo danh với Backend là tôi đang kết nối mạng
    socket.emit('user_online', {
      userId: Number(currentUser.id),
      name: currentUser.name
    });

    // Lắng nghe danh sách các ID đang Online từ BE đổ về
    socket.on('get_online_users', (users: any[]) => {
      const filtered = users.filter(u => Number(u.userId) !== Number(currentUser.id));
      setOnlineUsers(filtered);
    });

    // Lắng nghe tin nhắn private real-time từ người khác gửi đến
    socket.on('receive_private_message', (newMessage) => {
      const myId = Number(userRef.current?.id);
      const msgSenderId = Number(newMessage.userId || newMessage.senderId);
      const msgReceiverId = Number(newMessage.receiverId);

      // Xác định ID của người đang chat với mình trong cuộc hội thoại này
      const partnerId = msgSenderId === myId ? msgReceiverId : msgSenderId;

      // 🌟 SỬA ĐÚNG KHÚC NÀY: Check trùng tin nhắn dựa trên id lưu từ DB để không bị x2 tin nhắn
      setChatCache((prev) => {
        const currentChat = prev[partnerId] || [];
        const isExist = currentChat.some((m) => m.id === newMessage.id);

        if (isExist) return prev; // Nếu đã có tin nhắn id này rồi thì đứng im không nạp nữa

        return {
          ...prev,
          [partnerId]: [...currentChat, newMessage]
        };
      });

      // Kịch bản B: Cập nhật mốc thời gian mới nhất để kích hoạt useMemo đẩy User này lên đầu list
      setUserList((prevList) => 
        prevList.map(u => Number(u.id) === partnerId ? { ...u, lastMessageTime: Date.now() } : u)
      );
    });

    // Thêm dọn dẹp cổng nghe để triệt tiêu lỗi listen x2
    return () => {
      socket.off('get_online_users');
      socket.off('receive_private_message');
    };
  }, [socket, currentUser]);


  // 3. THẦN CHÚ KHÔI PHỤC LỊCH SỬ CHAT TỪ DATABASE (Có chốt chặn Cache)
  useEffect(() => {
    if (!selectedUser || !currentUser) return;

    const targetId = Number(selectedUser.id);

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


  // 4. TỰ ĐỘNG CUỘN XUỐNG THÔNG MINH (Không bị giật hình khi mở box chat)
  const targetUserId = selectedUser ? Number(selectedUser.id) : 0;
  const displayMessages = selectedUser ? (chatCache[targetUserId] || []) : [];

  useEffect(() => {
    if (displayMessages.length === 0) return;

    if (isFirstLoad.current) {
      // Vừa mở chat box phát nhảy ngay xuống tin nhắn mới nhất lập tức (0 giây độ trễ)
      scrollRef.current?.scrollIntoView({ behavior: 'auto' });
      isFirstLoad.current = false;
    } else {
      // Đang chat dở mà có chữ mới bay vào thì cuộn mượt mà xuống dưới
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayMessages.length]);


  // 5. HÀM CHỦ ĐỘNG GỬI TIN NHẮN PRIVATE
const handleSend = () => {
  if (!input.trim() || !currentUser || !selectedUser) return;

  const targetId = Number(selectedUser.id);
  
  // Tạo một object tin nhắn tạm thời để hiển thị ngay trên màn hình của mình
  const myNewMessage = {
    id: Date.now(), // Dùng tạm timestamp làm ID để tránh trùng
    content: input,
    userId: Number(currentUser.id),
    senderId: Number(currentUser.id),
    receiverId: targetId,
    createdAt: new Date().toISOString(),
    user: { id: Number(currentUser.id), name: currentUser.name }
  };

  // 1. Đút luôn vào cache của mình để hiển thị lập tức
  setChatCache((prev) => ({
    ...prev,
    [targetId]: [...(prev[targetId] || []), myNewMessage]
  }));

  // 2. Bắn tin nhắn qua cổng socket lên Server cho đối phương nhận
  socket.emit('send_private_message', {
    senderId: Number(currentUser.id),
    receiverId: targetId,
    content: input,
  });

  // Đẩy user lên đầu danh sách
  setUserList((prevList) => 
    prevList.map(u => Number(u.id) === targetId ? { ...u, lastMessageTime: Date.now() } : u)
  );

  setInput('');
};

  // 🌟 GIỮ NGUYÊN TOÀN BỘ GIAO DIỆN UI GỐC CỦA BẠN 100%
  return (
    <div className="flex h-[500px] w-full max-w-4xl border rounded-lg bg-white overflow-hidden shadow-lg text-black">

      {/* CỘT TRÁI: HIỂN THỊ DANH SÁCH ĐÃ ĐƯỢC TỰ ĐỘNG SẮP XẾP QUA USEMEMO */}
      <div className="w-1/3 border-r bg-gray-50 flex flex-col">
        <div className="p-3 border-b bg-gray-100 font-bold flex justify-between items-center">
          <span>Danh sách thành viên</span>
          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-normal">
            {onlineUsers.length} online
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sortedUserList.length === 0 ? (
            <p className="text-xs text-gray-400 text-center mt-4">Không có thành viên nào</p>
          ) : (
            sortedUserList.map((user, idx) => {
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

      {/* CỘT PHẢI: KHUNG CHAT 1-1 */}
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