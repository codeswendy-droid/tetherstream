import type React from 'react';
import { motion } from 'framer-motion';
import { Zap, Flame, Award, ChevronRight } from 'lucide-react';
import { useMiningStore } from '../../../store/useMiningStore';
import { CurrencyDisplay } from '../../../components/DualCurrencyDisplay';

export const TapProgressBar: React.FC = () => {
  const { sessionTapCount, unclaimedBalance, boostMultiplier } = useMiningStore();

  // Tap progress milestone cap (100 taps per bonus session cycle)
  const maxSessionTaps = 100;
  const progressPercent = Math.min(100, Math.round((sessionTapCount / maxSessionTaps) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="web3-card rounded-2xl p-3.5 border border-usdt-green/30 relative overflow-hidden bg-gradient-to-r from-card-bg via-[#0c141c] to-card-bg shadow-md"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-usdt-green/15 border border-usdt-green/30 text-usdt-green flex items-center justify-center font-bold">
            <Zap size={14} className={sessionTapCount > 0 ? 'animate-pulse' : ''} />
          </div>
          <div>
            <div className="text-xs font-black text-text-primary flex items-center gap-1.5">
              <span>Interactive Boost Progress</span>
              {boostMultiplier > 1 && (
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono border border-amber-500/30">
                  {boostMultiplier.toFixed(1)}x SPEED
                </span>
              )}
            </div>
            <div className="text-[10px] text-text-tertiary">
              {sessionTapCount} / {maxSessionTaps} Taps Completed
            </div>
          </div>
        </div>

        <span className="text-xs font-mono font-black text-usdt-green">
          {progressPercent}%
        </span>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2.5 bg-control-bg rounded-full overflow-hidden p-0.5 border border-white/5 relative">
        <motion.div
          className="h-full bg-gradient-to-r from-usdt-green to-emerald-400 rounded-full shadow-[0_0_8px_rgba(0,230,118,0.4)]"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>

      <div className="flex justify-between items-center text-[9px] font-mono text-text-tertiary mt-1.5">
        <span>TAP SPINNER TO BOOST OUTPUT</span>
        <span className="text-usdt-green font-bold flex items-center gap-0.5">
          <span>ACTIVE BONUS</span>
          <ChevronRight size={10} />
        </span>
      </div>
    </motion.div>
  );
};
