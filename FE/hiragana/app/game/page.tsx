'use client';

import { memo } from 'react';
import Link from 'next/link';
import {
  GamePhase, InputMode, MatchData, GameResult,
  useArena, useGamePage,
} from './useGame';

// ─────────────────────────────────────────────
// Lobby (memoized)
// ─────────────────────────────────────────────
const Lobby = memo(function Lobby({ user, phase, onFind, onCancel }: {
  user: any; phase: GamePhase; onFind: () => void; onCancel: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          Thi Dau Hiragana
        </h1>
        <p className="text-slate-400 text-sm">
          Xin chao, <span className="text-indigo-300 font-semibold">{user?.name}</span>!
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
          ['Thoi gian moi tran', '60 giay'],
          ['So cau hoi', '10 chu cai'],
          ['Che do tra loi', 'Go phim hoac Giong noi'],
          ['He thong ghep cap', 'FIFO - Tu dong'],
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
          Tim Tran
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
            <span className="text-indigo-300 font-semibold">Dang tim doi thu...</span>
          </div>
          <button id="btn-cancel-match" onClick={onCancel}
            className="text-slate-400 hover:text-red-400 text-sm underline underline-offset-4 transition-colors">
            Huy tim tran
          </button>
        </div>
      )}
    </div>
  );
});

