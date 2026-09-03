'use client';

import { useEffect, useState } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

/**
 * Banner hiển thị ở đầu trang khi mất mạng.
 * - Tự xuất hiện / biến mất mượt mà qua CSS transition.
 * - Khi mạng trở lại, hiện thông báo "Đã kết nối lại" trong 3 giây rồi ẩn.
 */
export function OfflineBanner() {
  const { isOnline, lastOnlineAt } = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);

  // Khi mạng trở lại → hiện "Đã kết nối lại" 3 giây
  useEffect(() => {
    if (isOnline && lastOnlineAt) {
      setShowReconnected(true);
      const t = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isOnline, lastOnlineAt]);

  const isVisible = !isOnline || showReconnected;

  return (
    <div
      aria-live="polite"
      role="status"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      {!isOnline ? (
        <div
          style={{
            background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 100%)',
            borderBottom: '1px solid #e74c3c',
            color: '#fff',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          {/* Animated wifi-off icon */}
          <span style={{ fontSize: '18px', animation: 'pulse 2s infinite' }}>📵</span>
          <span>
            Bạn đang <strong>offline</strong> — Dữ liệu hiển thị từ bộ nhớ đệm
          </span>
          <span
            style={{
              background: 'rgba(231,76,60,0.2)',
              border: '1px solid rgba(231,76,60,0.4)',
              borderRadius: '12px',
              padding: '2px 10px',
              fontSize: '11px',
              color: '#e74c3c',
            }}
          >
            OFFLINE
          </span>
        </div>
      ) : showReconnected ? (
        <div
          style={{
            background: 'linear-gradient(90deg, #0f3d2e 0%, #1a5c3e 100%)',
            borderBottom: '1px solid #27ae60',
            color: '#fff',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <span style={{ fontSize: '18px' }}>✅</span>
          <span>Đã kết nối lại — Dữ liệu đang được cập nhật...</span>
        </div>
      ) : null}
    </div>
  );
}
