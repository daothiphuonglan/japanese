// components/layout/Navbar.tsx
import { BookOpen } from "lucide-react";
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
            <a href="#hiragana">Hiragana</a>
            <a href="#katakana">Katakana</a>
          </div>

          <button className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm">
            Bắt đầu
          </button>
        </div>
      </Container>
    </div>
  );
}