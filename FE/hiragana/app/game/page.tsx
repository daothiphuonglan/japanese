'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from '@/context/SocketContext';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type GamePhase = 'IDLE' | 'SEARCHING' | 'COUNTDOWN' | 'IN_GAME' | 'WAITING_RESULT' | 'FINISHED';
type InputMode = 'text' | 'voice';

interface PlayerInfo { id: number; name: string; }
interface KanaWord  { char: string; romaji: string; }

interface MatchData {
  roomId: string;
  player1: PlayerInfo;
  player2: PlayerInfo;
  gameData: { duration: number; wordsList: KanaWord[]; };
}

interface GameResult {
  roomId: string;
  player1: { id: number; name: string; score: number };
  player2: { id: number; name: string; score: number };
  winnerId: number | null; // null = hoà
}

// ─────────────────────────────────────────────
// Lobby
// ─────────────────────────────────────────────
function Lobby({ user, phase, onFind, onCancel }: {
  user: any; phase: GamePhase; onFind: () => void; onCancel: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          ⚔️ Thi Đấu Hiragana
        </h1>
        <p className="text-slate-400 text-sm">
          Xin chào, <span className="text-indigo-300 font-semibold">{user?.name}</span>! Thách thức người chơi toàn cầu.
        </p>
      </div>

      <div className="flex gap-3 text-3xl select-none">
        {['あ', 'い', 'う', 'え', 'お'].map((kana, i) => (
          <span key={i}
            className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 shadow-lg hover:scale-110 transition-transform duration-300">
            {kana}
          </span>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-3 text-sm text-slate-300">
        {[
          ['⏱ Thời gian mỗi trận', '60 giây'],
          ['📝 Số câu hỏi', '10 chữ cái'],
          ['🎙 Chế độ trả lời', 'Gõ phím hoặc Giọng nói'],
          ['🎯 Hệ thống ghép cặp', 'FIFO – Tự động'],
        ].map(([label, val]) => (
          <div key={label} className="flex justify-between">
            <span>{label}</span>
            <span className="text-white font-semibold">{val}</span>
          </div>
        ))}
      </div>

      {phase === 'IDLE' ? (
        <button id="btn-find-match" onClick={onFind}
          className="px-10 py-4 rounded-2xl font-bold text-lg text-white
                     bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
                     hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400
                     shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50
                     hover:scale-105 active:scale-95 transition-all duration-300">
          🔍 Tìm Trận
        </button>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-indigo-500/10 border border-indigo-400/30">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <span key={i}
                  className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-bounce"
                  style={{ animationDelay: `${i * 200}ms` }} />
              ))}
            </div>
            <span className="text-indigo-300 font-semibold">Đang tìm đối thủ...</span>
          </div>
          <button id="btn-cancel-match" onClick={onCancel}
            className="text-slate-400 hover:text-red-400 text-sm underline underline-offset-4 transition-colors">
            Huỷ tìm trận
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Voice Hook  (Web Speech API)
// ─────────────────────────────────────────────
function useVoiceRecognition(onResult: (text: string) => void) {
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript]   = useState('');
  const [supported, setSupported]     = useState(true);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setSupported(false); return; }

    const rec = new SpeechRecognition();
    rec.lang = 'ja-JP';           // Nhận dạng tiếng Nhật → trả về hiragana
    rec.continuous      = false;
    rec.interimResults  = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript.trim();
      setTranscript(text);
      onResult(text);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);

    recognitionRef.current = rec;
  }, [onResult]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    setTranscript('');
    setIsListening(true);
    recognitionRef.current.start();
  }, [isListening]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, transcript, supported, startListening, stopListening };
}

