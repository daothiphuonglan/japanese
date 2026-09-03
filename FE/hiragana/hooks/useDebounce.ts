'use client';

import { useRef, useCallback, useEffect } from 'react';

/**
 * useDebounce — Trì hoãn gọi hàm cho đến khi user ngừng trigger một khoảng thời gian.
 *
 * Ví dụ: search input — chỉ gọi API sau khi user ngừng gõ 300ms.
 *
 * @param fn   - Hàm cần debounce
 * @param delay - Thời gian chờ (ms) trước khi thực thi
 */
export function useDebounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return useCallback(
    (...args: any[]) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay],
  ) as T;
}

/**
 * useThrottle — Giới hạn tần suất gọi hàm (tối đa 1 lần / khoảng thời gian).
 *
 * Ví dụ: scroll handler, resize handler, button click anti-spam.
 *
 * @param fn    - Hàm cần throttle
 * @param limit - Khoảng cách tối thiểu giữa 2 lần gọi (ms)
 */
export function useThrottle<T extends (...args: any[]) => void>(
  fn: T,
  limit: number,
): T {
  const lastCallRef = useRef(0);

  return useCallback(
    (...args: any[]) => {
      const now = Date.now();
      if (now - lastCallRef.current >= limit) {
        lastCallRef.current = now;
        fn(...args);
      }
    },
    [fn, limit],
  ) as T;
}
