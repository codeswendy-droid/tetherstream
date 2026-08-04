import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusCircle,
  History,
  ShieldCheck,
  ChevronRight,
  ArrowDownLeft,
  TrendingUp,
  Cpu,
  Coins,
  CheckCircle,
  Zap,
  ArrowUpRight,
  Lock,
  PieChart,
  HelpCircle,
} from 'lucide-react';
import { useWalletStore } from '../../store/useWalletStore';
import { useMiningStore } from '../../store/useMiningStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { FundingModal } from '../../components/funding/FundingModal';
import { WithdrawModal } from '../../components/funding/WithdrawModal';
import { TransactionHistoryView } from '../../components/funding/TransactionHistoryView';
import { CurrencyDisplay } from '../../components/DualCurrencyDisplay';
import { EmptyState } from '../../components/EmptyState';
import { useTelegram } from '../../context/TelegramContext';

export const WalletScreen: React.FC = () => {
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

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
    activeMachines,
  } = useWalletStore();

  const { fetchUserMachines, baseSpeedGhs, unclaimedBalance } = useMiningStore();
  const { setActiveTab } = useNavigationStore();
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
  const totalAssetsUsdt = usdtBalance + unclaimedBalance;

  return (
    <div className="w-full space-y-5 p-4 pb-28 select-none bg-[#07090e] min-h-full">
      {/* DESTINATION HEADER — Calm, Professional Financial Banking Feel */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-usdt-green font-mono">
            Financial Center
          </span>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">Portfolio</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-text-tertiary hover:text-text-primary transition-colors"
            title="Refresh balance"
          >
            <ShieldCheck size={18} className="text-usdt-green" />
          </button>
        </div>
      </div>

      {/* HERO SECTION — Total Portfolio & Financial Assets (60% Focal Point) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-5 bg-gradient-to-br from-[#0c141d] via-card-bg to-[#07090e] border border-usdt-green/30 relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-usdt-green/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col gap-1 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-tertiary">
              Total Account Net Worth
            </span>
            <span className="text-[10px] font-mono font-bold text-usdt-green bg-usdt-green/10 px-2 py-0.5 rounded-full border border-usdt-green/20">
              VERIFIED LEDGER
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-text-primary font-mono tracking-tight">
              ₮{totalAssetsUsdt.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-text-secondary">USDT</span>
          </div>
          <div className="text-xs text-text-tertiary font-mono">
            <CurrencyDisplay amountUsdt={totalAssetsUsdt} />
          </div>
        </div>

        {/* Assets Breakdown Grid */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <div className="flex items-center justify-between text-[10px] text-text-tertiary uppercase font-extrabold mb-1">
              <span>Available</span>
              <Coins size={12} className="text-usdt-green" />
            </div>
            <div className="text-base font-black text-usdt-green font-mono">
              ₮{usdtBalance.toFixed(2)}
            </div>
            <div className="text-[9px] text-text-tertiary">Liquid Wallet</div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <div className="flex items-center justify-between text-[10px] text-text-tertiary uppercase font-extrabold mb-1">
              <span>Unclaimed Yield</span>
              <Lock size={12} className="text-amber-400" />
            </div>
            <div className="text-base font-black text-amber-400 font-mono">
              ₮{unclaimedBalance.toFixed(2)}
            </div>
            <div className="text-[9px] text-text-tertiary">Accumulating in Hub</div>
          </div>
        </div>

        {/* PRIMARY ACTION BUTTONS */}
        <div className="grid grid-cols-2 gap-2.5 mt-4">
          <button
            onClick={() => setIsFundingModalOpen(true)}
            className="py-3 rounded-2xl bg-usdt-green text-app-bg font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-usdt-green/20 press-feedback"
          >
            <PlusCircle size={16} />
            <span>Deposit Funds</span>
          </button>

          <button
            onClick={() => setIsWithdrawModalOpen(true)}
            className="py-3 rounded-2xl bg-white/10 border border-white/15 text-text-primary font-black text-xs flex items-center justify-center gap-2 hover:bg-white/15 transition-colors press-feedback"
          >
            <ArrowDownLeft size={16} />
            <span>Withdraw Money</span>
          </button>
        </div>
      </motion.div>

      {/* CROSS-PAGE CONTINUITY BANNER (No Dead Ends) */}
      {unclaimedBalance > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setActiveTab('hub')}
          className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between cursor-pointer hover:border-amber-500/50 transition-colors press-feedback"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Zap size={16} />
            </div>
            <div>
              <div className="text-xs font-black text-text-primary">
                ₮{unclaimedBalance.toFixed(2)} Mined Yield Ready
              </div>
              <div className="text-[10px] text-text-secondary">
                Your Titan node is active. Tap to claim in Titan Hub.
              </div>
            </div>
          </div>
          <ChevronRight size={16} className="text-amber-400" />
        </motion.div>
      )}

      {/* SUPPORTING SECTION — Portfolio Analytics & Income History (30%) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-text-tertiary flex items-center gap-2">
            <PieChart size={14} className="text-usdt-green" />
            Financial Activity & Settlements
          </h2>
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="text-[10px] font-extrabold text-usdt-green hover:underline flex items-center gap-1"
          >
            <History size={12} />
            <span>Full Ledger</span>
          </button>
        </div>

        {transactions.length > 0 ? (
          <div className="web3-card rounded-2xl divide-y divide-white/5 border border-white/10 overflow-hidden">
            {transactions.slice(0, 4).map((tx) => (
              <div key={tx.id} className="p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                    tx.type === 'DEPOSIT' ? 'bg-usdt-green/10 text-usdt-green' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {tx.type === 'DEPOSIT' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  </div>
                  <div>
                    <div className="font-extrabold text-text-primary">{tx.type}</div>
                    <div className="text-[10px] text-text-tertiary font-mono">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className={`font-black ${tx.type === 'DEPOSIT' ? 'text-usdt-green' : 'text-text-primary'}`}>
                    {tx.type === 'DEPOSIT' ? '+' : '-'}₮{Number(tx.amountUsdt).toFixed(2)}
                  </div>
                  <div className="text-[9px] text-text-tertiary uppercase">{tx.status}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<History size={20} />}
            title="No Financial Transactions Yet"
            description="Your deposit and withdrawal history will appear here once you make your first financial transaction."
            actionLabel="Deposit Money"
            onAction={() => setIsFundingModalOpen(true)}
            accentColor="green"
          />
        )}
      </div>

      {/* DISCOVERY & GUARANTEE SECTION (10%) */}
      <div className="web3-card rounded-2xl p-4 border border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-usdt-green/10 border border-usdt-green/20 text-usdt-green flex items-center justify-center shrink-0">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h3 className="text-xs font-black text-text-primary">100% Reserve & Ledger Audited</h3>
          <p className="text-[10px] text-text-secondary leading-relaxed">
            All user USDT and Mobile Money balances are fully collateralized and backed 1:1 on-chain.
          </p>
        </div>
      </div>

      {/* MODALS */}
      <FundingModal
        isOpen={isFundingModalOpen}
        onClose={() => setIsFundingModalOpen(false)}
      />
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
      />
      {isHistoryModalOpen && (
        <TransactionHistoryView onClose={() => setIsHistoryModalOpen(false)} />
      )}
    </div>
  );
};
