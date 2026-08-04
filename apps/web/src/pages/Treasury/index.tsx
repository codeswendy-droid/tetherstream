import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Info, History } from 'lucide-react';
import { useTreasuryStore } from '../../store/useTreasuryStore';
import { useGrowthStore } from '../../store/useGrowthStore';
import { CapacityEngine } from './components/CapacityEngine';
import { HeroProgress } from '../../components/rewards/HeroProgress';
import { AchievementsCabinet } from '../../components/rewards/AchievementsCabinet';
import { RewardHistorySection } from '../../components/rewards/RewardHistorySection';
export const TreasuryScreen: React.FC = () => {
  const { fetchDashboardData } = useGrowthStore();
  const {
    seasonNumber,
    seasonTitle,
    daysRemaining,
    seasonTargetPower,
    seasonProgressPower,
    resetSeason,
  } = useTreasuryStore();

  useEffect(() => {
    useTreasuryStore.getState().fetchTreasuryState();
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="p-4 flex flex-col gap-5 select-none relative pb-10">
      {/* 1. HERO PROGRESS — level, streak, totals, next best action */}
      <HeroProgress />

      {/* 2. DAILY CAPACITY ENGINE (hosts the mission queue) */}
      <CapacityEngine />

      {/* 3. ACHIEVEMENTS CABINET */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <AchievementsCabinet />
      </motion.div>

      {/* 4. SEASONS PROGRESS */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="web3-card-gold rounded-2xl p-4 relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
          <div className="flex items-center gap-1.5">
            <Calendar size={16} className="text-gold" />
            <h2 className="text-xs font-black uppercase text-text-primary tracking-widest">Current Season {seasonNumber}</h2>
          </div>
          <span className="text-[10px] font-bold text-gold bg-gold/10 border border-gold/20 px-2.5 py-0.5 rounded-full font-mono">
            {seasonTitle}
          </span>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="flex justify-between items-center text-xs">
            <div>
              <div className="text-text-secondary">Season Progress</div>
              <div className="text-sm font-black text-text-primary font-mono mt-1">
                {seasonProgressPower.toLocaleString()} / {seasonTargetPower.toLocaleString()} Growth Points
              </div>
            </div>
            <div className="text-right">
              <div className="text-text-secondary">Time Remaining</div>
              <div className="text-sm font-black text-text-primary font-mono mt-1">
                {daysRemaining} Days
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2.5 bg-control-bg rounded-full overflow-hidden p-0.5 border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-gold to-gold-bright rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(255,179,0,0.4)]"
              style={{ width: `${seasonTargetPower > 0 ? (seasonProgressPower / seasonTargetPower) * 100 : 0}%` }}
            />
          </div>

          <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 rounded-xl p-3 text-xs text-text-secondary">
            <Info size={15} className="text-gold flex-shrink-0" />
            <span>
              All your levels and trust scores carry over to the next season automatically.
            </span>
          </div>

          {seasonProgressPower >= seasonTargetPower ? (
            <button
              onClick={resetSeason}
              className="press-feedback bg-gradient-to-r from-gold to-gold-bright text-app-bg font-extrabold text-xs py-3 rounded-xl shadow-lg w-full flex items-center justify-center gap-1 shadow-gold/25"
            >
              Start Season {seasonNumber + 1}
            </button>
          ) : (
            <button
              disabled
              className="bg-control-bg/40 text-text-tertiary font-extrabold text-xs py-3 rounded-xl border border-white/5 w-full cursor-not-allowed text-center uppercase tracking-wider"
            >
              Reach {seasonTargetPower.toLocaleString()} Growth Points for Season Reward
            </button>
          )}
        </div>
      </motion.div>

      {/* 5. COMPLETED REWARDS — real claim history */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col gap-3"
      >
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-black uppercase text-text-secondary tracking-widest flex items-center gap-1.5">
            <History size={13} className="text-usdt-green" /> Completed Rewards
          </h2>
        </div>
        <RewardHistorySection />
      </motion.div>
    </div>
  );
};
