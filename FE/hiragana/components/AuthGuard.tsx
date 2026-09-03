'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/context/SocketContext';

interface AuthGuardProps {
  children: React.ReactNode;
  /** URL redirect khi chưa login (mặc định: /login) */
  redirectTo?: string;
}

/**
 * Route Protection — wrap component cần bảo vệ.
 * Nếu user chưa login → redirect về /login.
 *
 * Sử dụng:
 *   <AuthGuard>
 *     <ProtectedPage />
 *   </AuthGuard>
 */
export function AuthGuard({ children, redirectTo = '/login' }: AuthGuardProps) {
  const { user } = useSocket();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace(redirectTo);
    }
  }, [user, router, redirectTo]);

  // Chưa có user → hiển thị loading hoặc null (tránh flash content)
  if (!user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0f',
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#6366f1',
                animation: 'bounce 1s ease-in-out infinite',
                animationDelay: `${i * 200}ms`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
