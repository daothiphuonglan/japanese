'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface LearnedKanaContextType {
  learnedIds: Set<string>;
  markAsLearned: (id: string) => void;
  count: number;
}

const LearnedKanaContext = createContext<LearnedKanaContextType>({
  learnedIds: new Set(),
  markAsLearned: () => {},
  count: 0,
});

const STORAGE_KEY = 'learned_kana_ids';

export function LearnedKanaProvider({ children }: { children: ReactNode }) {
  const [learnedIds, setLearnedIds] = useState<Set<string>>(new Set());

  // Hydrate từ localStorage khi mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setLearnedIds(new Set(JSON.parse(stored) as string[]));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const markAsLearned = useCallback((id: string) => {
    setLearnedIds((prev) => {
      if (prev.has(id)) return prev; // không thay đổi nếu đã có
      const next = new Set(prev);
      next.add(id);
      // Persist
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // ignore quota errors
      }
      return next;
    });
  }, []);

  return (
    <LearnedKanaContext.Provider value={{ learnedIds, markAsLearned, count: learnedIds.size }}>
      {children}
    </LearnedKanaContext.Provider>
  );
}

export function useLearnedKana() {
  return useContext(LearnedKanaContext);
}
