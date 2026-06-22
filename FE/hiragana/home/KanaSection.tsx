'use client'; // Chuyển thành Client Component để dùng đối tượng Audio của trình duyệt

import DialogHiragana from "@/components/DialogHiragana/Dialog";
import Container from "../layout/Container";
import DrawCanvas from "@/components/DrawCanvas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";

export default function KanaSection() {
  const [data, setData] = useState<any[]>([]);

  // Lấy dữ liệu chữ cái Kana từ API local
  useEffect(() => {
    async function fetchKana() {
      try {
        const res = await fetch("http://localhost:3000/kana");
        const json = await res.json();
        setData(json.data);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu chữ Kana:", error);
      }
    }
    fetchKana();
  }, []);

  // 🌟 HÀM PHÁT ÂM QUA GOOGLE TRANSLATE TTS
 const playSound = (character: string) => {
  if (!character) return;
  
  // Dùng link API TTS miễn phí công cộng (Không bị chặn Referer)
  const audioUrl = `https://dict.youdao.com/dictvoice?le=jap&audio=${encodeURIComponent(character)}`;
  
  const audio = new Audio(audioUrl);
  audio.play().catch(err => console.error("Lỗi phát âm:", err));
};

  return (
    <>
      <Container>
        <section id="hiragana" className="py-16">
          <h2 className="text-2xl font-bold mb-6">
            Bảng chữ cái Hiragana
          </h2>

          <div className="grid grid-cols-5 gap-4">
            {data?.map((item: any) => (
              <Dialog key={item.id}>
                <DialogTrigger asChild>
                  {/* 💡 MẸO UX: Nếu muốn bấm phát ở ngoài bảng tổng là nghe âm thanh luôn, bạn có thể thêm:
                      onClick={() => playSound(item.char)} vào ngay Button này */}
                  <Button className="bg-white rounded-xl shadow p-6 text-2xl hover:bg-blue-50 text-black">
                    {item.char}
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-purple-400">Chữ cái: {item.char}</DialogTitle>
                    <DialogDescription>
                      Hãy luyện viết theo nét và nghe phát âm nhé ✍️🔊
                    </DialogDescription>
                  </DialogHeader>

                  {/* HIỂN THỊ CHỮ & NÚT LOA PHÁT ÂM */}
                  <div className="flex flex-col items-center justify-center gap-4 py-4">
                    <div className="text-center text-6xl font-bold text-gray-800">
                      {item.char}
                    </div>
                    
                    {/* 🔊 NÚT PHÁT ÂM SỬ DỤNG GOOGLE API */}
                    <Button 
                      onClick={() => playSound(item.char)} // 👈 Truyền trực tiếp chữ 'あ', 'い', 'う'... vào đây
                      variant="outline" 
                      className="flex items-center gap-2 border-purple-300 hover:bg-purple-50 text-purple-600 rounded-full px-4 py-2 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                      Nghe phát âm
                    </Button>
                  </div>

                  {/* CANVAS */}
                  <DrawCanvas />

                  <DialogFooter className="sm:justify-start">
                    <DialogClose asChild>
                      <Button type="button">Close</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </section>
      </Container>
      <iframe width="1351" height="480" src="https://www.youtube.com/embed/x9pixMubs8A" title="Học bảng chữ cái tiếng nhật Hiragana, Katakana trong 4H | Học tiếng Nhật cho người mới bắt đầu" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" ></iframe>
    </>
  );
}