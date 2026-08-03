import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusCircle,
  History,
  Clock,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
  ArrowDownLeft,
  ArrowDownToLine,
  TrendingUp,
  Cpu,
  Coins,
  CheckCircle,
  Sparkles,
  Share2,
  Trophy,
  Zap,
  X
} from 'lucide-react';
import { useWalletStore } from '../../store/useWalletStore';
import { useMiningStore } from '../../store/useMiningStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { FundingModal } from '../../components/funding/FundingModal';
import { WithdrawModal } from '../../components/funding/WithdrawModal';
import { TransactionHistoryView } from '../../components/funding/TransactionHistoryView';
import { PlatformStatistics } from '../../components/funding/PlatformStatistics';
import { SettlementTracker } from '../../components/funding/SettlementTracker';
import { useTelegram } from '../../context/TelegramContext';
import { CurrencyDisplay } from '../../components/DualCurrencyDisplay';
import { ShareCardModal } from '../../components/share/ShareCardModal';

export const WalletScreen: React.FC = () => {
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedPendingId, setSelectedPendingId] = useState<string | null>(null);

  const {
    usdtBalance,
    pendingSettlements,
    transactions,
    isLoadingBalance,
    fetchBalanceFromEngine,
    fetchSettlementHistory,
    fetchTransactions,
    lifetimeDeposits,
    lifetimeWithdrawals,
    totalRewards,
    activeMachines,
  } = useWalletStore();

  const { fetchUserMachines, hasPurchasedMachine, baseSpeedGhs, unclaimedBalance } = useMiningStore();
  const { setActiveTab: setActiveNavTab } = useNavigationStore();
  const { hapticFeedback, user } = useTelegram();

  useEffect(() => {
    fetchBalanceFromEngine();
    fetchSettlementHistory();
    fetchTransactions(5, 0);
    fetchUserMachines();
  }, [fetchBalanceFromEngine, fetchSettlementHistory, fetchTransactions, fetchUserMachines]);

  const handleRefresh = () => {
    hapticFeedback.impactOccurred('light');
    fetchBalanceFromEngine();
    fetchSettlementHistory();
    fetchTransactions(5, 0);
    fetchUserMachines();
  };

  const username = user?.first_name || 'Operator';
  const totalPowerGhs = Math.round((Number(baseSpeedGhs) || 0) * 10) || 10;
  const userRank = activeMachines > 3 ? 'Titan Master Builder' : activeMachines > 0 ? 'Titan Node Operator' : 'Starter Titan';

  const selectedPendingSession = pendingSettlements.find((s) => s.settlementId === selectedPendingId);

  return (
    <div className="w-full space-y-4 pb-20 select-none">
      
      {/* 1. TITAN IDENTITY BANNER */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-usdt-green/20 via-black to-control-bg border border-usdt-green/40 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-usdt-green/20 border border-usdt-green/40 flex items-center justify-center text-usdt-green">
            <Trophy size={24} className="text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-text-primary">{username}'s Titan Identity</span>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-usdt-green/20 text-usdt-green uppercase tracking-wide">
                {userRank}
              </span>
            </div>
            <div className="text-[11px] text-text-tertiary font-mono flex items-center gap-2 mt-0.5">
              <span><Zap size={11} className="inline text-usdt-green" /> {totalPowerGhs} GH/s</span>
              <span>•</span>
              <span><Cpu size={11} className="inline text-sky-400" /> {activeMachines} Machines</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            hapticFeedback.impactOccurred('medium');
            setIsShareModalOpen(true);
          }}
          className="press-feedback px-3 py-2 rounded-xl bg-usdt-green text-app-bg font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-usdt-green/20"
        >
          <Share2 size={14} />
          <span>Share</span>
        </button>
      </div>

      {/* 2. PROOF-OF-PROGRESS BALANCE HERO CARD */}
      <div className="glass-panel p-5 rounded-3xl relative overflow-hidden border border-white/10 shadow-2xl bg-gradient-to-br from-usdt-green/10 via-app-bg to-control-bg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-usdt-green/20 text-usdt-green flex items-center justify-center font-bold text-xs">
              ₮
            </div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-tertiary">
              Verified Available Balance
            </span>
          </div>

          <button
            onClick={handleRefresh}
            className="press-feedback p-1.5 rounded-full bg-white/5 border border-white/10 text-text-secondary hover:text-text-primary"
            title="Refresh Balance"
          >
            <RefreshCw size={14} className={isLoadingBalance ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Big Balance Number */}
        <div className="my-2">
          <div className="flex items-baseline gap-2">
            <CurrencyDisplay amount={usdtBalance} size="lg" className="text-4xl font-extrabold text-text-primary font-mono tracking-tight" />
          </div>
          <p className="text-[11px] text-text-tertiary mt-1">
            Backed 1:1 by Titan Escrow Treasury & Ledger.
          </p>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10">
          <button
            onClick={() => {
              hapticFeedback.impactOccurred('medium');
              setIsFundingModalOpen(true);
            }}
            className="press-feedback py-3 px-2 rounded-2xl bg-usdt-green text-app-bg font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-lg shadow-usdt-green/20"
          >
            <PlusCircle size={16} />
            <span>Add Money</span>
          </button>

          <button
            onClick={() => {
              hapticFeedback.impactOccurred('light');
              setIsWithdrawModalOpen(true);
            }}
            className="press-feedback py-3 px-2 rounded-2xl bg-gradient-to-r from-usdt-green to-[#00c853] text-app-bg font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-lg shadow-usdt-green/20"
          >
            <ArrowDownToLine size={16} />
            <span>Take Out</span>
          </button>

          <button
            onClick={() => {
              hapticFeedback.impactOccurred('light');
              setIsHistoryModalOpen(true);
            }}
            className="press-feedback py-3 px-2 rounded-2xl bg-control-bg/80 border border-white/10 hover:border-white/20 text-text-primary font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-sm"
          >
            <History size={16} className="text-usdt-green" />
            <span>History</span>
          </button>
        </div>
      </div>

      {/* 3. PROOF-OF-PROGRESS CATEGORIZED BREAKDOWN */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="glass-panel p-3.5 rounded-2xl border border-white/10 bg-control-bg/25 flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[10px] font-bold text-text-tertiary uppercase">
            <Coins size={12} className="text-gold" />
            <span>Claimable Output</span>
          </div>
          <CurrencyDisplay amount={unclaimedBalance} size="sm" className="text-base font-extrabold text-usdt-green" />
        </div>

        <div className="glass-panel p-3.5 rounded-2xl border border-white/10 bg-control-bg/25 flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[10px] font-bold text-text-tertiary uppercase">
            <TrendingUp size={12} className="text-usdt-green" />
            <span>Lifetime Generated</span>
          </div>
          <CurrencyDisplay amount={totalRewards} size="sm" className="text-base font-extrabold text-text-primary" />
        </div>

        <div className="glass-panel p-3.5 rounded-2xl border border-white/10 bg-control-bg/25 flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[10px] font-bold text-text-tertiary uppercase">
            <Cpu size={12} className="text-sky-400" />
            <span>Machine Output</span>
          </div>
          <span className="text-base font-extrabold text-text-primary font-mono">{activeMachines} Nodes Active</span>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl border border-white/10 bg-control-bg/25 flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[10px] font-bold text-text-tertiary uppercase">
            <ArrowDownToLine size={12} className="text-error-red" />
            <span>Total Withdrawn</span>
          </div>
          <CurrencyDisplay amount={lifetimeWithdrawals} size="sm" className="text-base font-extrabold text-text-primary" />
        </div>
      </div>

      {/* Security Guarantee banner */}
      <div className="p-3.5 rounded-2xl glass-panel border border-white/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-usdt-green/10 text-usdt-green flex items-center justify-center shrink-0">
          <ShieldCheck size={20} />
        </div>
        <div className="text-xs">
          <div className="font-extrabold text-text-primary">100% Safe & Protected Ledger</div>
          <div className="text-text-tertiary mt-0.5 text-[11px]">
            Every deposit, machine output, and withdrawal is securely audited.
          </div>
        </div>
      </div>

      {/* Platform-wide statistics */}
      <PlatformStatistics />

      {/* Transaction History Modal */}
      <AnimatePresence>
        {isHistoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md glass-panel border border-white/15 p-5 rounded-3xl shadow-2xl bg-[#0d0e15] z-10 max-h-[85vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-extrabold text-text-primary flex items-center gap-1.5">
                  <History size={16} className="text-usdt-green" />
                  Wallet History
                </h3>
                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="p-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 press-feedback"
                >
                  <X size={16} />
                </button>
              </div>
              <TransactionHistoryView onClose={() => setIsHistoryModalOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Social Share Modal */}
      <ShareCardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        userRank={userRank}
        totalPowerGhs={totalPowerGhs}
        activeMachines={activeMachines}
        lifetimeEarnings={totalRewards + usdtBalance}
        username={username}
      />

      {/* Dynamic Funding Modal */}
      <FundingModal
        isOpen={isFundingModalOpen}
        onClose={() => setIsFundingModalOpen(false)}
      />

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
      />
    </div>
  );
};