// ─────────────────────────────────────────────
// Arena (memoized)
// ─────────────────────────────────────────────
const Arena = memo(function Arena({ matchData, currentUser, onFinish }: {
  matchData: MatchData; currentUser: any; onFinish: (score: number) => void;
}) {
  const isPlayer1 = Number(currentUser?.id) === matchData.player1.id;
  const opponent  = isPlayer1 ? matchData.player2 : matchData.player1;

  const {
    words, currentIndex, currentWord,
    timeLeft, timerPercent, timerColor,
    textInput, setTextInput,
    score, feedback,
    inputMode, setInputMode,
    voiceHint, shownWord,
    inputRef,
    processAnswer, speak,
    isListening, supported, secondsLeft, toggleListening,
    audioUrl, clearAudio,
  } = useArena(matchData, onFinish);

  return (
    <div className="flex flex-col gap-5 w-full max-w-2xl">

      {/* Scoreboard */}
      <div className="flex items-stretch justify-between gap-3">
        <div className="flex-1 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-400 mb-1">Ban</p>
          <p className="font-bold text-white">{currentUser?.name}</p>
          <p className="text-3xl font-black text-indigo-400 tabular-nums">{score}</p>
        </div>
        <div className="flex items-center text-slate-500 text-2xl">vs</div>
        <div className="flex-1 bg-pink-500/10 border border-pink-500/30 rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-400 mb-1">Doi thu</p>
          <p className="font-bold text-white">{opponent.name}</p>
          <p className="text-3xl font-black text-pink-400">?</p>
        </div>
      </div>

      {/* Timer */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Thoi gian con lai</span>
          <span className={timeLeft <= 10 ? 'text-red-400 font-bold animate-pulse' : ''}>{timeLeft}s</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${timerPercent}%`, backgroundColor: timerColor }} />
        </div>
      </div>

      {/* Input mode toggle */}
      <div className="flex gap-2 justify-end">
        {(['text', 'voice'] as InputMode[]).map(mode => (
          <button key={mode} onClick={() => setInputMode(mode)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all
              ${inputMode === mode
                ? 'bg-indigo-500 text-white shadow shadow-indigo-500/30'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'}`}>
            {mode === 'text' ? 'Go phim' : 'Giong noi'}
          </button>
        ))}
      </div>

      {/* Question card */}
      <div className={`relative flex flex-col items-center justify-center gap-3
                       rounded-3xl border p-10 transition-all duration-300 min-h-[200px]
                       ${feedback === 'correct'
                         ? 'bg-green-500/10 border-green-500/50'
                         : feedback === 'wrong'
                           ? 'bg-red-500/10 border-red-500/50'
                           : 'bg-white/5 border-white/10'}`}>

        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-400 uppercase tracking-widest">
            Cau {currentIndex + 1} / {words.length}
          </p>
          <button id="btn-tts" onClick={() => speak(currentWord.char)} title="Nghe phat am"
            className="w-7 h-7 flex items-center justify-center rounded-lg
                       bg-white/5 border border-white/10 hover:bg-indigo-500/20
                       hover:border-indigo-500/40 transition-all duration-200 text-base">
            &#128266;
          </button>
        </div>

        <p className="text-9xl font-black text-white select-none leading-none">
          {currentWord.char}
        </p>

        {inputMode === 'text' && !feedback && (
          <p className="text-slate-500 text-xs">Go phien am romaji roi Enter</p>
        )}
        {inputMode === 'voice' && voiceHint && (
          <p className="text-slate-300 text-lg font-mono">&laquo; {voiceHint} &raquo;</p>
        )}

        {feedback === 'correct' && (
          <div className="flex flex-col items-center gap-1">
            <p className="text-green-400 font-bold text-xl animate-bounce">Dung! +10 diem</p>
            {shownWord && (
              <span className="flex items-center gap-1.5 text-sm px-3 py-1 rounded-full
                               bg-green-500/20 border border-green-500/30 text-green-300">
                &#128266; <span className="font-bold text-lg">{shownWord}</span>
                <span className="text-xs text-green-400/70">({currentWord.romaji})</span>
              </span>
            )}
          </div>
        )}
        {feedback === 'wrong' && (
          <div className="flex flex-col items-center gap-1">
            <p className="text-red-400 font-bold text-xl">
              Sai! Dap an: <span className="font-black">{currentWord.romaji}</span>
            </p>
            {shownWord && (
              <span className="flex items-center gap-1.5 text-sm px-3 py-1 rounded-full
                               bg-red-500/20 border border-red-500/30 text-red-300">
                &#128266; <span className="font-bold text-lg">{shownWord}</span>
                <span className="text-xs text-red-400/70">({currentWord.romaji})</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Input area */}
      {inputMode === 'text' ? (
        <div className="flex gap-3">
          <input ref={inputRef} id="game-answer-input" type="text"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && processAnswer(textInput)}
            placeholder={`Nhap romaji cua "${currentWord.char}" (vd: ${currentWord.romaji.split('')[0]}...)`}
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white
                       placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/60
                       focus:bg-white/8 transition-all" />
          <button id="btn-submit-answer" onClick={() => processAnswer(textInput)}
            className="px-6 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold
                       hover:scale-105 active:scale-95 transition-all duration-200">
            Tra loi
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {!supported ? (
            <p className="text-red-400 text-sm text-center">
              Trinh duyet khong ho tro Web Speech API. Dung Chrome/Edge nhe!
            </p>
          ) : (
            <>
              {/* SVG countdown ring around mic button */}
              <div className="relative flex items-center justify-center">
                {/* Countdown ring (only visible while listening) */}
                {isListening && (
                  <svg className="absolute" width="112" height="112" viewBox="0 0 112 112">
                    <circle cx="56" cy="56" r="50" fill="none" stroke="rgba(239,68,68,0.15)" strokeWidth="5" />
                    <circle
                      cx="56" cy="56" r="50"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 50}`}
                      strokeDashoffset={`${2 * Math.PI * 50 * (1 - secondsLeft / 5)}`}
                      transform="rotate(-90 56 56)"
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                  </svg>
                )}

                <button id="btn-mic"
                  onClick={toggleListening}
                  className={`relative w-24 h-24 rounded-full font-bold text-4xl
                              transition-all duration-200 flex items-center justify-center
                              ${isListening
                                ? 'bg-red-500 shadow-[0_0_30px_10px_rgba(239,68,68,0.4)] scale-110'
                                : 'bg-indigo-500/20 border-2 border-indigo-500/50 hover:bg-indigo-500/30 hover:scale-105'}`}>
                  &#127897;
                  {isListening && (
                    <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-40" />
                  )}
                </button>
              </div>

              <p className="text-slate-400 text-sm text-center">
                {isListening
                  ? <span className="text-red-400 font-semibold">Recording... {secondsLeft}s (click to stop)</span>
                  : 'Click mic to record (5s auto-stop)'}
              </p>

              {/* ── Playback panel ───────────────────────── */}
              {audioUrl && !isListening && (
                <div className="w-full max-w-xs bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">&#127897; Playback</span>
                    <button
                      onClick={clearAudio}
                      title="Dismiss"
                      className="text-slate-500 hover:text-slate-300 text-lg leading-none transition-colors">
                      &times;
                    </button>
                  </div>
                  {voiceHint && (
                    <p className="text-center text-slate-300 font-mono text-base bg-white/5 rounded-xl px-3 py-1">
                      &laquo;&nbsp;{voiceHint}&nbsp;&raquo;
                    </p>
                  )}
                  <audio
                    src={audioUrl}
                    controls
                    autoPlay
                    className="w-full h-8 accent-indigo-400"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      <p className="text-center text-xs text-slate-700">Room: {matchData.roomId}</p>
    </div>
  );
});

// ─────────────────────────────────────────────
// ResultScreen (memoized)
// ─────────────────────────────────────────────
const ResultScreen = memo(function ResultScreen({ result, currentUser, onPlayAgain }: {
  result: GameResult; currentUser: any; onPlayAgain: () => void;
}) {
  const myId     = Number(currentUser?.id);
  const isWinner = result.winnerId === myId;
  const isDraw   = result.winnerId === null;
  const myData   = result.player1.id === myId ? result.player1 : result.player2;
  const oppData  = result.player1.id === myId ? result.player2 : result.player1;

  const bannerConfig = isDraw
    ? { emoji: '&#129309;', label: 'Hoa', color: 'text-yellow-400', glow: 'shadow-yellow-500/30', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10' }
    : isWinner
      ? { emoji: '&#127942;', label: 'Chien thang!', color: 'text-indigo-400', glow: 'shadow-indigo-500/30', border: 'border-indigo-500/30', bg: 'bg-indigo-500/10' }
      : { emoji: '&#128148;', label: 'That bai', color: 'text-red-400', glow: 'shadow-red-500/30', border: 'border-red-500/30', bg: 'bg-red-500/10' };

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div className={`flex flex-col items-center gap-2 px-10 py-6 rounded-3xl border ${bannerConfig.border} ${bannerConfig.bg} shadow-lg ${bannerConfig.glow}`}>
        <span className="text-7xl" dangerouslySetInnerHTML={{ __html: bannerConfig.emoji }} />
        <h2 className={`text-4xl font-black ${bannerConfig.color}`}>{bannerConfig.label}</h2>
        {!isDraw && (
          <p className="text-slate-400 text-sm mt-1">
            {isWinner ? 'Ban da chien thang tran dau nay!' : 'Co len, thu lai lan sau nhe!'}
          </p>
        )}
      </div>

      <div className="flex items-center justify-center gap-6 w-full max-w-sm">
        <div className="flex-1 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-5 text-center">
          <p className="text-xs text-slate-400 mb-1">Ban</p>
          <p className="text-white font-bold text-sm mb-2">{myData.name}</p>
          <p className="text-4xl font-black text-indigo-400 tabular-nums">{myData.score}</p>
          <p className="text-xs text-slate-500 mt-1">diem</p>
        </div>
        <div className="text-2xl text-slate-500 font-bold">VS</div>
        <div className="flex-1 bg-pink-500/10 border border-pink-500/30 rounded-2xl p-5 text-center">
          <p className="text-xs text-slate-400 mb-1">Doi thu</p>
          <p className="text-white font-bold text-sm mb-2">{oppData.name}</p>
          <p className="text-4xl font-black text-pink-400 tabular-nums">{oppData.score}</p>
          <p className="text-xs text-slate-500 mt-1">diem</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 w-full max-w-sm space-y-2 text-sm text-slate-300">
        <div className="flex justify-between">
          <span>So cau dung cua ban</span>
          <span className="text-white font-bold">{myData.score / 10} / 10</span>
        </div>
        <div className="flex justify-between">
          <span>Do chinh xac</span>
          <span className="text-white font-bold">{myData.score}%</span>
        </div>
      </div>

      <button id="btn-play-again" onClick={onPlayAgain}
        className="px-10 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
                   text-white font-bold text-lg hover:scale-105 active:scale-95 transition-all
                   shadow-lg shadow-purple-500/30">
        Choi lai
      </button>
    </div>
  );
});

// ─────────────────────────────────────────────
// GamePage  (entry point)
// ─────────────────────────────────────────────
export default function GamePage() {
  const {
    user, isConnected,
    phase, matchData, gameResult, statusMessage, countdownNum,
    handleFindMatch, handleCancel, handleArenaFinish, handlePlayAgain,
  } = useGamePage();

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6">

      {/* Home button – top left */}
      <Link
        href="/"
        id="btn-home"
        className="fixed top-4 left-4 flex items-center gap-2 text-xs px-3 py-1.5
                   rounded-full bg-white/5 border border-white/10
                   text-slate-400 hover:text-white hover:bg-white/10
                   hover:border-white/20 transition-all duration-200 group">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Trang chủ
      </Link>

      {/* Connection pill – top right */}
      <div className="fixed top-4 right-4 flex items-center gap-2 text-xs px-3 py-1.5
                      rounded-full bg-white/5 border border-white/10">
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
        <span className="text-slate-400">{isConnected ? 'Da ket noi' : 'Mat ket noi'}</span>
      </div>

      <div className="w-full max-w-2xl">

        {!user && (
          <div className="text-center text-slate-400">
            <p>Vui long <a href="/login" className="text-indigo-400 underline">dang nhap</a> de tham gia thi dau.</p>
          </div>
        )}

        {user && (phase === 'IDLE' || phase === 'SEARCHING') && (
          <Lobby user={user} phase={phase} onFind={handleFindMatch} onCancel={handleCancel} />
        )}

        {phase === 'COUNTDOWN' && matchData && (
          <div className="flex flex-col items-center gap-6 text-center">
            <p className="text-slate-400 text-sm tracking-widest uppercase">Da tim thay doi thu!</p>
            <h2 className="text-2xl font-bold text-white">
              {matchData.player1.name}
              <span className="text-slate-500 mx-3">VS</span>
              {matchData.player2.name}
            </h2>
            <div className="text-8xl font-black text-indigo-400 tabular-nums"
              style={{ textShadow: '0 0 40px rgba(99,102,241,0.6)' }}>
              {countdownNum}
            </div>
            <p className="text-slate-400">Tran dau sap bat dau...</p>
          </div>
        )}

        {phase === 'IN_GAME' && matchData && (
          <Arena matchData={matchData} currentUser={user} onFinish={handleArenaFinish} />
        )}

        {phase === 'WAITING_RESULT' && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="text-5xl">&#9203;</div>
            <h2 className="text-2xl font-bold text-white">Cho ket qua...</h2>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <span key={i}
                  className="w-3 h-3 rounded-full bg-indigo-400 animate-bounce"
                  style={{ animationDelay: `${i * 200}ms` }} />
              ))}
            </div>
            <p className="text-slate-400 text-sm">Doi doi thu hoan thanh tran dau...</p>
          </div>
        )}

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
