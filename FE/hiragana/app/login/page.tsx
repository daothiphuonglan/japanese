'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/context/SocketContext';
import { api } from '../../lib/axios';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const router = useRouter();
  
  // 🌟 ĐỒNG BỘ: Lấy hàm kích hoạt trạng thái đăng nhập toàn cục từ SocketContext ra
  const { loginContext } = useSocket();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Giữ nguyên việc truyền dữ liệu formData lên Backend của bạn
      const res = await api.post('/auth/login', formData);
      
      // 🌟 THAY THẾ TẠI ĐÂY: Thay vì tự set bốc tay localStorage dễ gây lag đồng bộ,
      // ta gọi hàm loginContext. Hàm này vừa lo việc lưu localStorage vừa thông báo
      // cho toàn bộ hệ thống (kể cả nút Chat) biết bạn đã đăng nhập để nạp dữ liệu lập tức!
      loginContext(res.data.user, res.data.accessToken);

      alert('Đăng nhập thành công!');
      
      // Chuyển hướng mượt mà, giữ nguyên State ngầm không bị reload trang
      router.push('/'); 
    } catch (err) {
      alert('Sai thông tin đăng nhập!');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-8 bg-white shadow-lg rounded-xl">
        <h2 className="text-2xl font-bold mb-6 text-black">Đăng Nhập</h2>
        <input 
          type="email" placeholder="Email" 
          className="w-full p-2 mb-4 border rounded text-black"
          value={formData.email} // Nên thêm thuộc tính value này để kiểm soát state chuẩn hơn
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
        <input 
          type="password" placeholder="Mật khẩu" 
          className="w-full p-2 mb-6 border rounded text-black"
          value={formData.password} // Nên thêm thuộc tính value này để kiểm soát state chuẩn hơn
          onChange={(e) => setFormData({...formData, password: e.target.value})}
        />
        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Vào học ngay
        </button>
      </form>
    </div>
  );
}