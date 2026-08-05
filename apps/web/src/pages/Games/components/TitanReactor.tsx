import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Flame } from 'lucide-react';
import type { GameStartSession, GameEndResult } from '../../../services/gamesService';
import { gamesService } from '../../../services/gamesService';
import { CountdownOverlay } from './CountdownOverlay';

interface TitanReactorProps {
  session: GameStartSession;
  onClose: () => void;
  onComplete: (result: GameEndResult) => void;
}

interface Node {
  id: number;
  cell: number;
  bornAt: number;
  duration: number;
  tappableAt: number;
}

const GRID_COLS = 4;
const GRID_ROWS = 3;
const CELL_COUNT = GRID_COLS * GRID_ROWS;
const ROUND_MS = 45_000; // 45 second session
const BASE_POINTS = 10;
const MISS_PENALTY = 10;
const MAX_COMBO_BONUS = 5; // 5x multiplier ceiling

export const TitanReactor: React.FC<TitanReactorProps> = ({ session, onClose, onComplete }) => {
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_MS / 1000);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [phase, setPhase] = useState<'countdown' | 'playing' | 'over'>('countdown');
  const [feedback, setFeedback] = useState<{ id: number; kind: 'fast' | 'hit' | 'miss' } | null>(null);
  const [roundOver, setRoundOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [missFlash, setMissFlash] = useState(false);
  const [difficultyPct, setDifficultyPct] = useState(0);

  const sessionStartMs = useRef(Date.now());
  const playStartMs = useRef(0);
  const telemetry = useRef<Array<{ action: string; t: number }>>([]);
  const reactionTimes = useRef<number[]>([]);

  const stateRef = useRef({
    score: 0,
    combo: 0,
    bestCombo: 0,
    hits: 0,
    misses: 0,
    nodes: [] as Node[],
    nextId: 1,
    difficulty: 1,
  });

  // ── Node spawner + fail checkers (running loop, no state re-renders) ─────
  useEffect(() => {
    if (phase !== 'playing') return;

    const interval = window.setInterval(() => {
      const s = stateRef.current;
      const now = Date.now();
      const elapsed = now - playStartMs.current;
      const progress = Math.min(elapsed / ROUND_MS, 1);

      // Dynamic difficulty: node window shrinks 1400ms → 700ms over the round
      s.difficulty = 1400 - 700 * progress;

      // Spawn a new node if fewer than the difficulty-allowable count are active
      const maxActive = Math.min(1 + Math.floor(progress * 2.5) + (s.difficulty < 1000 ? 1 : 0), CELL_COUNT - 1);
      const activeCount = s.nodes.length;

      if (activeCount < maxActive && Math.random() < 0.35 + progress * 0.5) {
        const occupied = new Set(s.nodes.map((n) => n.cell));
        const free = Array.from({ length: CELL_COUNT }, (_, i) => i).filter((c) => !occupied.has(c));
        if (free.length > 0) {
          const cell = free[Math.floor(Math.random() * free.length)];
          const duration = s.difficulty;
          const node: Node = {
            id: s.nextId++,
            cell,
            bornAt: now,
            duration,
            tappableAt: now,
          };
          s.nodes.push(node);
          telemetry.current.push({ action: 'node_spawn', t: now - sessionStartMs.current });
          setNodes([...s.nodes]);
        }
      }

      // Update difficulty visual
      setDifficultyPct(Math.round(progress * 100));

      // Fail expired nodes (misses)
      const now2 = Date.now();
      const expired = s.nodes.filter((n) => now2 - n.bornAt > n.duration);
      if (expired.length > 0) {
        for (const n of expired) {
          s.misses += 1;
          s.combo = 0;
          s.score = Math.max(0, s.score - MISS_PENALTY);
          telemetry.current.push({ action: 'miss', t: now2 - sessionStartMs.current });
          setFeedback({ id: n.id, kind: 'miss' });
          window.setTimeout(() => setFeedback((f) => (f?.id === n.id ? null : f)), 350);
        }
        // Screen-edge flash on miss
        setMissFlash(true);
        window.setTimeout(() => setMissFlash(false), 300);

        s.nodes = s.nodes.filter((n) => now2 - n.bornAt <= n.duration);
        setNodes([...s.nodes]);
        setMisses(s.misses);
        setCombo(0);
        setScore(s.score);
      }
    }, 160);

    return () => window.clearInterval(interval);
  }, [phase]);

  // ── Round timer ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((ROUND_MS - (Date.now() - playStartMs.current)) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) endRound();
    }, 250);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const endRound = () => {
    if (roundOver || submitting) return;
    setPhase('over');
    setRoundOver(true);
    setSubmitting(true);
    void submitResult();
  };

  const tapNode = (nodeId: number) => {
    const s = stateRef.current;
    const now = Date.now();
    const node = s.nodes.find((n) => n.id === nodeId);
    if (!node || phase !== 'playing') return;

    s.nodes = s.nodes.filter((n) => n.id !== nodeId);
    setNodes([...s.nodes]);

    const latency = now - node.bornAt;
    reactionTimes.current.push(latency);
    telemetry.current.push({ action: 'tap', t: now - sessionStartMs.current });

    const fastWindow = node.duration * 0.6;
    const isFast = latency <= fastWindow;
    const multiplier = Math.min(MAX_COMBO_BONUS, 1 + s.combo * 0.1);

    s.combo = isFast ? s.combo + 1 : 1;
    s.bestCombo = Math.max(s.bestCombo, s.combo);
    s.hits += 1;
    s.score += Math.round(BASE_POINTS * multiplier);

    setCombo(s.combo);
    setBestCombo(s.bestCombo);
    setHits(s.hits);
    setScore(s.score);
    setFeedback({ id: nodeId, kind: isFast ? 'fast' : 'hit' });
    window.setTimeout(() => setFeedback((f) => (f?.id === nodeId ? null : f)), 220);
  };

  const submitResult = async () => {
    const durationMs = Date.now() - sessionStartMs.current;
    const s = stateRef.current;
    const accuracy = s.hits + s.misses > 0 ? Math.round((s.hits / (s.hits + s.misses)) * 100) : 0;
    const avgReaction = reactionTimes.current.length
      ? Math.round(reactionTimes.current.reduce((a, b) => a + b, 0) / reactionTimes.current.length)
      : 0;

    try {
      const result = await gamesService.endSession(session.gameId, session.sessionId, {
        score: s.score,
        durationMs,
        telemetry: telemetry.current,
        stats: {
          combo: s.bestCombo,
          accuracy,
          reactionMs: avgReaction,
          perfect: s.hits > 0 && s.misses === 0,
        },
      });
      onComplete(result);
    } catch (err: any) {
      onClose();
    }
  };

  const multiplier = Math.min(MAX_COMBO_BONUS, 1 + combo * 0.1);

  return (
    <div className="fixed inset-0 z-50 bg-[#050608]/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
      {/* Screen-edge red flash on miss */}
      {missFlash && (
        <div
          className="fixed inset-0 z-[55] pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 80px 30px rgba(244,67,54,0.5)',
            animation: 'fade-out 0.3s ease-out forwards',
          }}
        />
      )}
      <div className="w-full max-w-[420px] relative flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-4 px-4">
          <div>
            <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-1.5">
              <Zap size={20} className="text-gold" />
              TITAN REACTOR
            </h2>
            <p className="text-xs text-text-tertiary">Tap overloaded nodes before they fail · 45s</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary active:scale-95 transition-transform"
          >
            <X size={20} />
          </button>
        </div>

        {/* Dashboard */}
        <div className="w-[92%] grid grid-cols-4 gap-2 mb-4">
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl py-2 px-2 flex flex-col items-center">
            <span className="text-[9px] font-extrabold uppercase tracking-wide text-text-tertiary">Score</span>
            <span className="font-mono text-sm text-usdt-green font-black mt-0.5">{score}</span>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl py-2 px-2 flex flex-col items-center relative overflow-hidden">
            {combo >= 5 && <div className="absolute inset-0 bg-[#ff3d00]/10 animate-pulse" />}
            <span className="text-[9px] font-extrabold uppercase tracking-wide text-text-tertiary flex items-center gap-0.5">
              Combo {combo >= 5 && <Flame size={9} className="text-[#ff3d00] animate-bounce" />}
            </span>
            <span className={`font-mono text-sm font-black mt-0.5 ${combo >= 5 ? 'text-[#ff3d00]' : 'text-white'}`}>
              {combo}x
            </span>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl py-2 px-2 flex flex-col items-center">
            <span className="text-[9px] font-extrabold uppercase tracking-wide text-text-tertiary">Mult</span>
            <span className="font-mono text-sm text-gold font-black mt-0.5">×{multiplier.toFixed(1)}</span>
          </div>
          <div className={`bg-white/[0.03] border rounded-2xl py-2 px-2 flex flex-col items-center ${timeLeft <= 10 ? 'border-error-red/40' : 'border-white/5'}`}>
            <span className="text-[9px] font-extrabold uppercase tracking-wide text-text-tertiary">Time</span>
            <span className={`font-mono text-sm font-black mt-0.5 ${timeLeft <= 10 ? 'text-error-red animate-pulse' : 'text-[#a7ffeb]'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Difficulty speed indicator */}
        {phase === 'playing' && (
          <div className="w-[92%] mb-3 flex items-center gap-2">
            <span className="text-[8px] font-extrabold uppercase tracking-wider text-text-tertiary shrink-0">Reactor Speed</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${difficultyPct}%`,
                  background: difficultyPct > 75 ? 'linear-gradient(90deg, #ff5252, #ff007f)' : difficultyPct > 40 ? 'linear-gradient(90deg, #ffb300, #ff5252)' : 'linear-gradient(90deg, #00e676, #ffb300)',
                  boxShadow: difficultyPct > 75 ? '0 0 8px rgba(255,82,82,0.6)' : '0 0 6px rgba(255,179,0,0.4)',
                }}
              />
            </div>
            <span className="text-[9px] font-mono font-black text-text-tertiary shrink-0">{difficultyPct}%</span>
          </div>
        )}

        {/* Reactor grid */}
        <div className="relative border border-white/10 rounded-3xl bg-gradient-to-b from-[#12141d] to-[#0e0f14] shadow-2xl overflow-hidden mb-4 w-[92%]">
          <div
            className="grid gap-2 p-4"
            style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: CELL_COUNT }, (_, cell) => {
              const node = nodes.find((n) => n.cell === cell);
              const progress = node ? Math.min((Date.now() - node.bornAt) / node.duration, 1) : 0;
              const danger = progress > 0.7;
              const isHit = feedback?.id === node?.id;

              return (
                <button
                  key={cell}
                  onClick={() => node && tapNode(node.id)}
                  disabled={!node || phase !== 'playing'}
                  className="relative aspect-square rounded-2xl border transition-colors press-feedback overflow-hidden"
                  style={{
                    background: node
                      ? danger
                        ? 'radial-gradient(circle, rgba(244,67,54,0.35) 0%, rgba(24,10,10,0.9) 100%)'
                        : 'radial-gradient(circle, rgba(255,179,0,0.28) 0%, rgba(20,16,8,0.9) 100%)'
                      : 'rgba(255,255,255,0.02)',
                    borderColor: node ? (danger ? 'rgba(244,67,54,0.6)' : 'rgba(255,179,0,0.4)') : 'rgba(255,255,255,0.06)',
                    boxShadow: node ? (danger ? '0 0 18px rgba(244,67,54,0.45)' : '0 0 14px rgba(255,179,0,0.3)') : 'none',
                  }}
                >
                  {node && (
                    <>
                      {/* Overload fill */}
                      <div
                        className="absolute bottom-0 left-0 right-0 transition-[height] duration-150"
                        style={{
                          height: `${progress * 100}%`,
                          background: danger
                            ? 'linear-gradient(to top, rgba(244,67,54,0.55), rgba(244,67,54,0.05))'
                            : 'linear-gradient(to top, rgba(255,179,0,0.5), rgba(255,179,0,0.05))',
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`font-black ${danger ? 'text-error-red' : 'text-gold'} animate-pulse`} style={{ fontSize: 18 }}>
                          ⚡
                        </span>
                      </div>
                      <AnimatePresence>
                        {isHit && (
                          <motion.div
                            key="hit"
                            initial={{ scale: 1.6, opacity: 1 }}
                            animate={{ scale: 0.4, opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                          >
                            <span className={`text-2xl font-black ${feedback?.kind === 'fast' ? 'text-usdt-green' : 'text-[#a7ffeb]'}`}>
                              {feedback?.kind === 'fast' ? '+FAST' : '+HIT'}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* Countdown overlay */}
          {phase === 'countdown' && (
            <CountdownOverlay
              label="Reactor Ignition"
              onDone={() => {
                playStartMs.current = Date.now();
                setPhase('playing');
              }}
            />
          )}

          {/* Round over overlay */}
          {roundOver && (
            <div className="absolute inset-0 z-30 bg-[#050608]/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <p className="text-lg font-black text-white uppercase tracking-widest animate-pulse">Reactor Shutdown</p>
              <p className="text-xs text-text-secondary mt-2">Validating output server-side...</p>
            </div>
          )}
        </div>

        {/* Hint row */}
        <div className="flex items-center gap-1.5 text-xs text-[#a7ffeb] font-bold">
          <Zap size={14} className="text-gold animate-spin-slow" />
          <span>Fast taps build combos — every miss costs 10 pts</span>
        </div>
      </div>
    </div>
  );
};
