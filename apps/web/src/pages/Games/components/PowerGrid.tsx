import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, RotateCw } from 'lucide-react';
import type { GameStartSession, GameEndResult } from '../../../services/gamesService';
import { gamesService } from '../../../services/gamesService';
import { CountdownOverlay } from './CountdownOverlay';

interface PowerGridProps {
  session: GameStartSession;
  onClose: () => void;
  onComplete: (result: GameEndResult) => void;
}

type Dir = 'N' | 'E' | 'S' | 'W';
type BitMask = number; // N=1, E=2, S=4, W=8

interface Tile {
  bits: BitMask;
  rot: number; // quarter turns
}

const ROWS = 4;
const COLS = 4;
const CELL_COUNT = ROWS * COLS;
const ROUND_MS = 120_000; // 120 second session
const MAX_MOVES_PER_LEVEL = 30;

const OPPOSITE: Record<Dir, Dir> = { N: 'S', S: 'N', E: 'W', W: 'E' };
const BIT: Record<Dir, BitMask> = { N: 1, E: 2, S: 4, W: 8 };
const DELTAS: Record<Dir, [number, number]> = { N: [-1, 0], S: [1, 0], E: [0, 1], W: [0, -1] };
const ALL_DIRS: Dir[] = ['N', 'E', 'S', 'W'];

const rotateBits = (bits: BitMask, q: number): BitMask => {
  let b = bits;
  for (let i = 0; i < ((q % 4) + 4) % 4; i++) {
    b = ((b << 1) | (b >> 3)) & 0xf;
  }
  return b;
};

const rotateDir = (d: Dir, q: number): Dir => {
  const order: Dir[] = ['N', 'E', 'S', 'W'];
  return order[((order.indexOf(d) + q) % 4 + 4) % 4];
};

interface Level {
  tiles: Tile[];
  path: { cell: number; dir: Dir; correctBits: BitMask }[];
  startCell: number;
}

/** Generate a random path from the top edge to the bottom edge, then build tiles. */
const generateLevel = (pathLength: number): Level => {
  const startCol = Math.floor(Math.random() * COLS);
  const startCell = startCol;

  const path: { cell: number; dir: Dir }[] = [];
  const visited = new Set<number>([startCell]);
  let r = 0;
  let c = startCol;
  let lastDir: Dir = 'N'; // entrance direction at start = N (from top edge)
  path.push({ cell: startCell, dir: lastDir });
  let ended = false;
  let guard = 0;

  while (!ended && guard++ < 200) {
    if (r === ROWS - 1) {
      ended = true;
      break;
    }
    // Weighted neighbor choice: prefer downward progress
    const options: { dir: Dir; nr: number; nc: number }[] = [];
    for (const d of ALL_DIRS) {
      const [dr, dc] = DELTAS[d];
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      const cell = nr * COLS + nc;
      if (visited.has(cell)) continue;
      // avoid adjacent-but-not-consecutive cells (prevents tight loops)
      let bad = false;
      for (const p of path) {
        if (Math.abs(Math.floor(p.cell / COLS) - nr) + Math.abs((p.cell % COLS) - nc) === 1) { bad = true; break; }
      }
      if (bad) continue;
      options.push({ dir: d, nr, nc });
    }
    if (options.length === 0) break; // dead end, accept shorter path
    // Weight: S 45%, E/W 30%, N 15%
    const weights = options.map((o) => (o.dir === 'S' ? 0.45 : o.dir === 'N' ? 0.15 : 0.2));
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    let pick = options[0];
    for (let i = 0; i < options.length; i++) {
      roll -= weights[i];
      if (roll <= 0) { pick = options[i]; break; }
    }
    const { dir, nr, nc } = pick;
    visited.add(nr * COLS + nc);
    path.push({ cell: nr * COLS + nc, dir });
    lastDir = dir;
    r = nr;
    c = nc;
  }
  if (!ended && guard >= 200) return generateLevel(pathLength);
  // Trim to target length if longer
  const maxLen = Math.max(3, pathLength);
  const trimmed = path.slice(0, maxLen);
  const exitDir = lastDir;

  // Build tiles with correct orientations
  const tiles: Tile[] = Array.from({ length: CELL_COUNT }, () => ({ bits: 0, rot: 0 }));
  const placed = new Map<number, BitMask>();

  const orientAt = (cell: number, entrance: Dir, exit: Dir | null): BitMask => {
    if (!exit) return BIT[entrance] | BIT[OPPOSITE[entrance]]; // endpoint: dead-end cap, treat as straight
    return BIT[entrance] | BIT[exit];
  };

  for (let i = 0; i < trimmed.length; i++) {
    const { cell, dir } = trimmed[i];
    const next = trimmed[i + 1];
    const exit = next ? rotateDir(OPPOSITE[next.dir], 0) : exitDir === 'S' ? 'S' : OPPOSITE[dir];
    // For the final cell the exit is opposite of entrance (bottom edge) — enforce:
    const finalExit = i === trimmed.length - 1 ? 'S' : exit;
    const bits = orientAt(cell, dir, finalExit);
    tiles[cell] = { bits, rot: 0 };
    placed.set(cell, bits);
  }

  // Decoy tiles on remaining cells
  for (let i = 0; i < CELL_COUNT; i++) {
    if (placed.has(i)) continue;
    const isCorner = Math.random() < 0.5;
    const bits = isCorner ? BIT['N'] | BIT['E'] : BIT['N'] | BIT['S'];
    tiles[i] = { bits, rot: 0 };
  }

  // Scramble: rotate every tile by random quarter turns
  for (const t of tiles) t.rot = Math.floor(Math.random() * 4);

  const pathDef = trimmed.map((p) => ({
    cell: p.cell,
    dir: p.dir,
    correctBits: rotateBits(placed.get(p.cell)!, 0),
  }));

  return { tiles, path: pathDef, startCell };
};

