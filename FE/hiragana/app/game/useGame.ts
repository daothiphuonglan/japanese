'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from '@/context/SocketContext';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type GamePhase = 'IDLE' | 'SEARCHING' | 'COUNTDOWN' | 'IN_GAME' | 'WAITING_RESULT' | 'FINISHED';
export type InputMode = 'text' | 'voice';

export interface PlayerInfo { id: number; name: string; }
export interface KanaWord   { char: string; romaji: string; }

export interface MatchData {
  roomId: string;
  player1: PlayerInfo;
  player2: PlayerInfo;
  gameData: { duration: number; wordsList: KanaWord[]; };
}

export interface GameResult {
  roomId: string;
  player1: { id: number; name: string; score: number };
  player2: { id: number; name: string; score: number };
  winnerId: number | null; // null = hoa
}

// ─────────────────────────────────────────────
// useVoiceRecognition  (Web Speech API)
// ─────────────────────────────────────────────
export function useVoiceRecognition(onResult: (text: string) => void) {
  const recognitionRef  = useRef<any>(null);
  const isStartedRef    = useRef(false);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isListening,    setIsListening]    = useState(false);
  const [transcript,     setTranscript]     = useState('');
  const [supported,      setSupported]      = useState(true);
  const [secondsLeft,    setSecondsLeft]    = useState(0);  // countdown display
  const countdownRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  const AUTO_STOP_MS = 5000; // 5 seconds

  // ── Clear timers helper ────────────────────
  const clearTimers = useCallback(() => {
    if (autoStopTimerRef.current) { clearTimeout(autoStopTimerRef.current);  autoStopTimerRef.current = null; }
    if (countdownRef.current)     { clearInterval(countdownRef.current);     countdownRef.current     = null; }
    setSecondsLeft(0);
  }, []);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setSupported(false); return; }

    const rec = new SpeechRecognition();
    rec.lang            = 'ja-JP';
    rec.continuous      = true;   // keep listening until we stop it
    rec.interimResults  = true;   // get partial results → faster reaction
    rec.maxAlternatives = 5;      // more candidates → pick best match

    rec.onstart = () => { setIsListening(true); };

    rec.onresult = (e: any) => {
      // Collect the best final (non-interim) transcript from all results
      let finalText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          // Pick the alternative with the highest confidence
          let best = e.results[i][0];
          for (let j = 1; j < e.results[i].length; j++) {
            if (e.results[i][j].confidence > best.confidence) best = e.results[i][j];
          }
          finalText += best.transcript;
        }
      }
      if (finalText.trim()) {
        setTranscript(finalText.trim());
        onResult(finalText.trim());
      }
    };

    rec.onend = () => {
      setIsListening(false);
      isStartedRef.current = false;
      clearTimers();
    };

    rec.onerror = (e: any) => {
      // 'no-speech' is expected when quiet; don't treat it as fatal
      if (e.error !== 'no-speech') console.error('SpeechRecognition error:', e.error);
      setIsListening(false);
      isStartedRef.current = false;
      clearTimers();
    };

    recognitionRef.current = rec;
  }, [onResult, clearTimers]);

  // ── Toggle: click once → start; click again → stop early ──
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isStartedRef.current) {
      // User clicked again → stop immediately
      clearTimers();
      try { recognitionRef.current.stop(); } catch (_) {}
      return;
    }

    // Start recording
    isStartedRef.current = true;
    setTranscript('');
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('SpeechRecognition start error:', err);
      isStartedRef.current = false;
      setIsListening(false);
      return;
    }

    // Countdown display (1 tick per second)
    setSecondsLeft(AUTO_STOP_MS / 1000);
    countdownRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(countdownRef.current!); countdownRef.current = null; return 0; }
        return s - 1;
      });
    }, 1000);

    // Auto-stop after 5 s
    autoStopTimerRef.current = setTimeout(() => {
      if (isStartedRef.current) {
        try { recognitionRef.current?.stop(); } catch (_) {}
      }
      clearTimers();
    }, AUTO_STOP_MS);
  }, [clearTimers]);

  return { isListening, transcript, supported, secondsLeft, toggleListening };
}


// ─────────────────────────────────────────────
// useTTS  (Web Speech Synthesis)
// ─────────────────────────────────────────────
export function useTTS() {
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter    = new SpeechSynthesisUtterance(text);
    utter.lang     = 'ja-JP';
    utter.rate     = 0.85;
    utter.pitch    = 1.1;
    const voices   = window.speechSynthesis.getVoices();
    const jpVoice  = voices.find(v => v.lang.startsWith('ja'));
    if (jpVoice) utter.voice = jpVoice;
    window.speechSynthesis.speak(utter);
  }, []);

  return { speak };
}

// ─────────────────────────────────────────────
// useAudioRecorder  (MediaRecorder API)
// Captures raw microphone audio for playback
// ─────────────────────────────────────────────
export function useAudioRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<BlobPart[]>([]);
  const streamRef        = useRef<MediaStream | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const startCapture = useCallback(async () => {
    try {
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob); });
        // Stop all tracks so the mic indicator goes away
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
    } catch (err) {
      console.warn('MediaRecorder not available:', err);
    }
  }, []);

  const stopCapture = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const clearAudio = useCallback(() => {
    setAudioUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [stopCapture]);

  return { audioUrl, startCapture, stopCapture, clearAudio };
}


