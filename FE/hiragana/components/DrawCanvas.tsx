'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';

type Phase = 'guide' | 'free' | 'result';

interface StrokePath {
  d: string;
}

interface DrawCanvasProps {
  character?: string;
}

const CANVAS_SIZE = 280;

export default function DrawCanvas({ character }: DrawCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [phase, setPhase] = useState<Phase>('guide');
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  const [strokePaths, setStrokePaths] = useState<StrokePath[]>([]);
  const [animKey, setAnimKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [svgError, setSvgError] = useState(false);

  // ── Vẽ chữ mờ lên canvas làm nền guide ──
  const drawGhost = useCallback(
    (ctx: CanvasRenderingContext2D, opacity = 0.10) => {
      if (!character) return;
      ctx.save();
      ctx.font = `${CANVAS_SIZE * 0.75}px 'Noto Sans JP', serif`;
      ctx.fillStyle = `rgba(139, 92, 246, ${opacity})`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(character, CANVAS_SIZE / 2, CANVAS_SIZE / 2);
      ctx.restore();
    },
    [character]
  );

  // ── Fetch KanjiVG stroke paths ──
  useEffect(() => {
    if (!character) return;

    // Reset về guide phase
    setPhase('guide');
    setResult(null);
    setStrokePaths([]);
    setSvgError(false);
    setAnimKey((k) => k + 1);

    // Vẽ ghost ngay lập tức
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      drawGhost(ctx);
    }

    // Lấy SVG từ KanjiVG (unicode codepoint dạng 5 hex digits)
    const cp = character.codePointAt(0)!.toString(16).padStart(5, '0');
    setLoading(true);

    fetch(
      `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${cp}.svg`
    )
      .then((r) => {
        if (!r.ok) throw new Error('not found');
        return r.text();
      })
      .then((text) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'image/svg+xml');
        const paths: StrokePath[] = Array.from(
          doc.querySelectorAll('path[d]')
        ).map((p) => ({ d: p.getAttribute('d')! }));
        setStrokePaths(paths);
        setLoading(false);
      })
      .catch(() => {
        // Fallback: chỉ dùng ghost text, không animate nét
        setSvgError(true);
        setLoading(false);
      });
  }, [character, drawGhost]);

  // Khi quay về guide phase: vẽ lại ghost + reset animation
  useEffect(() => {
    if (phase !== 'guide') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    drawGhost(ctx);
    setAnimKey((k) => k + 1);
  }, [phase, drawGhost]);

  // ── Vẽ tay ──
  const getPos = (e: any) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
  };

  const startDraw = (e: any) => {
    setDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: any) => {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => setDrawing(false);

  // ── Xoá canvas (giữ ghost ở cả Phase 1 lẫn Phase 2) ──
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    if (phase === 'guide') drawGhost(ctx, 0.10);
    if (phase === 'free')  drawGhost(ctx, 0.06); // mờ nhẹ hơn ở Phase 2
  };

  // ── Sang Phase 2: clear + vẽ lại ghost mờ hơn ──
  const goFree = () => {
    setPhase('free');
    setResult(null);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    // Vẽ ghost nhẹ hơn ở Phase 2 (opacity thấp hơn để không dẫn dắt quá)
    drawGhost(ctx, 0.06);
  };

  // ── Kiểm tra hình dạng bằng Normalized Shape Comparison (IoU) ──
  const checkWriting = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !character) return;

    const userCtx = canvas.getContext('2d')!;
    const userPixels = userCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;

    // Render chữ mẫu vào offscreen canvas
    const off = document.createElement('canvas');
    off.width = CANVAS_SIZE;
    off.height = CANVAS_SIZE;
    const offCtx = off.getContext('2d')!;
    offCtx.fillStyle = 'white';
    offCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    offCtx.font = `${CANVAS_SIZE * 0.75}px 'Noto Sans JP', serif`;
    offCtx.fillStyle = 'black';
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillText(character, CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    const refPixels = offCtx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;

    // ── Helper: tìm bounding box của các pixel tối ──
    const getBBox = (pixels: Uint8ClampedArray, isRef: boolean) => {
      let minX = CANVAS_SIZE, maxX = 0, minY = CANVAS_SIZE, maxY = 0;
      let count = 0;
      for (let y = 0; y < CANVAS_SIZE; y++) {
        for (let x = 0; x < CANVAS_SIZE; x++) {
          const i = (y * CANVAS_SIZE + x) * 4;
          const dark = isRef
            ? (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3 < 128
            : pixels[i + 3] > 30 && (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3 < 150;
          if (dark) {
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
            count++;
          }
        }
      }
      return { minX, maxX, minY, maxY, count };
    };

    // ── Helper: scale vùng bounding box xuống lưới NORM×NORM ──
    const NORM = 32;
    const toGrid = (pixels: Uint8ClampedArray, bbox: ReturnType<typeof getBBox>, isRef: boolean) => {
      const { minX, maxX, minY, maxY } = bbox;
      const w = Math.max(maxX - minX + 1, 1);
      const h = Math.max(maxY - minY + 1, 1);
      const grid = new Uint8Array(NORM * NORM);

      for (let ny = 0; ny < NORM; ny++) {
        for (let nx = 0; nx < NORM; nx++) {
          const x0 = Math.floor(minX + (nx / NORM) * w);
          const x1 = Math.max(x0 + 1, Math.floor(minX + ((nx + 1) / NORM) * w));
          const y0 = Math.floor(minY + (ny / NORM) * h);
          const y1 = Math.max(y0 + 1, Math.floor(minY + ((ny + 1) / NORM) * h));

          let dark = 0, total = 0;
          for (let py = y0; py < y1 && py < CANVAS_SIZE; py++) {
            for (let px = x0; px < x1 && px < CANVAS_SIZE; px++) {
              const i = (py * CANVAS_SIZE + px) * 4;
              const isDark = isRef
                ? (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3 < 128
                : pixels[i + 3] > 30 && (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3 < 150;
              if (isDark) dark++;
              total++;
            }
          }
          // Ô lưới được coi là "có nét" nếu >30% pixel của ô đó là tối
          grid[ny * NORM + nx] = total > 0 && dark / total > 0.3 ? 1 : 0;
        }
      }
      return grid;
    };

    const refBBox = getBBox(refPixels, true);
    const userBBox = getBBox(userPixels, false);

    // Chưa vẽ đủ
    if (userBBox.count < 100 || userBBox.maxX - userBBox.minX < 15 || userBBox.maxY - userBBox.minY < 15) {
      setResult('incorrect');
      setPhase('result');
      return;
    }

    const refGrid = toGrid(refPixels, refBBox, true);
    const userGrid = toGrid(userPixels, userBBox, false);

    // ── Tính IoU (Intersection over Union) trên lưới 32×32 ──
    // IoU đo mức độ giống hình dạng: không bị ảnh hưởng bởi kích thước to/nhỏ
    let intersection = 0, union = 0;
    for (let i = 0; i < NORM * NORM; i++) {
      if (refGrid[i] === 1 || userGrid[i] === 1) union++;
      if (refGrid[i] === 1 && userGrid[i] === 1) intersection++;
    }

    const iou = union > 0 ? intersection / union : 0;
    // Ngưỡng 30% IoU: viết na ná hình dạng là pass
    setResult(iou >= 0.30 ? 'correct' : 'incorrect');
    setPhase('result');
  }, [character]);

  // ── Reset về Phase 1 ──
  const reset = () => {
    setPhase('guide');
    setResult(null);
  };

  // Thời gian animate mỗi nét (ms)
  const strokeMs = 520;

  // Màu viền canvas theo trạng thái
  const borderColor =
    phase === 'guide'
      ? '#c4b5fd'
      : phase === 'result' && result === 'correct'
      ? '#4ade80'
      : phase === 'result'
      ? '#f87171'
      : '#93c5fd';

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* CSS keyframe cho animation nét bút */}
      <style>{`
        @keyframes kanjivg-draw {
          from { stroke-dashoffset: 1000; opacity: 0; }
          5%   { opacity: 1; }
          to   { stroke-dashoffset: 0; opacity: 1; }
        }
      `}</style>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[
          { step: 1, label: 'Vẽ theo', active: phase === 'guide' },
          { step: 2, label: 'Tự viết', active: phase !== 'guide' },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && <div className="w-6 h-px bg-gray-300" />}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                s.active
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                  s.active ? 'bg-purple-600 text-white' : 'bg-gray-300 text-white'
                }`}
              >
                {s.step}
              </span>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Mô tả giai đoạn */}
      <p
        className={`text-xs font-medium text-center transition-all ${
          phase === 'result' && result === 'correct'
            ? 'text-green-600'
            : phase === 'result'
            ? 'text-red-500'
            : 'text-gray-500'
        }`}
      >
        {phase === 'guide' && '✏️ Vẽ theo nét mờ bên dưới để làm quen'}
        {phase === 'free' && '🖊️ Hãy tự viết từ trí nhớ của bạn!'}
        {phase === 'result' && result === 'correct' && '🎉 Yeah, bạn viết đúng rồi!'}
        {phase === 'result' && result === 'incorrect' && '😅 Chưa đúng lắm, hãy thử lại nhé!'}
      </p>

      {/* Canvas + SVG overlay */}
      <div
        className="relative rounded-xl overflow-hidden border-2 transition-colors duration-300"
        style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, borderColor }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="bg-white touch-none cursor-crosshair block"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />

        {/* KanjiVG animated stroke overlay (Phase 1 only) */}
        {phase === 'guide' && !svgError && strokePaths.length > 0 && (
          <svg
            key={animKey}
            viewBox="0 0 109 109"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: CANVAS_SIZE,
              height: CANVAS_SIZE,
              pointerEvents: 'none',
            }}
          >
            {strokePaths.map((stroke, i) => (
              <path
                key={i}
                d={stroke.d}
                fill="none"
                stroke="rgba(139, 92, 246, 0.8)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="1000"
                strokeDasharray="1000"
                style={{
                  strokeDashoffset: 1000,
                  animation: `kanjivg-draw ${strokeMs}ms ease forwards`,
                  animationDelay: `${i * strokeMs}ms`,
                }}
              />
            ))}
          </svg>
        )}

        {/* Loading spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-xl">
            <div className="flex flex-col items-center gap-1">
              <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-400">Đang tải nét bút...</span>
            </div>
          </div>
        )}

        {/* Result badge overlay */}
        {phase === 'result' && (
          <div
            className={`absolute inset-0 flex items-center justify-center rounded-xl pointer-events-none ${
              result === 'correct' ? 'bg-green-500/10' : 'bg-red-500/10'
            }`}
          >
            <span className="text-6xl drop-shadow-sm">
              {result === 'correct' ? '✅' : '❌'}
            </span>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        {phase === 'guide' && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="text-xs text-gray-500"
            >
              🗑 Xoá
            </Button>
            <Button
              size="sm"
              onClick={goFree}
              className="text-xs bg-purple-600 hover:bg-purple-700 text-white"
            >
              Tiếp theo →
            </Button>
          </>
        )}

        {phase === 'free' && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="text-xs text-gray-500"
            >
              🗑 Xoá
            </Button>
            <Button
              size="sm"
              onClick={checkWriting}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              Kiểm tra ✓
            </Button>
          </>
        )}

        {phase === 'result' && (
          <Button
            variant="outline"
            size="sm"
            onClick={reset}
            className="text-xs border-purple-300 text-purple-600 hover:bg-purple-50"
          >
            ↩ Thử lại từ đầu
          </Button>
        )}
      </div>
    </div>
  );
}