'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/context/SocketContext';
import { api } from '../../lib/axios';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const router = useRouter();
  
  const { loginContext } = useSocket();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', formData);
      
      loginContext(res.data.user, res.data.accessToken);

      alert('Đăng nhập thành công!');
      
      router.push('/'); 
    } catch (err) {
      alert('Sai thông tin đăng nhập!');
    }
  }, [formData, loginContext, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-8 bg-white shadow-lg rounded-xl">
        <h2 className="text-2xl font-bold mb-6 text-black">Đăng Nhập</h2>
        <input 
          type="email" placeholder="Email" 
          className="w-full p-2 mb-4 border rounded text-black"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
        />
        <input 
          type="password" placeholder="Mật khẩu" 
          className="w-full p-2 mb-6 border rounded text-black"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
        />
        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Vào học ngay
        </button>
      </form>
    </div>
  );
}