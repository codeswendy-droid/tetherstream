import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Gift, Loader2, Users, Trophy, PartyPopper, Megaphone, ChevronRight } from 'lucide-react';
import { useRewardQueueStore } from '../../store/useRewardQueueStore';
import { useWalletStore } from '../../store/useWalletStore';
import type { RewardQueueItem } from '../../services/growthService';
import { ClaimFlowModal } from './ClaimFlowModal';
import { ClaimSuccessModal } from './ClaimSuccessModal';

export const REWARD_TYPE_META: Record<string, { icon: string; color: string }> = {
  REFERRAL: { icon: '👥', color: 'text-sky-400' },
  MILESTONE: { icon: '🏆', color: 'text-amber-400' },
  LOYALTY: { icon: '🎁', color: 'text-purple-400' },
  CAMPAIGN: { icon: '📣', color: 'text-pink-400' },
};

const getTypeMeta = (type: string) => REWARD_TYPE_META[type] || REWARD_TYPE_META.MILESTONE;

interface RewardQueueProps {
  compact?: boolean;
}

export const RewardQueue: React.FC<RewardQueueProps> = ({ compact = false }) => {
  const { queue, isLoading, fetchAll } = useRewardQueueStore();
  const [selected, setSelected] = useState<RewardQueueItem | null>(null);
  const [claimed, setClaimed] = useState<RewardQueueItem | null>(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleClaimSuccess = (reward: RewardQueueItem) => {
    setSelected(null);
    setClaimed(reward);
    useWalletStore.getState().fetchBalanceFromEngine();
  };

  return (
    <>
      <div className="web3-card rounded-2xl p-4 relative overflow-hidden space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-1.5">
            <Gift size={16} className="text-usdt-green" />
            <h2 className="text-xs font-black uppercase text-text-primary tracking-widest">AVAILABLE REWARDS</h2>
          </div>
          <span className="text-[10px] font-mono font-bold text-usdt-green bg-usdt-green/10 border border-usdt-green/20 px-2 py-0.5 rounded-full">
            {isLoading ? 'Syncing…' : `${queue.length} Reward${queue.length === 1 ? '' : 's'}`}
          </span>
        </div>

        {isLoading && queue.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-6 text-text-tertiary text-xs">
            <Loader2 size={14} className="animate-spin" />
            <span>Loading claim queue…</span>
          </div>
        ) : queue.length === 0 ? (
          <div className="text-center py-6 px-4">
            <div className="text-2xl mb-2">🏗️</div>
            <div className="text-xs font-bold text-text-primary">No rewards available right now</div>
            <div className="text-[10px] text-text-tertiary mt-1 leading-relaxed">
              Complete settlements, refer friends or complete campaigns — eligible rewards appear here automatically.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <AnimatePresence mode="popLayout">
              {queue.map((reward, idx) => (
                <motion.div
                  key={reward.id}
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96, height: 0, marginTop: 0, marginBottom: 0, overflow: 'hidden', transition: { duration: 0.22, ease: 'easeInOut' } }}
                  transition={{ duration: 0.28, delay: compact ? 0 : idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className={`bg-control-bg/40 border p-3 rounded-2xl relative overflow-hidden flex flex-col justify-between ${
                    reward.status === 'CLAIM_PENDING' ? 'border-amber-500/30' : 'border-usdt-green/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">{getTypeMeta(reward.rewardType).icon}</span>
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        reward.status === 'CLAIM_PENDING'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-usdt-green/20 text-usdt-green border-usdt-green/30'
                      }`}
                    >
                      {reward.status === 'CLAIM_PENDING' ? 'Processing' : 'Unlocked'}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-black text-text-primary">{reward.ruleName || 'Reward'}</div>
                    <div className="text-[10px] text-text-secondary mt-0.5 line-clamp-2">{reward.description}</div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-black text-usdt-green">
                      +{Number(reward.amount)?.toFixed(2)} {reward.assetCode}
                    </span>
                    {reward.requirement && !reward.requirement.completed && (
                      <span className="text-[9px] text-text-tertiary font-mono">
                        {reward.requirement.current}/{reward.requirement.required}
                      </span>
                    )}
                  </div>

                  {reward.requirement && !reward.requirement.completed && (
                    <div className="mt-1.5 w-full h-1 bg-control-bg rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-usdt-green rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (reward.requirement.current / Math.max(1, reward.requirement.required)) * 100)}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                  )}

                  <button
                    disabled={reward.status === 'CLAIM_PENDING'}
                    onClick={() => setSelected(reward)}
                    className={`mt-2.5 w-full py-1.5 rounded-xl text-[10px] font-extrabold press-feedback shadow-sm flex items-center justify-center gap-1 ${
                      reward.status === 'CLAIM_PENDING'
                        ? 'bg-control-bg/40 text-text-tertiary cursor-not-allowed'
                        : 'bg-usdt-green text-app-bg hover:brightness-110'
                    }`}
                  >
                    {reward.status === 'CLAIM_PENDING' ? (
                      <>
                        <Loader2 size={10} className="animate-spin" /> Processing…
                      </>
                    ) : (
                      <>
                        Claim <ChevronRight size={10} />
                      </>
                    )}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ClaimFlowModal
        reward={selected}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        onClaimed={handleClaimSuccess}
      />

      <ClaimSuccessModal
        reward={claimed}
        isOpen={!!claimed}
        onClose={() => setClaimed(null)}
      />
    </>
  );
};