/** BFS flow from the source; returns set of lit cells. */
const flowLit = (tiles: Tile[], startCell: number, entrance: Dir): Set<number> => {
  const lit = new Set<number>();
  const queue: { cell: number; from: Dir }[] = [{ cell: startCell, from: entrance }];
  while (queue.length) {
    const { cell, from } = queue.shift()!;
    const bits = rotateBits(tiles[cell].bits, tiles[cell].rot);
    if (!(bits & BIT[from])) continue;
    lit.add(cell);
    for (const d of ALL_DIRS) {
      if (d === OPPOSITE[from]) continue;
      if (!(bits & BIT[d])) continue;
      const [dr, dc] = DELTAS[d];
      const nr = Math.floor(cell / COLS) + dr;
      const nc = (cell % COLS) + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      const ncell = nr * COLS + nc;
      if (lit.has(ncell)) continue;
      queue.push({ cell: ncell, from: d });
    }
  }
  return lit;
};

export const PowerGrid: React.FC<PowerGridProps> = ({ session, onClose, onComplete }) => {
  const [phase, setPhase] = useState<'countdown' | 'playing' | 'over'>('countdown');
  const [levelIndex, setLevelIndex] = useState(1);
  const [level, setLevel] = useState<Level>(() => generateLevel(7));
  const [lit, setLit] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [levelMoves, setLevelMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_MS / 1000);
  const [feedback, setFeedback] = useState<{ kind: 'flow' | 'fail' } | null>(null);
  const [roundOver, setRoundOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const sessionStartMs = useRef(Date.now());
  const playStartMs = useRef(0);
  const telemetry = useRef<Array<{ action: string; t: number }>>([]);
  const statsRef = useRef({ moves: 0, levels: 0, perfect: true, efficiencies: [] as number[] });
  const levelRef = useRef<Level>(level);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  // ── Timer ─────────────────────────────────────────────────────────────────
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

  const rotateTile = (cell: number) => {
    const lv = levelRef.current;
    const now = Date.now();
    telemetry.current.push({ action: 'rotate', t: now - sessionStartMs.current });

    const tiles = lv.tiles.map((t, i) => (i === cell ? { ...t, rot: (t.rot + 1) % 4 } : t));
    lv.tiles = tiles;
    setLevel({ ...lv });

    const newMoves = moves + 1;
    setMoves(newMoves);
    setLevelMoves(levelMoves + 1);
    statsRef.current.moves += 1;

    // Fail check: exceeded per-level move cap
    if (levelMoves + 1 >= MAX_MOVES_PER_LEVEL) {
      statsRef.current.perfect = false;
      setFeedback({ kind: 'fail' });
      telemetry.current.push({ action: 'level_failed', t: now - sessionStartMs.current });
      window.setTimeout(() => {
        // Scramble all tiles again and restart this level
        const re = generateLevel(lv.path.length);
        re.tiles.forEach((t) => (t.rot = Math.floor(Math.random() * 4)));
        setLevel(re);
        setLit(new Set());
        setLevelMoves(0);
        setFeedback(null);
      }, 350);
      return;
    }

    // Flow simulation
    const lits = flowLit(tiles, lv.startCell, 'N');
    setLit(lits);

    // Sink reached (any lit cell on bottom row exits S)?
    let completed = false;
    for (const cell of lits) {
      const r = Math.floor(cell / COLS);
      if (r === ROWS - 1 && rotateBits(tiles[cell].bits, tiles[cell].rot) & BIT['S']) {
        completed = true;
        break;
      }
    }

    if (completed) {
      const now2 = Date.now();
      const pathLen = lv.path.length;
      const eff = Math.round((pathLen / (levelMoves + 1)) * 100);
      statsRef.current.efficiencies.push(eff);
      statsRef.current.levels += 1;
      const gain = 60 + 5 * pathLen + (eff >= 50 ? 20 : 0);
      setScore((s) => s + gain);
      setFeedback({ kind: 'flow' });
      telemetry.current.push({ action: 'level_complete', t: now2 - sessionStartMs.current });
      window.setTimeout(() => {
        const next = levelIndex + 1;
        setLevelIndex(next);
        const lv2 = generateLevel(Math.min(12, 7 + next - 1));
        setLevel(lv2);
        setLit(new Set());
        setLevelMoves(0);
        setFeedback(null);
      }, 600);
    }
  };

  const submitResult = async () => {
    const durationMs = Date.now() - sessionStartMs.current;
    const s = statsRef.current;
    const efficiency = s.efficiencies.length
      ? Math.round(s.efficiencies.reduce((a, b) => a + b, 0) / s.efficiencies.length)
      : 0;

    try {
      const result = await gamesService.endSession(session.gameId, session.sessionId, {
        score,
        durationMs,
        telemetry: telemetry.current,
        stats: {
          moves: s.moves,
          efficiency,
          levelsCompleted: s.levels,
          perfect: s.perfect && s.levels > 0,
        },
      });
      onComplete(result);
    } catch (err: any) {
      onClose();
    }
  };

  const completeProgress = lit.size;

  return (
    <div className="fixed inset-0 z-50 bg-[#050608]/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[420px] relative flex flex-col items-center animate-fade-in">
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-4 px-4">
          <div>
            <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-1.5">
              <Zap size={20} className="text-[#00e5ff]" />
              POWER GRID
            </h2>
            <p className="text-xs text-text-tertiary">Rotate tiles to connect current · {ROUND_MS / 1000}s</p>
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
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl py-2 px-2 flex flex-col items-center">
            <span className="text-[9px] font-extrabold uppercase tracking-wide text-text-tertiary">Level</span>
            <span className="font-mono text-sm text-[#00e5ff] font-black mt-0.5">#{levelIndex}</span>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl py-2 px-2 flex flex-col items-center">
            <span className="text-[9px] font-extrabold uppercase tracking-wide text-text-tertiary">Moves</span>
            <motion.span
              key={levelMoves}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="font-mono text-sm text-white font-black mt-0.5"
            >
              {levelMoves}
              <span className="text-text-tertiary text-[10px]">/{MAX_MOVES_PER_LEVEL}</span>
            </motion.span>
          </div>
          <div className={`bg-white/[0.03] border rounded-2xl py-2 px-2 flex flex-col items-center ${timeLeft <= 15 ? 'border-error-red/40' : 'border-white/5'}`}>
            <span className="text-[9px] font-extrabold uppercase tracking-wide text-text-tertiary">Time</span>
            <span className={`font-mono text-sm font-black mt-0.5 ${timeLeft <= 15 ? 'text-error-red animate-pulse' : 'text-[#a7ffeb]'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Grid */}
        <div className="relative border border-white/10 rounded-3xl bg-gradient-to-b from-[#0d1520] to-[#0a0d14] shadow-2xl overflow-hidden mb-4 w-[92%]">
          <div
            className="grid gap-1.5 p-3"
            style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: CELL_COUNT }, (_, cell) => {
              const t = level.tiles[cell];
              const bits = rotateBits(t.bits, t.rot);
              const isLit = lit.has(cell);
              const r = Math.floor(cell / COLS);
              const isStart = cell === level.startCell;
              const isExit = r === ROWS - 1 && (bits & BIT['S']);

              const seg = (dir: Dir) => bits & BIT[dir] && isLit;

              return (
                <button
                  key={cell}
                  onClick={() => phase === 'playing' && rotateTile(cell)}
                  className="relative aspect-square rounded-xl border press-feedback overflow-hidden"
                  style={{
                    background: isLit
                      ? 'radial-gradient(circle, rgba(0,229,255,0.25) 0%, rgba(8,18,30,0.9) 100%)'
                      : 'rgba(255,255,255,0.02)',
                    borderColor: isLit ? 'rgba(0,229,255,0.5)' : isStart ? 'rgba(0,229,255,0.35)' : 'rgba(255,255,255,0.06)',
                    boxShadow: isLit ? '0 0 12px rgba(0,229,255,0.35)' : 'none',
                  }}
                >
                  {/* Pipe segments */}
                  <div className="absolute inset-0">
                    <div
                      className="absolute left-1/2 top-0 h-1/2 w-[3px] -translate-x-1/2 rounded-full"
                      style={{ background: seg('N') ? '#00e5ff' : 'rgba(120,140,160,0.35)' }}
                    />
                    <div
                      className="absolute left-1/2 bottom-0 h-1/2 w-[3px] -translate-x-1/2 rounded-full"
                      style={{ background: seg('S') ? '#00e5ff' : 'rgba(120,140,160,0.35)' }}
                    />
                    <div
                      className="absolute top-1/2 left-0 w-1/2 h-[3px] -translate-y-1/2 rounded-full"
                      style={{ background: seg('W') ? '#00e5ff' : 'rgba(120,140,160,0.35)' }}
                    />
                    <div
                      className="absolute top-1/2 right-0 w-1/2 h-[3px] -translate-y-1/2 rounded-full"
                      style={{ background: seg('E') ? '#00e5ff' : 'rgba(120,140,160,0.35)' }}
                    />
                    {/* Center hub */}
                    <div
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                      style={{ background: isLit ? '#00e5ff' : 'rgba(120,140,160,0.5)' }}
                    />
                    {isStart && (
                      <>
                        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 text-[8px]">⚡</div>
                        {/* Source tile hint pulse */}
                        {phase === 'playing' && !isLit && (
                          <div
                            className="absolute inset-0 rounded-xl animate-pulse pointer-events-none"
                            style={{ boxShadow: '0 0 16px 4px rgba(0,229,255,0.35)', border: '1px solid rgba(0,229,255,0.3)' }}
                          />
                        )}
                      </>
                    )}
                    {isExit && (
                      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 text-[8px]">⚡</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Countdown */}
          {phase === 'countdown' && (
            <CountdownOverlay
              label="Grid Energizing"
              onDone={() => {
                playStartMs.current = Date.now();
                setPhase('playing');
                setLit(flowLit(level.tiles, level.startCell, 'N'));
              }}
            />
          )}

          {roundOver && (
            <div className="absolute inset-0 z-30 bg-[#050608]/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <p className="text-lg font-black text-white uppercase tracking-widest animate-pulse">Grid Down</p>
              <p className="text-xs text-text-secondary mt-2">Validating output server-side...</p>
            </div>
          )}
        </div>

        {/* Hint row */}
        <div className="flex items-center gap-1.5 text-xs text-[#00e5ff] font-bold">
          <RotateCw size={14} className="text-[#00e5ff]" />
          <span>Tap tiles to rotate · reach the ⚡ at the bottom · {completeProgress} cells lit</span>
        </div>

        {/* Level feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              key={feedback.kind + String(levelIndex)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed top-[22%] left-1/2 -translate-x-1/2 z-40 px-5 py-2 rounded-full text-sm font-black tracking-wider uppercase"
              style={{
                background: feedback.kind === 'flow' ? 'rgba(0,229,255,0.15)' : 'rgba(244,67,54,0.15)',
                color: feedback.kind === 'flow' ? '#00e5ff' : '#ff5252',
                border: `1px solid ${feedback.kind === 'flow' ? 'rgba(0,229,255,0.4)' : 'rgba(244,67,54,0.4)'}`,
              }}
            >
              {feedback.kind === 'flow' ? `Level ${levelIndex} Complete · +${60 + 5 * level.path.length + (statsRef.current.efficiencies[statsRef.current.efficiencies.length - 1] >= 50 ? 20 : 0)} pts` : 'Overload — Grid Reset'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