// ─────────────────────────────────────────────
// Arena
// ─────────────────────────────────────────────
function Arena({ matchData, currentUser, onFinish }: {
  matchData: MatchData; currentUser: any; onFinish: (score: number) => void;
}) {
  const words     = matchData.gameData.wordsList;
  const isPlayer1 = Number(currentUser?.id) === matchData.player1.id;
  const opponent  = isPlayer1 ? matchData.player2 : matchData.player1;

  const [timeLeft,      setTimeLeft]      = useState(matchData.gameData.duration);
  const [currentIndex,  setCurrentIndex]  = useState(0);
  const [textInput,     setTextInput]     = useState('');
  const [score,         setScore]         = useState(0);
  const [feedback,      setFeedback]      = useState<'correct' | 'wrong' | null>(null);
  const [inputMode,     setInputMode]     = useState<InputMode>('text');
  const [voiceHint,     setVoiceHint]     = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const finishedRef = useRef(false);

  // Dừng game không bị gọi 2 lần
  const triggerFinish = useCallback((finalScore: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish(finalScore);
  }, [onFinish]);

  // ── Countdown ──────────────────────────────
  useEffect(() => {
    if (timeLeft <= 0) { triggerFinish(score); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, score, triggerFinish]);

  // ── Focus text input ────────────────────────
  useEffect(() => {
    if (inputMode === 'text') inputRef.current?.focus();
  }, [currentIndex, inputMode]);

  // ── Xử lý đáp án ───────────────────────────
  const processAnswer = useCallback((answer: string) => {
    if (feedback) return; // chờ animation xong
    const word = words[currentIndex];
    // So sánh với romaji (text mode) HOẶC với char hiragana (voice mode)
    const isCorrect =
      answer.trim().toLowerCase() === word.romaji.toLowerCase() ||
      answer.trim() === word.char;

    const newScore = isCorrect ? score + 10 : score;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setScore(newScore);

    setTimeout(() => {
      setFeedback(null);
      setTextInput('');
      setVoiceHint('');
      if (currentIndex + 1 < words.length) {
        setCurrentIndex(i => i + 1);
      } else {
        triggerFinish(newScore);
      }
    }, 700);
  }, [feedback, words, currentIndex, score, triggerFinish]);

  // ── Voice recognition ───────────────────────
  const handleVoiceResult = useCallback((text: string) => {
    setVoiceHint(text);
    processAnswer(text);
  }, [processAnswer]);

  const { isListening, supported, startListening, stopListening } =
    useVoiceRecognition(handleVoiceResult);

  const timerPercent = (timeLeft / matchData.gameData.duration) * 100;
  const timerColor   = timeLeft > 20 ? '#6366f1' : timeLeft > 10 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col gap-5 w-full max-w-2xl">

      {/* Scoreboard ───────────────────────────────── */}
      <div className="flex items-stretch justify-between gap-3">
        <div className="flex-1 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-400 mb-1">Bạn</p>
          <p className="font-bold text-white">{currentUser?.name}</p>
          <p className="text-3xl font-black text-indigo-400 tabular-nums">{score}</p>
        </div>
        <div className="flex items-center text-slate-500 text-2xl">⚔️</div>
        <div className="flex-1 bg-pink-500/10 border border-pink-500/30 rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-400 mb-1">Đối thủ</p>
          <p className="font-bold text-white">{opponent.name}</p>
          <p className="text-3xl font-black text-pink-400">?</p>
        </div>
      </div>

      {/* Timer ─────────────────────────────────────── */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Thời gian còn lại</span>
          <span className={timeLeft <= 10 ? 'text-red-400 font-bold animate-pulse' : ''}>{timeLeft}s</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${timerPercent}%`, backgroundColor: timerColor }} />
        </div>
      </div>

      {/* Input mode toggle ─────────────────────────── */}
      <div className="flex gap-2 justify-end">
        {(['text', 'voice'] as InputMode[]).map(mode => (
          <button key={mode} onClick={() => setInputMode(mode)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all
              ${inputMode === mode
                ? 'bg-indigo-500 text-white shadow shadow-indigo-500/30'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'}`}>
            {mode === 'text' ? '⌨️ Gõ phím' : '🎙 Giọng nói'}
          </button>
        ))}
      </div>

      {/* Question card ─────────────────────────────── */}
      <div className={`relative flex flex-col items-center justify-center gap-3
                       rounded-3xl border p-10 transition-all duration-300 min-h-[200px]
                       ${feedback === 'correct'
                         ? 'bg-green-500/10 border-green-500/50'
                         : feedback === 'wrong'
                           ? 'bg-red-500/10 border-red-500/50'
                           : 'bg-white/5 border-white/10'}`}>
        <p className="text-xs text-slate-400 uppercase tracking-widest">
          Câu {currentIndex + 1} / {words.length}
        </p>

        {/* Ký tự Hiragana to */}
        <p className="text-9xl font-black text-white select-none leading-none">
          {words[currentIndex].char}
        </p>

        {/* Gợi ý nhỏ dưới ký tự (chế độ text) */}
        {inputMode === 'text' && !feedback && (
          <p className="text-slate-500 text-xs">Gõ phiên âm romaji rồi Enter</p>
        )}

        {/* Voice hint: hiện transcript đang nhận dạng */}
        {inputMode === 'voice' && voiceHint && (
          <p className="text-slate-300 text-lg font-mono">« {voiceHint} »</p>
        )}

        {feedback === 'correct' && (
          <p className="text-green-400 font-bold text-xl animate-bounce">✓ Đúng! +10 điểm</p>
        )}
        {feedback === 'wrong' && (
          <p className="text-red-400 font-bold text-xl">
            ✗ Sai! Đáp án: <span className="font-black">{words[currentIndex].romaji}</span>
          </p>
        )}
      </div>

      {/* Input area ────────────────────────────────── */}
      {inputMode === 'text' ? (
        <div className="flex gap-3">
          <input ref={inputRef} id="game-answer-input" type="text"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && processAnswer(textInput)}
            placeholder={`Nhập romaji của "${words[currentIndex].char}" (vd: ${words[currentIndex].romaji.split('')[0]}...)`}
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white
                       placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/60
                       focus:bg-white/8 transition-all" />
          <button id="btn-submit-answer" onClick={() => processAnswer(textInput)}
            className="px-6 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold
                       hover:scale-105 active:scale-95 transition-all duration-200">
            Trả lời
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {!supported ? (
            <p className="text-red-400 text-sm text-center">
              Trình duyệt không hỗ trợ Web Speech API. Dùng Chrome/Edge nhé!
            </p>
          ) : (
            <>
              {/* Mic button */}
              <button id="btn-mic"
                onMouseDown={startListening}
                onMouseUp={stopListening}
                onTouchStart={startListening}
                onTouchEnd={stopListening}
                className={`relative w-24 h-24 rounded-full font-bold text-4xl
                            transition-all duration-200 flex items-center justify-center
                            ${isListening
                              ? 'bg-red-500 shadow-[0_0_30px_10px_rgba(239,68,68,0.4)] scale-110'
                              : 'bg-indigo-500/20 border-2 border-indigo-500/50 hover:bg-indigo-500/30 hover:scale-105'}`}>
                🎙
                {isListening && (
                  <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-60" />
                )}
              </button>
              <p className="text-slate-400 text-sm">
                {isListening
                  ? 'Đang nghe... hãy đọc ký tự'
                  : 'Nhấn & giữ để nói'}
              </p>
            </>
          )}
        </div>
      )}

      <p className="text-center text-xs text-slate-700">Room: {matchData.roomId}</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Result Screen  (Thắng / Thua / Hoà)
