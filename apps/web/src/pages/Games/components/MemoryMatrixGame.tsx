import React, { useEffect, useRef, useState } from 'react';
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

  const sessionStartMs = useRef(Date.now());
  const telemetry = useRef<Array<{ action: string; t: number }>>([]);
  const inputTimeout = useRef<number | null>(null);
  const tapsRef = useRef(0);
  const correctTapsRef = useRef(0);

  const startRound = () => {
    setPhase('showing');
    setInputIndex(0);
    setFeedback(null);

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
    inputTimeout.current = window.setTimeout(() => {
      endGame(false, 'TIME_OUT');
    }, TAP_TIMEOUT_MS);
  };

  const handleCellTap = (cell: number) => {
    if (phase !== 'input') return;
    if (inputTimeout.current) clearTimeout(inputTimeout.current);

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
      endGame(false, 'WRONG_SEQUENCE');
    }
  };

  const endGame = (cleared: boolean, reason: string) => {
    if (submitting) return;
    setPhase('over');
    setSubmitting(true);
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#050608]/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[420px] relative flex flex-col items-center animate-fade-in">
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-4 px-4">
          <div>
            <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-1.5">
              <Brain size={20} className="text-[#00e5ff]" />
              MEMORY MATRIX
            </h2>
            <p className="text-xs text-text-tertiary">Memorize the sequence and repeat it</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary active:scale-95 transition-transform"
          >
            <X size={20} />
          </button>
        </div>

        {/* Score dashboard */}
        <div className="w-[90%] grid grid-cols-3 gap-2.5 mb-6">
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

        {/* Status pill */}
        <div className="mb-5 h-6 flex items-center justify-center">
          {phase === 'showing' && (
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#00e5ff] animate-pulse">
              Watch carefully...
            </span>
          )}
          {phase === 'input' && (
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-white">
              Your turn — repeat the pattern ({inputIndex}/{sequence.length})
            </span>
          )}
          {phase === 'feedback' && feedback === 'correct' && (
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-usdt-green">✔ Level clear!</span>
          )}
          {phase === 'over' && (
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-gold">Validating... ⏳</span>
          )}
        </div>

        {/* Matrix grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {Array.from({ length: GRID * GRID }, (_, i) => {
            const isLit = litCell === i;
            const isHighlighted = phase === 'feedback' && feedback === 'wrong';
            return (
              <button
                key={i}
                onClick={() => handleCellTap(i)}
                disabled={phase !== 'input' || submitting}
                className={`w-24 h-24 rounded-2xl border transition-all duration-150 active:scale-95 disabled:cursor-default ${
                  isLit
                    ? 'bg-[#00e5ff]/80 border-[#00e5ff] shadow-[0_0_25px_rgba(0,229,255,0.7)]'
                    : isHighlighted
                      ? 'bg-[#ff5252]/20 border-error-red/50'
                      : 'bg-[#0d0e17] border-white/10 hover:border-[#00e5ff]/40'
                }`}
                style={{ boxShadow: isLit ? '0 0 25px rgba(0,229,255,0.7)' : undefined }}
              >
                {phase === 'input' && <span className="text-[10px] text-text-tertiary font-mono">{i + 1}</span>}
              </button>
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
