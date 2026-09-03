// components/layout/Navbar.tsx
import { BookOpen, Swords } from "lucide-react";
import Link from "next/link";
import Container from "./Container";

export default function Navbar() {
  return (
    <div className="border-b bg-white">
      <Container>
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2 font-semibold">
            <BookOpen className="w-5 h-5 text-blue-500" />
            Kana Learning
          </div>

          <div className="hidden md:flex gap-6 text-sm">
            <a href="#hiragana" className="text-gray-600 hover:text-blue-500 transition-colors duration-200">Hiragana</a>
            <a href="#katakana" className="text-gray-600 hover:text-blue-500 transition-colors duration-200">Katakana</a>
            <Link
              href="/game"
              className="flex items-center gap-1.5 text-gray-600 hover:text-purple-600 font-medium transition-colors duration-200 group"
            >
              <Swords className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              Competitive
            </Link>
          </div>

          <button className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm">
            Bắt đầu
          </button>
        </div>
      </Container>
    </div>
  );
}