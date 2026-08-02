'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';

/**
 * useState initializer chỉ chạy 1 lần — client-side safe.
 * Nếu SSR (window undefined) → persister = null → dùng QueryClientProvider thông thường.
 * Nếu client → tạo persister → PersistQueryClientProvider lưu cache vào localStorage.
 */
export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [persister] = useState(() => {
    if (typeof window === 'undefined') return null;
    return createSyncStoragePersister({
      storage: window.localStorage,
      key: 'HIRAGANA_QUERY_CACHE',
    });
  });

  // SSR fallback — không persist, nhưng QueryClient vẫn hoạt động bình thường
  if (!persister) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        buster: 'v1', // tăng số này khi đổi structure API để xóa cache cũ
        dehydrateOptions: {
          // Chỉ persist query có gcTime > 1h (kana data)
          // user profile, game state, v.v. không persist
          shouldDehydrateQuery: (query) =>
            query.gcTime !== undefined && query.gcTime > 60 * 60 * 1000,
        },
      }}
    >
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </PersistQueryClientProvider>
  );
}