// ─────────────────────────────────────────────
function ResultScreen({ result, currentUser, onPlayAgain }: {
  result: GameResult; currentUser: any; onPlayAgain: () => void;
}) {
  const myId      = Number(currentUser?.id);
  const isWinner  = result.winnerId === myId;
  const isDraw    = result.winnerId === null;
  const myData    = result.player1.id === myId ? result.player1 : result.player2;
  const oppData   = result.player1.id === myId ? result.player2 : result.player1;

  const bannerConfig = isDraw
    ? { emoji: '🤝', label: 'Hoà', color: 'text-yellow-400', glow: 'shadow-yellow-500/30', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10' }
    : isWinner
      ? { emoji: '🏆', label: 'Chiến thắng!', color: 'text-indigo-400', glow: 'shadow-indigo-500/30', border: 'border-indigo-500/30', bg: 'bg-indigo-500/10' }
      : { emoji: '💔', label: 'Thất bại', color: 'text-red-400', glow: 'shadow-red-500/30', border: 'border-red-500/30', bg: 'bg-red-500/10' };

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      {/* Banner */}
      <div className={`flex flex-col items-center gap-2 px-10 py-6 rounded-3xl border ${bannerConfig.border} ${bannerConfig.bg} shadow-lg ${bannerConfig.glow}`}>
        <span className="text-7xl">{bannerConfig.emoji}</span>
        <h2 className={`text-4xl font-black ${bannerConfig.color}`}>{bannerConfig.label}</h2>
        {!isDraw && (
          <p className="text-slate-400 text-sm mt-1">
            {isWinner ? '🎉 Bạn đã chiến thắng trận đấu này!' : '😢 Cố lên, thử lại lần sau nhé!'}
          </p>
        )}
      </div>

      {/* Score comparison */}
      <div className="flex items-center justify-center gap-6 w-full max-w-sm">
        <div className="flex-1 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-5 text-center">
          <p className="text-xs text-slate-400 mb-1">Bạn</p>
          <p className="text-white font-bold text-sm mb-2">{myData.name}</p>
          <p className="text-4xl font-black text-indigo-400 tabular-nums">{myData.score}</p>
          <p className="text-xs text-slate-500 mt-1">điểm</p>
        </div>

        <div className="text-2xl text-slate-500 font-bold">VS</div>

        <div className="flex-1 bg-pink-500/10 border border-pink-500/30 rounded-2xl p-5 text-center">
          <p className="text-xs text-slate-400 mb-1">Đối thủ</p>
          <p className="text-white font-bold text-sm mb-2">{oppData.name}</p>
          <p className="text-4xl font-black text-pink-400 tabular-nums">{oppData.score}</p>
          <p className="text-xs text-slate-500 mt-1">điểm</p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 w-full max-w-sm space-y-2 text-sm text-slate-300">
        <div className="flex justify-between">
          <span>Số câu đúng của bạn</span>
          <span className="text-white font-bold">{myData.score / 10} / 10</span>
        </div>
        <div className="flex justify-between">
          <span>Độ chính xác</span>
          <span className="text-white font-bold">{myData.score}%</span>
        </div>
      </div>

      <button id="btn-play-again" onClick={onPlayAgain}
        className="px-10 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
                   text-white font-bold text-lg hover:scale-105 active:scale-95 transition-all
                   shadow-lg shadow-purple-500/30">
        🔄 Chơi lại
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main: Game Page
// ─────────────────────────────────────────────
export default function GamePage() {
  const { socket, isConnected, user } = useSocket();
  const [phase,         setPhase]         = useState<GamePhase>('IDLE');
  const [matchData,     setMatchData]      = useState<MatchData | null>(null);
  const [gameResult,    setGameResult]     = useState<GameResult | null>(null);
  const [statusMessage, setStatusMessage]  = useState('');

  // ─ Socket listeners ──────────────────────────
  useEffect(() => {
    if (!socket) return;

    socket.on('queue_joined', () => setStatusMessage('Đang tìm đối thủ...'));
    socket.on('queue_error',  (d: { message: string }) => setStatusMessage(d.message));
    socket.on('queue_left',   () => { setPhase('IDLE'); setStatusMessage(''); });

    socket.on('match_found', (data: MatchData) => {
      setMatchData(data);
      setPhase('COUNTDOWN');
      setTimeout(() => setPhase('IN_GAME'), 3000);
    });

    // Nhận kết quả từ BE sau khi cả 2 submit
    socket.on('game_result', (data: GameResult) => {
      setGameResult(data);
      setPhase('FINISHED');
    });

    return () => {
      socket.off('queue_joined');
      socket.off('queue_error');
      socket.off('queue_left');
      socket.off('match_found');
      socket.off('game_result');
    };
  }, [socket]);

  // ─ Handlers ──────────────────────────────────
  const handleFindMatch = () => {
    if (!socket || !user) return;
    setPhase('SEARCHING');
    socket.emit('join_queue', { userId: Number(user.id), name: user.name });
  };

  const handleCancel = () => {
    if (!socket) return;
    socket.emit('leave_queue');
    setPhase('IDLE');
  };

  // Khi Arena kết thúc: gửi điểm lên BE, chờ game_result
  const handleArenaFinish = useCallback((finalScore: number) => {
    setPhase('WAITING_RESULT');
    if (socket && matchData && user) {
      socket.emit('submit_score', {
        roomId: matchData.roomId,
        userId: Number(user.id),
        score:  finalScore,
      });
    }
  }, [socket, matchData, user]);

  const handlePlayAgain = () => {
    setMatchData(null);
    setGameResult(null);
    setPhase('IDLE');
    setStatusMessage('');
  };

  // ─ Countdown (live 3s) ────────────────────────
  const [countdownNum, setCountdownNum] = useState(3);
  useEffect(() => {
    if (phase !== 'COUNTDOWN') { setCountdownNum(3); return; }
    const interval = setInterval(() =>
      setCountdownNum(n => (n > 1 ? n - 1 : n)), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6">
      {/* Connection pill */}
      <div className="fixed top-4 right-4 flex items-center gap-2 text-xs px-3 py-1.5
                      rounded-full bg-white/5 border border-white/10">
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
        <span className="text-slate-400">{isConnected ? 'Đã kết nối' : 'Mất kết nối'}</span>
      </div>

      <div className="w-full max-w-2xl">

        {/* Not logged in */}
        {!user && (
          <div className="text-center text-slate-400">
            <p>Vui lòng <a href="/login" className="text-indigo-400 underline">đăng nhập</a> để tham gia thi đấu.</p>
          </div>
        )}

        {/* Lobby */}
        {user && (phase === 'IDLE' || phase === 'SEARCHING') && (
          <Lobby user={user} phase={phase} onFind={handleFindMatch} onCancel={handleCancel} />
        )}

        {/* Countdown */}
        {phase === 'COUNTDOWN' && matchData && (
          <div className="flex flex-col items-center gap-6 text-center">
            <p className="text-slate-400 text-sm tracking-widest uppercase">Đã tìm thấy đối thủ!</p>
            <h2 className="text-2xl font-bold text-white">
              {matchData.player1.name}
              <span className="text-slate-500 mx-3">VS</span>
              {matchData.player2.name}
            </h2>
            <div className="text-8xl font-black text-indigo-400 tabular-nums"
              style={{ textShadow: '0 0 40px rgba(99,102,241,0.6)' }}>
              {countdownNum}
            </div>
            <p className="text-slate-400">Trận đấu sắp bắt đầu...</p>
          </div>
        )}

        {/* Game Arena */}
        {phase === 'IN_GAME' && matchData && (
          <Arena matchData={matchData} currentUser={user} onFinish={handleArenaFinish} />
        )}

        {/* Waiting for opponent to finish */}
        {phase === 'WAITING_RESULT' && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="text-5xl">⏳</div>
            <h2 className="text-2xl font-bold text-white">Chờ kết quả...</h2>
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <span key={i}
                  className="w-3 h-3 rounded-full bg-indigo-400 animate-bounce"
                  style={{ animationDelay: `${i * 200}ms` }} />
              ))}
            </div>
            <p className="text-slate-400 text-sm">Đợi đối thủ hoàn thành trận đấu...</p>
          </div>
        )}

        {/* Result */}
        {phase === 'FINISHED' && gameResult && (
          <ResultScreen result={gameResult} currentUser={user} onPlayAgain={handlePlayAgain} />
        )}

        {statusMessage && (
          <p className="text-center text-xs text-slate-500 mt-4">{statusMessage}</p>
        )}
      </div>
    </div>
  );
}
