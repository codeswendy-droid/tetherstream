import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Battery,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle2,
  Loader2,
  Sparkles,
  Package,
  Crown,
  ShieldCheck,
  Award,
  ChevronRight,
  Check
} from 'lucide-react';
import { useCapacityStore, type CapacityOpportunity, type CapacityLevel } from '../../../store/useCapacityStore';
import { useMiningStore } from '../../../store/useMiningStore';
import { useNavigationStore } from '../../../store/useNavigationStore';
import { showToast } from '../../../components/Toast';
import { RewardQueue } from '../../../components/rewards/RewardQueue';

export const CapacityEngine: React.FC = () => {
  const { setActiveTab } = useNavigationStore();
  const { baseSpeedGhs } = useMiningStore();
  const {
    currentCapacity,
    todayCapacityEarned,
    capacityLevel,
    dailyCycleStatus,
    consecutiveDays,
    opportunities,
    earningMultiplier,
    referralMultiplier,
    withdrawalLimit,
    activateDailyCycle,
    addCapacity,
    claimSettlement,
    purchaseCapacityBoost,
    purchaseCapacityPack,
    purchaseReferralAccelerator,
  } = useCapacityStore();

  const effectiveCapacity = Math.max(currentCapacity, Math.round((Number(baseSpeedGhs) || 1.0) * 10));

  const [isProcessing, setIsProcessing] = useState(false);

  const handleActivateCycle = () => {
    setIsProcessing(true);
    setTimeout(() => {
      activateDailyCycle();
      setIsProcessing(false);
      showToast('Daily Rewards activated! +10 Growth Points earned.', 'success');
    }, 800);
  };

  const handleClaimSettlement = () => {
    setIsProcessing(true);
    setTimeout(() => {
      claimSettlement();
      setIsProcessing(false);
      showToast('Daily growth rewards collected! Your financial balance is updated.', 'success');
    }, 800);
  };

  const handleOpportunity = (opportunity: CapacityOpportunity) => {
    if (opportunity.isPaid && opportunity.price) {
      // Handle paid opportunities
      switch (opportunity.source) {
        case 'CAPACITY_BOOST':
          purchaseCapacityBoost(opportunity.reward, opportunity.price);
          showToast(`Growth Boost purchased! +${opportunity.reward} points for 24h.`, 'success');
          setActiveTab('boost');
          break;
        case 'CAPACITY_PACK':
          purchaseCapacityPack(opportunity.reward, opportunity.price);
          showToast(`Growth Pack purchased! +${opportunity.reward} permanent points.`, 'success');
          setActiveTab('boost');
          break;
        case 'REFERRAL_ACCELERATOR':
          purchaseReferralAccelerator(7, opportunity.price);
          showToast(`Friend Accelerator activated! 7-day reward multiplier.`, 'success');
          setActiveTab('friends');
          break;
        default:
          setActiveTab('boost');
          break;
      }
    } else {
      // Handle free opportunities — navigate to required action screen
      switch (opportunity.source) {
        case 'DEPOSIT':
          showToast('Opening Wallet to add money...', 'info');
          setActiveTab('wallet');
          break;
        case 'REFERRAL_SIGNUP':
          showToast('Opening Friends tab to invite friends...', 'info');
          setActiveTab('friends');
          break;
        case 'CONSECUTIVE_DAYS':
        case 'DAILY_LOGIN':
        case 'MINING_ACTIVE':
          addCapacity(opportunity.source, opportunity.reward, opportunity.description);
          showToast(`+${opportunity.reward} Growth Points earned!`, 'success');
          setActiveTab('mine');
          break;
        default:
          addCapacity(opportunity.source, opportunity.reward, opportunity.description);
          showToast(`+${opportunity.reward} Growth Points earned!`, 'success');
          setActiveTab('mine');
      }
    }
  };

  const getLevelIcon = (level: CapacityLevel) => {
    switch (level) {
      case 'SEED': return '🌱';
      case 'BUILDER': return '🔨';
      case 'OPERATOR': return '⚙️';
      case 'PARTNER': return '🤝';
      case 'ELITE': return '💎';
      case 'TITAN': return '🏆';
      case 'INSTITUTIONAL': return '🏛️';
      default: return '🌱';
    }
  };

  const getLevelColor = (level: CapacityLevel) => {
    switch (level) {
      case 'SEED': return 'text-green-400';
      case 'BUILDER': return 'text-blue-400';
      case 'OPERATOR': return 'text-purple-400';
      case 'PARTNER': return 'text-yellow-400';
      case 'ELITE': return 'text-pink-400';
      case 'TITAN': return 'text-orange-400';
      case 'INSTITUTIONAL': return 'text-cyan-400';
      default: return 'text-green-400';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Daily Reward Engine Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="web3-card rounded-2xl p-4 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-usdt-green/5 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
          <div className="flex items-center gap-1.5">
            <Battery size={16} className="text-usdt-green" />
            <h2 className="text-xs font-black uppercase text-text-primary tracking-widest">DAILY REWARD ENGINE</h2>
          </div>
          <div className={`text-[10px] font-bold uppercase bg-control-bg px-2.5 py-0.5 rounded-full border border-white/5 font-mono ${
            dailyCycleStatus === 'SETTLEMENT_CLAIMED' ? 'text-usdt-green' : 'text-text-secondary'
          }`}>
            {dailyCycleStatus === 'SETTLEMENT_CLAIMED' ? 'Done for Today' : dailyCycleStatus === 'ACTIVATED' ? 'Active' : 'Ready'}
          </div>
        </div>

        {/* Growth Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-control-bg/30 p-3 rounded-xl border border-white/5">
            <div className="text-[10px] text-text-secondary font-bold">Growth Score</div>
            <div className="text-lg font-black text-text-primary font-mono mt-1">
              {effectiveCapacity.toLocaleString()}
            </div>
            <div className="text-[8px] text-usdt-green mt-0.5 font-mono">
              +{todayCapacityEarned} Points Today
            </div>
          </div>

          <div className="bg-control-bg/30 p-3 rounded-xl border border-white/5">
            <div className="text-[10px] text-text-secondary font-bold">Current Tier</div>
            <div className="text-lg font-black text-text-primary mt-1 flex items-center gap-1">
              <span>{getLevelIcon(capacityLevel)}</span>
              <span className={getLevelColor(capacityLevel)}>{capacityLevel}</span>
            </div>
            <div className="text-[8px] text-usdt-green font-mono font-bold mt-0.5">
              Next Unlock: Builder II
            </div>
          </div>
        </div>

        {/* Benefits Display */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 bg-usdt-green/10 border border-usdt-green/20 rounded-xl p-2 text-center">
            <div className="text-[9px] text-usdt-green font-bold uppercase">Reward Multiplier</div>
            <div className="text-sm font-black text-usdt-green font-mono">{earningMultiplier}×</div>
          </div>
          <div className="flex-1 bg-purple-500/10 border border-purple-500/20 rounded-xl p-2 text-center">
            <div className="text-[9px] text-purple-400 font-bold uppercase">Referral Bonus</div>
            <div className="text-sm font-black text-purple-400 font-mono">{referralMultiplier}×</div>
          </div>
          <div className="flex-1 bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-2 text-center">
            <div className="text-[9px] text-cyan-400 font-bold uppercase">Withdrawal Access</div>
            <div className="text-sm font-black text-cyan-400 font-mono">${withdrawalLimit}</div>
          </div>
        </div>

        {/* Dynamic Action Area */}
        <div className="bg-control-bg/25 border border-white/5 rounded-2xl p-4">
          {dailyCycleStatus === 'NOT_ACTIVATED' && (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-400 flex items-center justify-center mx-auto mb-3 animate-pulse">
                <Award size={24} />
              </div>
              <h3 className="text-sm font-extrabold text-text-primary">Daily Mining Challenge</h3>
              <p className="text-xs text-text-secondary mt-1 max-w-[90%] mx-auto">
                Complete today's mining challenge to earn bonus speed boost!
              </p>
              <div className="mt-3 bg-control-bg/30 rounded-xl p-3 border border-white/5">
                <div className="flex items-center justify-between text-[10px] font-bold text-text-secondary mb-1">
                  <span>Today's Target</span>
                  <span className="text-purple-400">50 Taps</span>
                </div>
                <div className="w-full h-2 bg-control-bg rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: '0%' }} />
                </div>
                <div className="mt-2 flex items-center justify-center gap-1 text-[9px] text-purple-400 font-mono">
                  <Sparkles size={8} /> Reward: +2x Speed Boost for 1 Hour
                </div>
              </div>
              <button
                disabled={isProcessing}
                onClick={() => {
                  setIsProcessing(true);
                  setTimeout(() => {
                    activateDailyCycle();
                    setIsProcessing(false);
                    showToast('Daily Challenge started! Go to Mining to complete your taps.', 'success');
                    setActiveTab('hub');
                  }, 800);
                }}
                className="press-feedback bg-gradient-to-r from-purple-500 to-pink-500 text-app-bg font-extrabold text-xs px-6 py-3 rounded-xl shadow-lg mt-4 w-full flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Starting...
                  </>
                ) : (
                  <>
                    <Zap size={14} /> Start Challenge
                  </>
                )}
              </button>
            </div>
          )}

          {dailyCycleStatus === 'ACTIVATED' && (
            <div className="text-center py-2">
              <h3 className="text-sm font-extrabold text-text-primary">Complete Today's Missions</h3>
              <p className="text-xs text-text-secondary mt-1">
                Complete simple tasks below to boost your growth velocity.
              </p>
            </div>
          )}

          {dailyCycleStatus === 'CAPACITY_EARNED' && (
            <div className="text-center py-2">
              <div className="w-10 h-10 rounded-full bg-usdt-green/10 text-usdt-green flex items-center justify-center mx-auto mb-2">
                <TrendingUp size={20} />
              </div>
              <h3 className="text-sm font-extrabold text-text-primary">Claim Today's Opportunities</h3>
              <p className="text-xs text-text-secondary mt-1">
                You've earned +{todayCapacityEarned} Growth Points today! Collect your rewards to boost your tier.
              </p>
              <button
                disabled={isProcessing}
                onClick={handleClaimSettlement}
                className="press-feedback bg-gradient-to-r from-usdt-green to-[#00c853] text-app-bg font-extrabold text-xs px-6 py-3 rounded-xl shadow-lg mt-4 w-full flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(0,230,118,0.2)]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Collecting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} /> Collect Rewards
                  </>
                )}
              </button>
            </div>
          )}

          {dailyCycleStatus === 'SETTLEMENT_CLAIMED' && (
            <div className="text-center py-2">
              <div className="w-10 h-10 rounded-full bg-text-secondary/10 text-text-secondary flex items-center justify-center mx-auto mb-2">
                <Clock size={20} />
              </div>
              <h3 className="text-sm font-extrabold text-text-primary">Today's Growth Complete</h3>
              <p className="text-xs text-text-secondary mt-1">
                Come back tomorrow to start your next growth cycle!
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* NEW SECTION: AVAILABLE REWARDS — real claim queue from the Rewards Engine */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <RewardQueue />
      </motion.div>

      {/* Growth Opportunities & Tasks */}
      {dailyCycleStatus !== 'NOT_ACTIVATED' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase text-text-secondary tracking-widest">Daily Rewards & Tasks</h2>
            <span className="text-[10px] text-text-tertiary font-mono">
              {opportunities.filter(o => o.isAvailable).length} Available
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {opportunities.map((opportunity) => (
              <div
                key={opportunity.id}
                className={`
                  rounded-2xl p-4 flex items-center justify-between transition-all shadow-md
                  ${opportunity.isPaid 
                    ? 'web3-card-gold hover:border-gold/30' 
                    : 'web3-card hover:border-white/15'
                  }
                  ${!opportunity.isAvailable ? 'opacity-50' : ''}
                `}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-control-bg border border-white/5 flex items-center justify-center text-lg flex-shrink-0">
                    {opportunity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-extrabold text-text-primary truncate">
                        {opportunity.title}
                      </h3>
                      {opportunity.isPaid && (
                        <span className="text-[8px] font-bold bg-gold/10 border border-gold/30 text-gold px-1.5 py-0.5 rounded-full flex-shrink-0">
                          <Crown size={8} className="inline mr-0.5" /> BOOST
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-secondary truncate">{opportunity.description}</p>
                    {opportunity.progress !== undefined && opportunity.target && (
                      <div className="mt-1.5">
                        <div className="flex justify-between text-[9px] text-text-tertiary font-mono mb-0.5">
                          <span>Progress</span>
                          <span>{opportunity.progress}/{opportunity.target}</span>
                        </div>
                        <div className="w-full h-1 bg-control-bg rounded-full overflow-hidden">
                          <div
                            className="h-full bg-usdt-green rounded-full transition-all"
                            style={{ width: `${(opportunity.progress / opportunity.target) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 ml-3 flex-shrink-0">
                  <div className="text-right">
                    {opportunity.isPaid && opportunity.price ? (
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-black text-gold font-mono">${(Number(opportunity.price) || 0).toFixed(2)}</span>
                        <span className="text-[9px] text-text-tertiary">+{opportunity.reward} Points</span>
                      </div>
                    ) : (
                      <span className="text-xs font-mono font-black text-usdt-green bg-usdt-green/10 border border-usdt-green/20 px-2 py-0.5 rounded-full">
                        +{opportunity.reward}
                      </span>
                    )}
                  </div>

                  <button
                    disabled={!opportunity.isAvailable}
                    onClick={() => handleOpportunity(opportunity)}
                    className={`
                      press-feedback font-extrabold text-[10px] px-3 py-1.5 rounded-lg border transition-all flex items-center gap-0.5
                      ${opportunity.isPaid
                        ? 'bg-gold text-app-bg border-gold hover:brightness-110'
                        : 'bg-control-bg border-white/10 text-text-primary hover:border-usdt-green/30'
                      }
                      ${!opportunity.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {opportunity.isPaid ? <Package size={10} /> : <Sparkles size={10} />}
                    {opportunity.isPaid ? 'Buy' : 'Claim'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* TITAN BENEFITS */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="web3-card rounded-2xl p-4 relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
          <div className="flex items-center gap-1.5">
            <Crown size={16} className="text-gold" />
            <h2 className="text-xs font-black uppercase text-text-primary tracking-widest">TITAN BENEFITS</h2>
          </div>
          <span className={`text-[10px] font-bold uppercase bg-control-bg px-2.5 py-0.5 rounded-full border border-white/5 font-mono ${getLevelColor(capacityLevel)}`}>
            {capacityLevel}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary">Reward Multiplier</span>
            <span className={`font-black font-mono ${getLevelColor(capacityLevel)}`}>{earningMultiplier}×</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary">Referral Bonus</span>
            <span className={`font-black font-mono ${getLevelColor(capacityLevel)}`}>{referralMultiplier}×</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary">Withdrawal Access</span>
            <span className={`font-black font-mono ${getLevelColor(capacityLevel)}`}>${withdrawalLimit}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5">
            <div className="text-[10px] text-text-tertiary leading-relaxed">
              Unlock higher tiers by building trust. Higher levels provide improved multipliers and increased limits.
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

