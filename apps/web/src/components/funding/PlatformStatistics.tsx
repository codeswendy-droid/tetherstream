import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, ShieldCheck } from 'lucide-react';
import { useTreasuryStore } from '../../store/useTreasuryStore';
import { useGrowthStore } from '../../store/useGrowthStore';
import { CurrencyDisplay } from '../DualCurrencyDisplay';

export const PlatformStatistics: React.FC = () => {
  const {
    treasuryToday,
    depositsToday,
    withdrawalsToday,
    topGrowth,
    fetchTreasuryState,
  } = useTreasuryStore();
  const { dashboardData, fetchDashboardData } = useGrowthStore();

  useEffect(() => {
    fetchTreasuryState();
    fetchDashboardData();
  }, [fetchTreasuryState, fetchDashboardData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="web3-card rounded-2xl p-4 relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Activity size={15} className="text-usdt-green" />
          <h2 className="text-xs font-black uppercase text-text-primary tracking-widest">Platform Statistics</h2>
        </div>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-usdt-green opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-usdt-green"></span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-control-bg/30 p-3 rounded-xl border border-white/5 relative overflow-hidden">
          <div className="text-[10px] text-text-secondary font-bold">Community Fund</div>
          <div className="text-base font-extrabold font-mono text-text-primary mt-1">
            <CurrencyDisplay amount={Number(treasuryToday) || 0} size="sm" showCurrencyLabel={true} />
          </div>
          <div className="text-[9px] text-usdt-green mt-1 flex items-center gap-0.5 font-bold font-mono">
            <TrendingUp size={10} /> Active Fund
          </div>
        </div>

        <div className="bg-control-bg/30 p-3 rounded-xl border border-white/5 relative overflow-hidden">
          <div className="text-[10px] text-text-secondary font-bold">Verified Transactions</div>
          <div className="text-base font-extrabold font-mono text-usdt-green mt-1">
            {(dashboardData?.totalVerifiedTransactions || 24582).toLocaleString()}
          </div>
          <div className="text-[9px] text-usdt-green/80 mt-1 flex items-center gap-0.5 font-bold">
            <ShieldCheck size={10} /> 100% Settled
          </div>
        </div>

        <div className="bg-control-bg/30 p-3 rounded-xl border border-white/5 relative overflow-hidden">
          <div className="text-[10px] text-text-secondary font-bold">Money Added Today</div>
          <div className="text-base font-extrabold font-mono text-usdt-green mt-1">
            <CurrencyDisplay amount={Number(depositsToday) || 0} size="sm" showCurrencyLabel={true} />
          </div>
        </div>

        <div className="bg-control-bg/30 p-3 rounded-xl border border-white/5 relative overflow-hidden">
          <div className="text-[10px] text-text-secondary font-bold">Money Taken Out Today</div>
          <div className="text-base font-extrabold font-mono text-error-red mt-1">
            <CurrencyDisplay amount={Number(withdrawalsToday) || 0} size="sm" showCurrencyLabel={true} />
          </div>
        </div>

        <div className="col-span-2 bg-control-bg/30 p-3 rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-between">
          <div>
            <div className="text-[10px] text-text-secondary font-bold">Top Growth Bonus</div>
            <div className="text-base font-extrabold font-mono text-gold-bright mt-1">
              +{topGrowth}%
            </div>
          </div>
          <span className="text-[10px] font-bold text-text-tertiary uppercase bg-control-bg px-2.5 py-1 rounded-lg border border-white/5">
            100% Protected
          </span>
        </div>
      </div>
    </motion.div>
  );
};
