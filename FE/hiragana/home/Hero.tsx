'use client';

import Container from "../layout/Container";
import { useLearnedKana } from "@/context/LearnedKanaContext";

export default function Hero() {
  const { count } = useLearnedKana();

  return (
    <Container>
      <div className="grid md:grid-cols-2 gap-10 items-center py-16">
        <div>
          <h1 className="text-4xl font-bold leading-tight">
            Học bảng chữ cái tiếng Nhật dễ nhớ nhất cho người mới
          </h1>

          <p className="text-gray-500 mt-4">
            Học Hiragana và Katakana với audio chuẩn, mẹo nhớ nhanh và luyện tập ngay.
          </p>

          <div className="mt-6 flex gap-4">
            <a
              href="#hiragana"
              className="bg-blue-500 text-white px-5 py-3 rounded-xl"
            >
              Học Hiragana
            </a>

            <a
              href="#katakana"
              className="border px-5 py-3 rounded-xl"
            >
              Học Katakana
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="w-[320px] h-[320px] rounded-full bg-blue-100 flex items-center justify-center text-6xl mx-auto">
            あ
          </div>

          <div className="absolute top-10 left-0 bg-white shadow px-4 py-2 rounded-xl">
            <p className="text-xs text-gray-500">Đã học</p>
            <p className="font-bold text-lg">{count} chữ</p>
          </div>
        </div>
      </div>
    </Container>
  );
}