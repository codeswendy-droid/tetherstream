import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Brain } from 'lucide-react';
import type { GameStartSession, GameEndResult } from '../../../services/gamesService';
import { gamesService } from '../../../services/gamesService';

interface MemoryMatrixGameProps {
  session: GameStartSession;
  onClose: () => void;
  onComplete: (result: GameEndResult) => void;
}

const GRID = 3;
const MAX_LEVEL = 12;
const SHOW_MS = 450;
const TAP_TIMEOUT_MS = 6000;

type Phase = 'idle' | 'showing' | 'input' | 'feedback' | 'over';

export const MemoryMatrixGame: React.FC<MemoryMatrixGameProps> = ({ session, onClose, onComplete }) => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [inputIndex, setInputIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [litCell, setLitCell] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [shakeCell, setShakeCell] = useState<number | null>(null);
  const [tapTimeRemaining, setTapTimeRemaining] = useState(100); // percentage

  const sessionStartMs = useRef(Date.now());
  const telemetry = useRef<Array<{ action: string; t: number }>>([]);
  const inputTimeout = useRef<number | null>(null);
  const tapTimerInterval = useRef<number | null>(null);
  const tapTimerStart = useRef(0);
  const tapsRef = useRef(0);
  const correctTapsRef = useRef(0);

  const startRound = () => {
    setPhase('showing');
    setInputIndex(0);
    setFeedback(null);
    setShakeCell(null);
    setTapTimeRemaining(100);

    const nextSequence = Array.from({ length: Math.min(level + 1, MAX_LEVEL) }, () => Math.floor(Math.random() * 9));
    setSequence(nextSequence);

    telemetry.current.push({ action: 'round_start', t: Date.now() - sessionStartMs.current });

    let idx = 0;
    const showTimer = setInterval(() => {
      if (idx < nextSequence.length) {
        setLitCell(nextSequence[idx]);
        idx += 1;
      } else {
        clearInterval(showTimer);
        setLitCell(null);
        setPhase('input');
        armTapTimeout();
      }
    }, SHOW_MS);
  };

  const armTapTimeout = () => {
    if (inputTimeout.current) clearTimeout(inputTimeout.current);
    if (tapTimerInterval.current) clearInterval(tapTimerInterval.current);

    tapTimerStart.current = Date.now();
    setTapTimeRemaining(100);

    // Visual countdown bar
    tapTimerInterval.current = window.setInterval(() => {
      const elapsed = Date.now() - tapTimerStart.current;
      const remaining = Math.max(0, 100 - (elapsed / TAP_TIMEOUT_MS) * 100);
      setTapTimeRemaining(remaining);
      if (remaining <= 0 && tapTimerInterval.current) {
        clearInterval(tapTimerInterval.current);
      }
    }, 50);

    inputTimeout.current = window.setTimeout(() => {
      if (tapTimerInterval.current) clearInterval(tapTimerInterval.current);
      endGame(false, 'TIME_OUT');
    }, TAP_TIMEOUT_MS);
  };

  const handleCellTap = (cell: number) => {
    if (phase !== 'input') return;
    if (inputTimeout.current) clearTimeout(inputTimeout.current);
    if (tapTimerInterval.current) clearInterval(tapTimerInterval.current);

    telemetry.current.push({ action: 'tap', t: Date.now() - sessionStartMs.current });
    tapsRef.current += 1;

    if (cell === sequence[inputIndex]) {
      correctTapsRef.current += 1;
      const nextIndex = inputIndex + 1;
      if (nextIndex >= sequence.length) {
        // Level cleared
        const nextScore = score + 1;
        setScore(nextScore);
        setLevel((l) => l + 1);
        setFeedback('correct');
        setPhase('feedback');
        telemetry.current.push({ action: 'level_clear', t: Date.now() - sessionStartMs.current });

        window.setTimeout(() => {
          if (nextScore >= MAX_LEVEL) {
            endGame(true, 'MAX_LEVEL');
          } else {
            startRound();
          }
        }, 700);
      } else {
        setInputIndex(nextIndex);
        armTapTimeout();
      }
    } else {
      // Wrong — shake animation
      setShakeCell(cell);
      setTimeout(() => setShakeCell(null), 400);
      endGame(false, 'WRONG_SEQUENCE');
    }
  };

  const endGame = (cleared: boolean, reason: string) => {
    if (submitting) return;
    setPhase('over');
    setSubmitting(true);
    if (tapTimerInterval.current) clearInterval(tapTimerInterval.current);
    telemetry.current.push({ action: 'round_end', t: Date.now() - sessionStartMs.current });
    void submitResult(cleared, reason);
  };

  const submitResult = async (cleared: boolean, reason: string) => {
    const durationMs = Date.now() - sessionStartMs.current;
    const taps = tapsRef.current;
    try {
      const result = await gamesService.endSession(session.gameId, session.sessionId, {
        score,
        durationMs,
        telemetry: telemetry.current,
        stats: {
          accuracy: taps > 0 ? Math.round((correctTapsRef.current / taps) * 100) : 0,
          levelsCompleted: score,
          perfect: cleared && reason === 'MAX_LEVEL',
        },
      });
      onComplete(result);
    } catch (err: any) {
      onClose();
    }
  };

  useEffect(() => {
    startRound();
    return () => {
      if (inputTimeout.current) clearTimeout(inputTimeout.current);
      if (tapTimerInterval.current) clearInterval(tapTimerInterval.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Color for the timer bar
  const timerBarColor = tapTimeRemaining > 50 ? '#00e5ff' : tapTimeRemaining > 20 ? '#ffb300' : '#ff5252';

  return (
    <div className="fixed inset-0 z-50 bg-[#050608]/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[420px] relative flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-4 px-2">
          <div>
            <h2 className="text-lg font-black text-white tracking-wide flex items-center gap-1.5">
              <Brain size={18} className="text-[#00e5ff]" />
              MEMORY MATRIX
            </h2>
            <p className="text-[10px] text-text-tertiary">Memorize the sequence and repeat it</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary active:scale-95 transition-transform"
          >
            <X size={18} />
          </button>
        </div>

        {/* Score dashboard */}
        <div className="w-full grid grid-cols-3 gap-2 mb-4 px-2">
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl py-2 px-3 flex flex-col items-center">
            <span className="text-[9px] font-extrabold uppercase tracking-wide text-text-tertiary">Level</span>
            <span className="font-mono text-base text-[#00e5ff] font-black mt-0.5">{level}</span>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl py-2 px-3 flex flex-col items-center">
            <span className="text-[9px] font-extrabold uppercase tracking-wide text-text-tertiary">Score</span>
            <span className="font-mono text-base text-usdt-green font-black mt-0.5">{score}</span>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl py-2 px-3 flex flex-col items-center">
            <span className="text-[9px] font-extrabold uppercase tracking-wide text-text-tertiary">Sequence</span>
            <span className="font-mono text-base text-gold font-black mt-0.5">{sequence.length}</span>
          </div>
        </div>

        {/* Tap timer bar — visible during input phase */}
        {phase === 'input' && (
          <div className="w-full px-2 mb-3">
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                animate={{ width: `${tapTimeRemaining}%` }}
                transition={{ duration: 0.05 }}
                className="h-full rounded-full"
                style={{ backgroundColor: timerBarColor, boxShadow: `0 0 8px ${timerBarColor}80` }}
              />
            </div>
          </div>
        )}

        {/* Status pill */}
        <div className="mb-4 h-6 flex items-center justify-center">
          {phase === 'showing' && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[11px] font-extrabold uppercase tracking-widest text-[#00e5ff] animate-pulse"
            >
              Watch carefully...
            </motion.span>
          )}
          {phase === 'input' && (
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-white">
              Your turn — repeat the pattern ({inputIndex}/{sequence.length})
            </span>
          )}
          {phase === 'feedback' && feedback === 'correct' && (
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-[11px] font-extrabold uppercase tracking-widest text-usdt-green"
            >
              ✔ Level clear!
            </motion.span>
          )}
          {phase === 'over' && (
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-gold">Validating... ⏳</span>
          )}
        </div>

        {/* Matrix grid — RESPONSIVE: uses aspect-ratio and max-w to prevent overflow */}
        <div className="grid grid-cols-3 gap-2.5 mb-5 w-full px-2" style={{ maxWidth: '320px' }}>
          {Array.from({ length: GRID * GRID }, (_, i) => {
            const isLit = litCell === i;
            const isHighlighted = phase === 'feedback' && feedback === 'wrong';
            const isShaking = shakeCell === i;
            return (
              <motion.button
                key={i}
                onClick={() => handleCellTap(i)}
                disabled={phase !== 'input' || submitting}
                animate={
                  isShaking
                    ? { x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.35 } }
                    : isLit
                      ? { scale: [1, 1.05, 1], transition: { duration: 0.2 } }
                      : {}
                }
                className={`aspect-square rounded-2xl border transition-all duration-150 active:scale-95 disabled:cursor-default flex items-center justify-center ${
                  isLit
                    ? 'bg-[#00e5ff]/80 border-[#00e5ff] shadow-[0_0_25px_rgba(0,229,255,0.7)]'
                    : isHighlighted || isShaking
                      ? 'bg-[#ff5252]/20 border-error-red/50'
                      : 'bg-[#0d0e17] border-white/10 hover:border-[#00e5ff]/40'
                }`}
                style={{ boxShadow: isLit ? '0 0 25px rgba(0,229,255,0.7)' : undefined }}
              >
                {phase === 'input' && <span className="text-[10px] text-text-tertiary font-mono">{i + 1}</span>}
              </motion.button>
            );
          })}
        </div>

        {/* Hint row */}
        <div className="flex items-center gap-1.5 text-xs text-[#a7ffeb] font-bold">
          <Sparkles size={14} className="text-[#00e5ff] animate-spin-slow" />
          <span>Each cleared level adds one more step to the matrix</span>
        </div>
      </div>
    </div>
  );
};
