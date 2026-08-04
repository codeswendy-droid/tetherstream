import type React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, ShieldCheck, Cpu, RefreshCw, Sparkles, CheckCircle, Zap } from 'lucide-react';
import { useTelegram } from '../context/TelegramContext';

interface FlipPassportCardProps {
  username: string;
  handle: string;
  trustScore: number;
  totalMachines: number;
  level: string;
  serialNumber?: string;
  commissionDate?: string;
}

export const FlipPassportCard: React.FC<FlipPassportCardProps> = ({
  username,
  handle,
  trustScore,
  totalMachines,
  level,
  serialNumber = 'SN-TT-PASS-PENDING',
  commissionDate = 'N/A',
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const { hapticFeedback } = useTelegram();

  const handleCardClick = () => {
    hapticFeedback.impactOccurred('medium');
    setIsFlipped(!isFlipped);
  };

  return (
    <div
      onClick={handleCardClick}
      className="w-full cursor-pointer perspective-1000 select-none group"
      title="Tap to flip passport"
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative w-full rounded-3xl min-h-[220px]"
      >
        {/* FRONT FACE OF PASSPORT */}
        <div
          style={{ backfaceVisibility: 'hidden' }}
          className="w-full h-full rounded-3xl p-5 bg-gradient-to-br from-[#141a29] via-card-bg to-[#0b0e16] border-2 border-gold/40 shadow-2xl relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 w-44 h-44 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold to-amber-600 p-0.5 shadow-lg shadow-gold/20">
                <div className="w-full h-full bg-[#0b0e14] rounded-[14px] flex items-center justify-center text-gold font-black text-xl">
                  {username[0].toUpperCase()}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-text-primary leading-tight">{username}</h2>
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-usdt-green/20 text-usdt-green uppercase tracking-wider border border-usdt-green/30">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-text-tertiary font-mono mt-0.5">{handle}</p>
              </div>
            </div>

            <div className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-gold flex items-center gap-1 text-[10px] font-bold">
              <RefreshCw size={12} className="animate-spin-slow" />
              <span>Tap to Flip</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gold/20 mt-4">
            <div className="bg-white/5 rounded-2xl p-2.5 border border-white/5">
              <div className="text-[9px] font-bold text-text-tertiary uppercase">Trust Score</div>
              <div className="text-base font-black text-usdt-green font-mono mt-0.5">
                {trustScore}/100
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-2.5 border border-white/5">
              <div className="text-[9px] font-bold text-text-tertiary uppercase">Machines</div>
              <div className="text-base font-black text-text-primary font-mono mt-0.5">
                {totalMachines} Owned
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-2.5 border border-white/5">
              <div className="text-[9px] font-bold text-text-tertiary uppercase">Your Level</div>
              <div className="text-xs font-black text-gold font-mono mt-1 uppercase">
                {level}
              </div>
            </div>
          </div>
        </div>

        {/* BACK FACE OF PASSPORT (Flipped View) */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
          className="absolute inset-0 w-full h-full rounded-3xl p-5 bg-gradient-to-br from-[#1a1528] via-card-bg to-[#0d0916] border-2 border-gold/50 shadow-2xl overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute bottom-0 left-0 w-44 h-44 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between pb-2 border-b border-gold/20">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-gold" />
              <span className="text-xs font-black uppercase text-gold tracking-widest font-mono">
                Official Security & Verification
              </span>
            </div>
            <span className="text-[9px] text-text-tertiary font-mono">TAP TO RETURN</span>
          </div>

          <div className="space-y-2 py-2 text-xs">
            <div className="flex justify-between">
              <span className="text-text-tertiary">Passport Serial:</span>
              <span className="font-mono font-bold text-text-primary">{serialNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">Joined On:</span>
              <span className="font-mono font-bold text-text-primary">{commissionDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">Money Protection:</span>
              <span className="font-mono font-bold text-usdt-green">100% Safe & Protected</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">Account Status:</span>
              <span className="font-mono font-bold text-gold uppercase">Synchronized & Active</span>
            </div>
          </div>

          <div className="pt-2 border-t border-gold/20 flex items-center justify-between text-[10px] text-text-tertiary font-mono">
            <span>TITAN OPERATING SYSTEM v1.0</span>
            <span className="text-usdt-green font-bold flex items-center gap-1">
              <CheckCircle size={12} /> SECURE PASSPORT
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
