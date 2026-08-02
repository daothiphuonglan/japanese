'use client';

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
} from "@/components/ui/dialog";
import { useEffect, useState, useCallback, memo, useRef } from "react";
import { useLearnedKana } from "@/context/LearnedKanaContext";

// ─── Memoized grid item to prevent re-renders when dialog state changes ───
const KanaGridItem = memo(function KanaGridItem({
  item,
  onSelect,
  learned,
}: {
  item: any;
  onSelect: (item: any) => void;
  learned: boolean;
}) {
  return (
    <Button
      onClick={() => onSelect(item)}
      className={`relative rounded-xl shadow p-6 text-2xl text-black transition-colors ${
        learned
          ? "bg-green-100 hover:bg-green-200 border border-green-400"
          : "bg-white hover:bg-blue-50"
      }`}
    >
      {item.char}
      {learned && (
        <span className="absolute top-1 right-1 text-green-500 text-xs">✓</span>
      )}
    </Button>
  );
});

// ─── Lazy YouTube embed: only loads iframe when scrolled into view ───
function LazyYouTube() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full aspect-video">
      {isVisible ? (
        <iframe
          width="100%"
          height="100%"
          src="https://www.youtube.com/embed/x9pixMubs8A"
          title="Học bảng chữ cái tiếng nhật Hiragana, Katakana trong 4H | Học tiếng Nhật cho người mới bắt đầu"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
          <span className="text-lg">▶ Đang tải video...</span>
        </div>
      )}
    </div>
  );
}

// ─── Speech recognition hook ───
type RecordState = "idle" | "recording" | "checking" | "correct" | "incorrect";

function useSpeechCheck(targetChar: string | undefined) {
  const [recordState, setRecordState] = useState<RecordState>("idle");
  const recognitionRef = useRef<any>(null);

  // Reset khi chuyển chữ khác
  useEffect(() => {
    setRecordState("idle");
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
  }, [targetChar]);

  const startRecording = useCallback(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ nhận dạng giọng nói. Hãy dùng Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;

    recognitionRef.current = recognition;
    setRecordState("recording");

    recognition.onresult = (event: any) => {
      setRecordState("checking");
      const results: string[] = [];
      for (let i = 0; i < event.results[0].length; i++) {
        results.push(event.results[0][i].transcript.trim());
      }

      // So sánh với tất cả alternatives
      const isCorrect = results.some(
        (r) => r === targetChar || r.includes(targetChar ?? "")
      );
      setRecordState(isCorrect ? "correct" : "incorrect");
    };

    recognition.onerror = () => setRecordState("idle");
    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        // Nếu chưa có kết quả thì về idle
        setRecordState((prev) => (prev === "recording" ? "idle" : prev));
      }
    };

    recognition.start();
  }, [targetChar]);

  return { recordState, startRecording };
}

