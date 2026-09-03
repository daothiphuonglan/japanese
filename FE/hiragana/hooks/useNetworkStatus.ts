'use client';

import { useEffect, useState, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  /** Lần cuối mất kết nối (null nếu chưa bao giờ) */
  lastOfflineAt: Date | null;
  /** Lần cuối có lại kết nối (null nếu chưa từng offline) */
  lastOnlineAt: Date | null;
}

/**
 * Hook theo dõi trạng thái mạng của trình duyệt.
 * - isOnline: false → báo ngay bằng banner UI
 * - TanStack Query tự động refetch khi isOnline = true trở lại
 *   (nhờ cấu hình refetchOnReconnect: true trong queryClient)
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? window.navigator.onLine : true
  );
  const [lastOfflineAt, setLastOfflineAt] = useState<Date | null>(null);
  const [lastOnlineAt, setLastOnlineAt]   = useState<Date | null>(null);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setLastOnlineAt(new Date());
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setLastOfflineAt(new Date());
  }, []);

  useEffect(() => {
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, lastOfflineAt, lastOnlineAt };
}
