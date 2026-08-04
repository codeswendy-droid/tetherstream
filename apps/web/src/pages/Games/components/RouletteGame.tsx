import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import type { GameStartSession, GameEndResult } from '../../../services/gamesService';
import { gamesService } from '../../../services/gamesService';

interface RouletteGameProps {
  session: GameStartSession;
  sectors: Array<{ label: string; type: 'USDT' | 'CRYSTALS' | 'BOOST'; value: number; premium: boolean }>;
  onClose: () => void;
  onComplete: (result: GameEndResult) => void;
}

interface Sector {
  label: string;
  type: 'USDT' | 'CRYSTALS' | 'BOOST';
  value: number;
  premium: boolean;
}

const SECTOR_COLORS: Record<Sector['type'], { bg: string; text: string; icon: string }> = {
  USDT: { bg: 'rgba(0, 230, 118, 0.15)', text: '#00e676', icon: '₮' },
  CRYSTALS: { bg: 'rgba(0, 229, 255, 0.12)', text: '#a7ffeb', icon: '💎' },
  BOOST: { bg: 'rgba(255, 179, 0, 0.15)', text: '#ffb300', icon: '⚡' },
};

export const RouletteGame: React.FC<RouletteGameProps> = ({ session, sectors, onClose, onComplete }) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [tickerBounce, setTickerBounce] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; size: number }>>([]);
  const [coins, setCoins] = useState<Array<{ id: number; x: number; y: number; vy: number; vx: number; rotation: number; rotSpeed: number; scale: number; symbol: string; color: string }>>([]);
  const [submitting, setSubmitting] = useState(false);

  const currentAngle = useRef(0);
  const animFrame = useRef<number | null>(null);
  const lastSectorPassed = useRef(-1);

  const outcomeIndex = session.outcomeSectorIndex;
  const wonSector = outcomeIndex != null && sectors[outcomeIndex] ? sectors[outcomeIndex] : null;

  // The wheel renders exactly the server-config sectors. Values/weights are
  // never used client-side — the outcome is decided and validated server-side.
  const activeSectors = sectors.length ? sectors : [];

  const sectorDegrees = activeSectors.length ? 360 / activeSectors.length : 45;

  const handleSpin = () => {
    if (spinning || !activeSectors.length || outcomeIndex == null) return;
    setSpinning(true);

    const targetDegrees = 360 * 6 + (360 - outcomeIndex * sectorDegrees) - sectorDegrees / 2;

    const duration = 5000;
    const startTime = performance.now();
    const startRotation = rotation % 360;

    const animateWheel = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
      const currentRot = startRotation + (targetDegrees - startRotation) * easeOut(progress);

      setRotation(currentRot);
      currentAngle.current = currentRot;

      const relativeAngle = (currentRot + 90) % 360;
      const currentSectorIdx = Math.floor(((360 - relativeAngle) % 360) / sectorDegrees);

      if (currentSectorIdx !== lastSectorPassed.current) {
        lastSectorPassed.current = currentSectorIdx;
        setTickerBounce(true);
        setTimeout(() => setTickerBounce(false), 50);
      }

      if (progress < 1) {
        animFrame.current = requestAnimationFrame(animateWheel);
      } else {
        setSpinning(false);
        setShowPrizeModal(true);
        spawnParticles();
      }
    };

    animFrame.current = requestAnimationFrame(animateWheel);
  };

  const spawnParticles = () => {
    const list: Array<{ id: number; x: number; y: number; color: string; size: number }> = [];
    const colors = ['#00e676', '#ffb300', '#00e5ff', '#ff007f', '#d4af37'];
    for (let i = 0; i < 40; i++) {
      list.push({
        id: Date.now() + i,
        x: Math.random() * 200 - 100,
        y: Math.random() * 200 - 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 4,
      });
    }
    setParticles(list);

    const falling: Array<{ id: number; x: number; y: number; vy: number; vx: number; rotation: number; rotSpeed: number; scale: number; symbol: string; color: string }> = [];
    const symbol = wonSector?.type === 'USDT' ? '₮' : wonSector?.type === 'CRYSTALS' ? '💎' : '⚡';
    const color = wonSector?.type === 'USDT' ? '#00e676' : wonSector?.type === 'CRYSTALS' ? '#00e5ff' : '#ffb300';
    for (let i = 0; i < 28; i++) {
      falling.push({
        id: Math.random() + i,
        x: Math.random() * window.innerWidth,
        y: -100 - Math.random() * 400,
        vy: Math.random() * 4 + 3,
        vx: (Math.random() - 0.5) * 3,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 6,
        scale: Math.random() * 0.4 + 0.7,
        symbol,
        color,
      });
    }
    setCoins(falling);
  };

  useEffect(() => {
    if (!showPrizeModal) {
      if (coins.length > 0) setCoins([]);
      return;
    }
    let coinAnimId: number;
    const updateCoins = () => {
      setCoins((prev) =>
        prev
          .map((c) => ({ ...c, y: c.y + c.vy, x: c.x + c.vx, rotation: c.rotation + c.rotSpeed }))
          .filter((c) => c.y < window.innerHeight + 50)
      );
      coinAnimId = requestAnimationFrame(updateCoins);
    };
    coinAnimId = requestAnimationFrame(updateCoins);
    return () => cancelAnimationFrame(coinAnimId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPrizeModal, coins.length]);

  useEffect(() => {
    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, []);

  // Finalize the session — the server validates and rewards; the client only reports completion
  const finalizeSession = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const durationMs = Date.now() - new Date(session.serverStartedAt).getTime();
      const result = await gamesService.endSession(session.gameId, session.sessionId, {
        score: 1,
        durationMs,
        telemetry: [{ action: 'spin', t: Date.now() - new Date(session.serverStartedAt).getTime() }],
      });
      setShowPrizeModal(false);
      onComplete(result);
    } catch (err: any) {
      setSubmitting(false);
      setShowPrizeModal(false);
      onClose();
    }
  };

  const resetWheel = () => {
    setShowPrizeModal(false);
    setParticles([]);
    setCoins([]);
    finalizeSession();
  };

  if (!activeSectors.length) {
    return (
      <div className="fixed inset-0 z-50 bg-[#050608]/95 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="text-center text-sm text-text-secondary">
          <p className="mb-3">Loading wheel configuration...</p>
          <button onClick={onClose} className="text-xs text-usdt-green font-bold">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#050608]/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[420px] relative flex flex-col items-center">
        {/* Top Header */}
        <div className="w-full flex items-center justify-between mb-6 px-4">
          <div>
            <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-1.5">
              <Sparkles size={20} className="text-gold" />
              CRYPTO ROULETTE
            </h2>
            <p className="text-xs text-text-tertiary">Outcome is decided &amp; validated server-side</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary active:scale-95 transition-transform"
          >
            <X size={20} />
          </button>
        </div>

        {/* Balance Status card */}
        <div className="w-[92%] bg-gradient-to-r from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl py-3.5 px-4 flex items-center justify-between mb-8 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary">Entry paid:</span>
            <span className="font-mono text-sm text-gold font-extrabold flex items-center gap-1">💎 {session.crystalCost}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary">Session:</span>
            <span className="font-mono text-xs text-usdt-green font-extrabold">{session.sessionId.slice(0, 8)}</span>
          </div>
        </div>

        {/* The Wheel Stage */}
        <div className="relative w-[310px] h-[310px] mb-10 flex items-center justify-center">
          <div className="absolute inset-[-15px] rounded-full bg-[#00e676]/5 blur-2xl pointer-events-none" />

          <div className="absolute inset-0 rounded-full border-4 border-white/10 shadow-[0_0_40px_rgba(0,230,118,0.2)] flex items-center justify-center bg-gradient-to-b from-[#181a24] to-[#0e1017]">
            {[...Array(16)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  spinning
                    ? i % 2 === Math.floor(rotation / 45) % 2
                      ? 'bg-usdt-green shadow-[0_0_8px_#00e676]'
                      : 'bg-gold shadow-[0_0_8px_#ffb300]'
                    : 'bg-white/20'
                }`}
                style={{ transform: `rotate(${i * 22.5}deg) translateY(-148px)` }}
              />
            ))}
          </div>

          <motion.div
            animate={{ rotate: tickerBounce ? -15 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-8 h-10 flex flex-col items-center filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
            style={{ transformOrigin: 'top center' }}
          >
            <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-error-red" />
            <div className="w-4 h-4 rounded-full bg-white border border-error-red -mt-[26px]" />
          </motion.div>

          <div
            className="w-[288px] h-[288px] rounded-full overflow-hidden relative border-2 border-white/10 shadow-[inset_0_4px_20px_rgba(0,0,0,0.6)] bg-[#0d0e14] z-10"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {activeSectors.map((sector, idx) => {
              const deg = 360 / activeSectors.length;
              const colors = SECTOR_COLORS[sector.type];
              return (
                <div
                  key={idx}
                  className="absolute top-0 right-0 w-[144px] h-[144px] origin-bottom-left"
                  style={{
                    transform: `rotate(${idx * deg}deg)`,
                    background: sector.premium
                      ? 'radial-gradient(circle at 100% 100%, rgba(212,175,55,0.35) 0%, rgba(21,18,8,0.9) 100%)'
                      : `radial-gradient(circle at 100% 100%, ${colors.bg} 0%, rgba(13,14,20,0.95) 100%)`,
                    borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div
                    className="absolute bottom-4 left-6 origin-bottom-left flex flex-col items-center gap-1"
                    style={{ transform: `rotate(${deg / 2}deg) translate(30px, 45px) rotate(90deg)`, color: sector.premium ? '#d4af37' : colors.text }}
                  >
                    <span className="text-base">{colors.icon}</span>
                    <span className="font-extrabold text-[9px] whitespace-nowrap tracking-tight leading-none uppercase">
                      {sector.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleSpin}
            disabled={spinning || submitting}
            className="absolute z-20 w-18 h-18 rounded-full bg-gradient-to-b from-[#2d3043] to-[#12131a] border border-white/15 shadow-[0_6px_20px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.1)] flex flex-col items-center justify-center active:scale-95 transition-transform disabled:opacity-90 animate-breathe"
          >
            <span className="text-[10px] font-black tracking-widest text-[#00e676] animate-pulse">{spinning ? '...' : 'SPIN'}</span>
            <span className="text-[8px] font-bold text-text-tertiary uppercase leading-none mt-0.5">{spinning ? 'Spinning' : 'Start'}</span>
          </button>
        </div>

        <p className="text-xs text-text-tertiary text-center max-w-[280px]">
          Winnings are validated by the Rewards Engine — USDT payouts are queued for claim in your rewards section.
        </p>

        {showPrizeModal && coins.length > 0 && (
          <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
            {coins.map((c) => (
              <div
                key={c.id}
                className="absolute flex items-center justify-center select-none font-bold font-mono"
                style={{
                  transform: `translate(${c.x}px, ${c.y}px) rotate(${c.rotation}deg) scale(${c.scale})`,
                  color: c.color,
                  fontSize: c.symbol === '₮' ? '28px' : '22px',
                  textShadow: `0 0 10px ${c.color}aa, 0 4px 12px rgba(0,0,0,0.6)`,
                }}
              >
                {c.symbol}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {showPrizeModal && wonSector && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-[#050608]/96 flex flex-col items-center justify-center p-6 overflow-hidden"
            >
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-25">
                <div className="w-[500px] h-[500px] rounded-full border border-white/5 bg-[radial-gradient(circle,_rgba(255,255,255,0.06)_0%,_transparent_70%)] animate-spin-slow" />
                <svg className="absolute w-[500px] h-[500px] animate-spin-slow" viewBox="0 0 100 100" style={{ animationDuration: '24s' }}>
                  {[...Array(12)].map((_, i) => (
                    <polygon
                      key={i}
                      points="50,50 43,0 57,0"
                      fill={wonSector.type === 'USDT' ? '#00e676' : '#00e5ff'}
                      opacity="0.15"
                      transform={`rotate(${i * 30} 50 50)`}
                    />
                  ))}
                </svg>
              </div>

              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {particles.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                    animate={{ x: p.x * 2.5, y: p.y * 2.5, scale: 0, opacity: 0 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className="absolute rounded-full"
                    style={{ width: p.size, height: p.size, backgroundColor: p.color, boxShadow: `0 0 10px ${p.color}` }}
                  />
                ))}
              </div>

              <motion.div
                initial={{ scale: 0.8, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-[340px] bg-gradient-to-b from-[#1c1d29] to-[#0d0e15] border border-white/15 rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl relative"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 border" style={{ background: `${SECTOR_COLORS[wonSector.type].text}1a`, borderColor: `${SECTOR_COLORS[wonSector.type].text}44` }}>
                  {SECTOR_COLORS[wonSector.type].icon}
                </div>
                <h3 className="text-2xl font-black text-white tracking-wide uppercase">
                  {wonSector.premium ? '🔥 MEGA WIN! 🔥' : 'CONGRATULATIONS!'}
                </h3>
                <p className="text-xs text-text-secondary mt-1 mb-6">Server-validated outcome:</p>

                <div className="w-full bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl px-6 py-5 mb-6 shadow-inner flex flex-col items-center justify-center relative overflow-hidden">
                  <span className="text-4xl mb-2">{SECTOR_COLORS[wonSector.type].icon}</span>
                  <span className="text-3xl font-mono font-black tracking-wide" style={{ color: SECTOR_COLORS[wonSector.type].text }}>
                    {wonSector.type === 'USDT' ? `₮ ${wonSector.value.toFixed(2)}` : wonSector.type === 'CRYSTALS' ? `${wonSector.value} 💎` : `×${wonSector.value} Boost ⚡`}
                  </span>
                  <span className="text-[10px] text-text-tertiary mt-1.5 uppercase font-bold tracking-wider">{wonSector.label}</span>
                </div>

                <button
                  onClick={resetWheel}
                  disabled={submitting}
                  className="w-full py-4 btn-glossy-primary rounded-xl text-sm font-bold tracking-wider disabled:opacity-60"
                >
                  {submitting ? 'VALIDATING...' : 'AWESOME'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