export default function KanaSection() {
  const [hiraganaData, setHiraganaData] = useState<any[]>([]);
  const [katakanaData, setKatakanaData] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const { learnedIds, markAsLearned } = useLearnedKana();
  const { recordState, startRecording } = useSpeechCheck(selectedItem?.char);

  // Đánh dấu đã học khi đọc đúng
  useEffect(() => {
    if (recordState === "correct" && selectedItem?.id) {
      markAsLearned(String(selectedItem.id));
    }
  }, [recordState, selectedItem, markAsLearned]);

  // Lấy dữ liệu chữ cái Hiragana từ API
  useEffect(() => {
    async function fetchHiragana() {
      try {
        const res = await fetch("http://localhost:3000/kana/hiragana");
        const json = await res.json();
        setHiraganaData(json.data);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu chữ Hiragana:", error);
      }
    }
    fetchHiragana();
  }, []);

  // Lấy dữ liệu chữ cái Katakana từ API
  useEffect(() => {
    async function fetchKatakana() {
      try {
        const res = await fetch("http://localhost:3000/kana/katakana");
        const json = await res.json();
        setKatakanaData(json.data);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu chữ Katakana:", error);
      }
    }
    fetchKatakana();
  }, []);

  // Phát âm bằng Web Speech API
  const playSound = useCallback((character: string) => {
    if (!character || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(character);
    utterance.lang = "ja-JP";
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }, []);

  const handleSelect = useCallback((item: any) => {
    setSelectedItem(item);
  }, []);

  // Label & màu cho nút thu âm
  const recordLabel = {
    idle: "🎤 Thu âm",
    recording: "⏹ Đang nghe...",
    checking: "⏳ Đang kiểm tra...",
    correct: "✅ Đúng rồi!",
    incorrect: "❌ Thử lại",
  }[recordState];

  const recordColor = {
    idle: "border-red-300 hover:bg-red-50 text-red-600",
    recording: "border-red-500 bg-red-50 text-red-700 animate-pulse",
    checking: "border-yellow-400 bg-yellow-50 text-yellow-700",
    correct: "border-green-400 bg-green-50 text-green-700",
    incorrect: "border-red-400 bg-red-50 text-red-700",
  }[recordState];

  return (
    <>
      {/* ── HIRAGANA SECTION ── */}
      <Container>
        <section id="hiragana" className="py-16">
          <h2 className="text-2xl font-bold mb-6">Bảng chữ cái Hiragana</h2>

          <div className="grid grid-cols-5 gap-4">
            {hiraganaData?.map((item: any) => (
              <KanaGridItem
                key={item.id}
                item={item}
                onSelect={handleSelect}
                learned={learnedIds.has(String(item.id))}
              />
            ))}
          </div>
        </section>
      </Container>

      {/* ── KATAKANA SECTION ── */}
      <Container>
        <section id="katakana" className="py-16">
          <h2 className="text-2xl font-bold mb-6">Bảng chữ cái Katakana</h2>

          <div className="grid grid-cols-5 gap-4">
            {katakanaData?.map((item: any) => (
              <KanaGridItem
                key={item.id}
                item={item}
                onSelect={handleSelect}
                learned={learnedIds.has(String(item.id))}
              />
            ))}
          </div>
        </section>
      </Container>

      {/* Single shared Dialog */}
      <Dialog
        open={!!selectedItem}
        onOpenChange={(open) => { if (!open) setSelectedItem(null); }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-purple-400">
              Chữ cái: {selectedItem?.char}
            </DialogTitle>
            <DialogDescription>
              Hãy luyện viết theo nét và nghe phát âm nhé ✍️🔊
            </DialogDescription>
          </DialogHeader>

          {/* HIỂN THỊ CHỮ & CÁC NÚT */}
          <div className="flex flex-col items-center justify-center gap-4 py-4">
            <div className="text-center text-6xl font-bold text-gray-800">
              {selectedItem?.char}
            </div>

            {/* Thông báo đọc đúng */}
            {recordState === "correct" && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-300 text-green-700 rounded-xl px-4 py-2 text-sm font-medium animate-bounce">
                🎉 Chúc mừng bạn đã đọc đúng!
              </div>
            )}

            {/* Thông báo đọc sai */}
            {recordState === "incorrect" && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-300 text-red-600 rounded-xl px-4 py-2 text-sm font-medium">
                😅 Chưa đúng, hãy thử lại nhé!
              </div>
            )}

            <div className="flex gap-3">
              {/* 🔊 NÚT PHÁT ÂM */}
              <Button
                onClick={() => selectedItem && playSound(selectedItem.char)}
                variant="outline"
                className="flex items-center gap-2 border-purple-300 hover:bg-purple-50 text-purple-600 rounded-full px-4 py-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                Nghe phát âm
              </Button>

              {/* 🎤 NÚT THU ÂM */}
              <Button
                onClick={startRecording}
                disabled={recordState === "recording" || recordState === "checking"}
                variant="outline"
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all ${recordColor}`}
              >
                {recordLabel}
              </Button>
            </div>
          </div>

          {/* CANVAS — truyền character để DrawCanvas biết chữ cần vẽ */}
          {selectedItem && <DrawCanvas character={selectedItem.char} />}

          <DialogFooter className="sm:justify-start">
            <DialogClose asChild>
              <Button type="button">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LazyYouTube />
    </>
  );
}