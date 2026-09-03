import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';

// ── Types ──────────────────────────────────────────────
export interface KanaItem {
  id: number;
  char: string;
  romaji: string;
  type: 'hiragana' | 'katakana';
}

// ── Fetcher functions ──────────────────────────────────
const fetchHiragana = async (): Promise<KanaItem[]> => {
  const res = await api.get('/kana/hiragana');
  return res.data.data;
};

const fetchKatakana = async (): Promise<KanaItem[]> => {
  const res = await api.get('/kana/katakana');
  return res.data.data;
};

// ── Query Keys (centralized để tránh typo) ──────────────
export const kanaKeys = {
  all:      ['kana']                    as const,
  hiragana: ['kana', 'hiragana']        as const,
  katakana: ['kana', 'katakana']        as const,
};

// ── Hooks ──────────────────────────────────────────────

/**
 * Fetch toàn bộ bảng chữ Hiragana.
 * staleTime: Infinity — dữ liệu kana không bao giờ thay đổi,
 * nên cache mãi mãi trong session, không gọi API lại khi navigate.
 */
export function useHiragana() {
  return useQuery({
    queryKey: kanaKeys.hiragana,
    queryFn: fetchHiragana,
    staleTime: Infinity,
  });
}

/**
 * Fetch toàn bộ bảng chữ Katakana.
 */
export function useKatakana() {
  return useQuery({
    queryKey: kanaKeys.katakana,
    queryFn: fetchKatakana,
    staleTime: Infinity,
  });
}