// ─────────────────────────────────────────────
// useArena  -- state & logic for the Arena
// ─────────────────────────────────────────────
export function useArena(matchData: MatchData, onFinish: (score: number) => void) {
  const words    = matchData.gameData.wordsList;
  const { speak } = useTTS();
  const { audioUrl, startCapture, stopCapture, clearAudio } = useAudioRecorder();

  const [timeLeft,     setTimeLeft]     = useState(matchData.gameData.duration);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [textInput,    setTextInput]    = useState('');
  const [score,        setScore]        = useState(0);
  const [feedback,     setFeedback]     = useState<'correct' | 'wrong' | null>(null);
  const [inputMode,    setInputMode]    = useState<InputMode>('text');
  const [voiceHint,    setVoiceHint]    = useState('');
  const [shownWord,    setShownWord]    = useState<string | null>(null);

  const inputRef    = useRef<HTMLInputElement>(null);
  const finishedRef = useRef(false);

  const triggerFinish = useCallback((finalScore: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish(finalScore);
  }, [onFinish]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) { triggerFinish(score); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, score, triggerFinish]);

  // Focus text input on word change
  useEffect(() => {
    if (inputMode === 'text') inputRef.current?.focus();
  }, [currentIndex, inputMode]);

  // Auto-play TTS when entering voice mode or word changes in voice mode
  useEffect(() => {
    if (inputMode === 'voice') speak(words[currentIndex].char);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, inputMode]);

  // Process answer
  const processAnswer = useCallback((answer: string) => {
    if (feedback) return;
    const word = words[currentIndex];
    const isCorrect =
      answer.trim().toLowerCase() === word.romaji.toLowerCase() ||
      answer.trim() === word.char;

    const newScore = isCorrect ? score + 10 : score;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setScore(newScore);

    const correctChar = word.char;
    setTimeout(() => { speak(correctChar); setShownWord(correctChar); }, 200);
    setTimeout(() => {
      setFeedback(null); setTextInput(''); setVoiceHint(''); setShownWord(null);
      if (currentIndex + 1 < words.length) {
        setCurrentIndex(i => i + 1);
      } else {
        triggerFinish(newScore);
      }
    }, 1400);
  }, [feedback, words, currentIndex, score, speak, triggerFinish]);

  // Voice recognition
  const handleVoiceResult = useCallback((text: string) => {
    setVoiceHint(text);
    processAnswer(text);
  }, [processAnswer]);

  const { isListening, supported, secondsLeft, toggleListening } =
    useVoiceRecognition(handleVoiceResult);

  // Wrap toggleListening to also start/stop MediaRecorder
  const handleToggleListening = useCallback(() => {
    if (!isListening) {
      clearAudio();       // clear previous recording before starting new one
      startCapture();     // start MediaRecorder
    } else {
      stopCapture();      // stop MediaRecorder (triggers onstop → audioUrl)
    }
    toggleListening();    // start/stop SpeechRecognition
  }, [isListening, clearAudio, startCapture, stopCapture, toggleListening]);

  // Clear audio when moving to next word
  useEffect(() => { clearAudio(); }, [currentIndex]);

  // Derived values
  const timerPercent = (timeLeft / matchData.gameData.duration) * 100;
  const timerColor   = timeLeft > 20 ? '#6366f1' : timeLeft > 10 ? '#f59e0b' : '#ef4444';
  const currentWord  = words[currentIndex];

  return {
    words, currentIndex, currentWord,
    timeLeft, timerPercent, timerColor,
    textInput, setTextInput,
    score, feedback,
    inputMode, setInputMode,
    voiceHint, shownWord,
    inputRef,
    processAnswer, speak,
    isListening, supported, secondsLeft,
    toggleListening: handleToggleListening,
    audioUrl, clearAudio,
  };
}

// ─────────────────────────────────────────────
// useGamePage  -- socket, phase & match logic
// ─────────────────────────────────────────────
export function useGamePage() {
  const { socket, isConnected, user } = useSocket();

  const [phase,         setPhase]         = useState<GamePhase>('IDLE');
  const [matchData,     setMatchData]     = useState<MatchData | null>(null);
  const [gameResult,    setGameResult]    = useState<GameResult | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [countdownNum,  setCountdownNum]  = useState(3);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    socket.on('queue_joined', () => setStatusMessage('Dang tim doi thu...'));
    socket.on('queue_error',  (d: { message: string }) => setStatusMessage(d.message));
    socket.on('queue_left',   () => { setPhase('IDLE'); setStatusMessage(''); });
    socket.on('match_found',  (data: MatchData) => {
      setMatchData(data);
      setPhase('COUNTDOWN');
      setTimeout(() => setPhase('IN_GAME'), 3000);
    });
    socket.on('game_result',  (data: GameResult) => {
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

  // Countdown 3 to 1
  useEffect(() => {
    if (phase !== 'COUNTDOWN') { setCountdownNum(3); return; }
    const interval = setInterval(() =>
      setCountdownNum(n => (n > 1 ? n - 1 : n)), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const handleFindMatch = useCallback(() => {
    if (!socket || !user) return;
    setPhase('SEARCHING');
    socket.emit('join_queue', { userId: Number(user.id), name: user.name });
  }, [socket, user]);

  const handleCancel = useCallback(() => {
    if (!socket) return;
    socket.emit('leave_queue');
    setPhase('IDLE');
  }, [socket]);

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

  const handlePlayAgain = useCallback(() => {
    setMatchData(null);
    setGameResult(null);
    setPhase('IDLE');
    setStatusMessage('');
  }, []);

  return {
    user, isConnected,
    phase, matchData, gameResult, statusMessage, countdownNum,
    handleFindMatch, handleCancel, handleArenaFinish, handlePlayAgain,
  };
}
