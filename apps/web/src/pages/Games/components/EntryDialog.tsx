import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, Trophy, ShieldCheck, X, AlertTriangle } from 'lucide-react';
import type { GameCatalogItem } from '../../../services/gamesService';

interface EntryDialogProps {
  game: GameCatalogItem;
  balance: number;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
  error?: string | null;
}

const difficultyLabel: Record<string, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
  EXPERT: 'Expert',
};

const difficultyColor: Record<string, string> = {
  EASY: '#00e676',
  MEDIUM: '#ffb300',
  HARD: '#ff5252',
  EXPERT: '#ff007f',
};

/**
 * Game entry dialog (Part 5). Shows cost, possible rewards, estimated
 * duration and rules. The session is only started — and crystals only
 * deducted — after the player confirms and the backend returns a session.
 */
export const EntryDialog: React.FC<EntryDialogProps> = ({ game, balance, onConfirm, onClose, loading, error }) => {
  const affordable = balance >= game.currentCost;
  const minutes = game.estimatedDurationSec >= 60 ? `${Math.round(game.estimatedDurationSec / 60)} min` : `${game.estimatedDurationSec}s`;

  return (
    <div className="fixed inset-0 z-[65] bg-[#050608]/92 backdrop-blur-xl flex items-center justify-center p-5">
      <motion.div
        initial={{ scale: 0.9, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 16, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="w-full max-w-[360px] bg-gradient-to-b from-[#1c1d29] to-[#0d0e15] border border-white/15 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
      >
        <div
          className="absolute -top-20 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-30"
          style={{ background: game.accentColor }}
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary active:scale-95 transition-transform"
        >
          <X size={16} />
        </button>

        {/* Game identity */}
        <div className="flex items-center gap-3.5 mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border shadow-lg"
            style={{ background: `${game.accentColor}1a`, borderColor: `${game.accentColor}55` }}
          >
            {game.icon}
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">{game.name}</h3>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: difficultyColor[game.difficulty] }}>
              {difficultyLabel[game.difficulty] ?? game.difficulty}
            </p>
          </div>
        </div>

        {/* Key facts */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl py-3 px-2 flex flex-col items-center">
            <Sparkles size={14} className="text-gold mb-1" />
            <span className="text-[9px] uppercase tracking-wide text-text-tertiary font-bold">Entry Cost</span>
            <span className="font-mono text-sm text-gold font-black mt-0.5">{game.currentCost} 💎</span>
          </div>
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl py-3 px-2 flex flex-col items-center">
            <Clock size={14} className="text-[#a7ffeb] mb-1" />
            <span className="text-[9px] uppercase tracking-wide text-text-tertiary font-bold">Duration</span>
            <span className="font-mono text-sm text-[#a7ffeb] font-black mt-0.5">{minutes}</span>
          </div>
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl py-3 px-2 flex flex-col items-center">
            <Trophy size={14} className="text-usdt-green mb-1" />
            <span className="text-[9px] uppercase tracking-wide text-text-tertiary font-bold">Rewards</span>
            <span className="font-mono text-sm text-usdt-green font-black mt-0.5">
              💎{game.rewardPreview.minCrystals}-{game.rewardPreview.maxCrystals}
            </span>
          </div>
        </div>

        {/* Rules */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 mb-4 max-h-[132px] overflow-y-auto no-scrollbar">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-secondary mb-2 flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-usdt-green" /> How it works
          </p>
          <ul className="flex flex-col gap-1.5">
            {(game.rules?.length ? game.rules : [
              `Entry costs ${game.currentCost} 💎 — deducted on confirmation.`,
              `Estimated play time: ${minutes}.`,
              `Rewards are computed and validated server-side.`,
              'Scores are verified by the anti-cheat engine before payouts.',
            ]).map((rule, i) => (
              <li key={i} className="text-[11px] text-text-secondary leading-snug flex gap-1.5">
                <span className="text-usdt-green shrink-0">•</span>
                {rule}
              </li>
            ))}
          </ul>
        </div>

        {/* Balance + confirm */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[11px] text-text-secondary">
            Your balance: <span className={`font-mono font-black ${affordable ? 'text-[#a7ffeb]' : 'text-error-red'}`}>{balance} 💎</span>
          </span>
          {!affordable && (
            <span className="text-[10px] text-error-red font-bold flex items-center gap-1">
              <AlertTriangle size={11} /> Insufficient
            </span>
          )}
        </div>

        {error && (
          <div className="bg-error-red/10 border border-error-red/30 rounded-xl px-3 py-2 mb-3 text-[11px] text-error-red font-semibold">{error}</div>
        )}

        <button
          onClick={onConfirm}
          disabled={loading || !affordable}
          className={`w-full py-4 rounded-xl text-sm font-extrabold tracking-wide transition-all press-feedback disabled:opacity-40 disabled:shadow-none ${
            affordable
              ? 'bg-gradient-to-r from-usdt-green to-[#00c853] text-app-bg shadow-[0_4px_20px_rgba(0,230,118,0.3)]'
              : 'bg-white/[0.05] text-text-tertiary'
          }`}
        >
          {loading ? 'Entering...' : affordable ? `Confirm Entry · ${game.currentCost} 💎` : 'Need More Crystals'}
        </button>
        <p className="text-center text-[9px] text-text-tertiary mt-2.5">
          Crystals are deducted only after the backend confirms your entry.
        </p>
      </motion.div>
    </div>
  );
};
