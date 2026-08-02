'use client';

import { QueryClient } from '@tanstack/react-query';

/**
 * Smart retry: không retry khi lỗi 4xx (client error) vì retry cũng
 * không giải quyết được. Chỉ retry khi lỗi mạng hoặc 5xx.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  // Nếu đã retry 3 lần → dừng
  if (failureCount >= 3) return false;

  // Axios error: không retry 4xx
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    (error as any).response?.status >= 400 &&
    (error as any).response?.status < 500
  ) {
    return false;
  }

  return true; // retry cho network error, 5xx, v.v.
}

/**
 * Exponential backoff: lần 1 chờ 1s, lần 2 chờ 2s, lần 3 chờ 4s
 * Tránh DDoS server khi bị lag.
 */
function retryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 10_000);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            5 * 60 * 1000,  // 5 phút
      gcTime:               24 * 60 * 60 * 1000,  // 24 giờ — sống lâu trong cache để serve offline
      retry:                shouldRetry,
      retryDelay:           retryDelay,
      refetchOnWindowFocus: true,   // refetch khi user quay lại tab
      refetchOnReconnect:   true,   // refetch ngay khi mạng trở lại ✨
      networkMode:          'offlineFirst', // Luôn serve cache trước, kể cả khi offline
    },
    mutations: {
      retry:      shouldRetry,
      retryDelay: retryDelay,
      networkMode: 'offlineFirst',
    },
  },
});
