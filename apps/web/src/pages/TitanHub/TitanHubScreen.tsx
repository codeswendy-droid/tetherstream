import type React from 'react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MiningModeToggle } from '../Mine/components/MiningModeToggle';
import { MiningSpinner } from '../Mine/components/MiningSpinner';
import { BalanceDisplay } from '../Mine/components/BalanceDisplay';
import { CoolerSlider } from '../Mine/components/CoolerSlider';
import { useMiningStore } from '../../store/useMiningStore';
import { useWalletStore } from '../../store/useWalletStore';
import { useTreasuryStore } from '../../store/useTreasuryStore';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useMachineOwnershipStore } from '../../store/useMachineOwnershipStore';
import { useTitanState, useTitanContext, useTitanActions } from '../../store/useTitanStateEngine';
import { MACHINE_CATALOG } from '../../data/machines';
import { Cpu, Zap, TrendingUp, Activity, Calendar, Sparkles, ArrowRight, Play, ShoppingCart, HelpCircle, AlertTriangle, ShieldCheck, Flame, CheckCircle, RefreshCw } from 'lucide-react';
import { MachineEducationModal } from '../../components/MachineEducationModal';
import { MachineControlCenter } from './components/MachineControlCenter';
import { MachineOwnersManualModal } from './components/MachineOwnersManualModal';
import { MachineActivationModal } from './components/MachineActivationModal';
import { MachineCertificateModal } from './components/MachineCertificateModal';
import { FleetOverviewCard } from './components/FleetOverviewCard';

export const TitanHubScreen: React.FC = () => {
  const { fetchMiningState, fetchUserMachines, baseSpeedGhs, unclaimedBalance, isMachineOwned, isOverheated, coolerMultiplier, ownedTierCodes } = useMiningStore();
  const { fetchBalanceFromEngine } = useWalletStore();
  const { events } = useTreasuryStore();
  const { openGames, openShop } = useNavigationStore();

  const { initializeDefaultCore, getRecordByTier, openOwnersManual, openCertificate } = useMachineOwnershipStore();
  
  const titanState = useTitanState();
  const titanContext = useTitanContext();
  const { updateMachineStatus, updateRewardStatus, updateSyncStatus, refreshState } = useTitanActions();
  
  const [syncStep, setSyncStep] = useState(0);
  const [isSyncing, setIsSyncing] = useState(true);
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [showShopSection, setShowShopSection] = useState(false);
  const [selectedTierCode, setSelectedTierCode] = useState<string>('TS_TRIAL');

  const syncSteps = [
    'Synchronizing Titan...',
    'Connecting Machines...',
    'Updating Earnings...',
    'Checking Rewards...',
    'Loading Events...',
    'Restoring Session...',
    'Ready.'
  ];

  useEffect(() => {
    initializeDefaultCore();

    const syncSequence = async () => {
      updateSyncStatus('SYNCING');
      
      for (let i = 0; i < syncSteps.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setSyncStep(i);
      }
      
      // Parallel backend state hydration
      await Promise.all([
        fetchMiningState(),
        fetchBalanceFromEngine(),
        fetchUserMachines(),
      ]);
      
      // Update Titan State Engine
      updateMachineStatus(
        isOverheated ? 'OVERHEATED' : 'RUNNING',
        baseSpeedGhs * 10,
        coolerMultiplier,
        isOverheated ? 85 : 45
      );
      
      updateRewardStatus(
        unclaimedBalance > 0 ? 'READY' : 'PENDING',
        unclaimedBalance,
        0
      );
      
      updateSyncStatus('COMPLETE');
      
      const hasSeen = localStorage.getItem('has_seen_machine_education_v2');
      if (!hasSeen) {
        setShowEducationModal(true);
      }
      
      setIsSyncing(false);
      refreshState();
    };

    syncSequence();
  }, [fetchMiningState, fetchBalanceFromEngine, fetchUserMachines, isOverheated, baseSpeedGhs, coolerMultiplier, unclaimedBalance, updateMachineStatus, updateRewardStatus, updateSyncStatus, refreshState, initializeDefaultCore]);

  // Set default selected tier code once owned codes loaded
  useEffect(() => {
    if (ownedTierCodes.length > 0 && !ownedTierCodes.includes(selectedTierCode)) {
      setSelectedTierCode(ownedTierCodes[0]);
    }
  }, [ownedTierCodes, selectedTierCode]);

  if (isSyncing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] gap-6 p-4 select-none">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-usdt-green to-emerald-600 border border-usdt-green/40 flex items-center justify-center shadow-2xl shadow-usdt-green/30 animate-pulse">
          <Cpu size={44} className="text-app-bg" />
        </div>
        <div className="text-center space-y-2">
          <div className="text-base font-black text-text-primary animate-pulse tracking-wide font-mono">
            {syncSteps[syncStep]}
          </div>
          <div className="flex gap-1.5 justify-center">
            {syncSteps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i <= syncStep ? 'w-5 bg-usdt-green' : 'w-1.5 bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeRecord = getRecordByTier(selectedTierCode);
  const activeCatalog = MACHINE_CATALOG.find((m) => m.tierCode.toUpperCase() === selectedTierCode.toUpperCase()) || MACHINE_CATALOG[0];

  const getMoodColor = (mood: typeof titanContext.titanMood) => {
    switch (mood) {
      case 'CRITICAL': return 'from-red-500 to-red-600 border-red-400';
      case 'WARNING': return 'from-amber-500 to-orange-500 border-amber-400';
      case 'FOCUSED': return 'from-blue-500 to-cyan-500 border-blue-400';
      case 'EXCITED': return 'from-purple-500 to-pink-500 border-purple-400';
      case 'RESTING': return 'from-usdt-green to-emerald-600 border-usdt-green';
    }
  };

  const getMoodIcon = (mood: typeof titanContext.titanMood) => {
    switch (mood) {
      case 'CRITICAL': return <AlertTriangle size={20} />;
      case 'WARNING': return <Flame size={20} />;
      case 'FOCUSED': return <Cpu size={20} />;
      case 'EXCITED': return <Sparkles size={20} />;
      case 'RESTING': return <CheckCircle size={20} />;
    }
  };

  return (
    <div className="flex flex-col min-h-full animate-fade-in pb-28 px-4 pt-2 gap-4 select-none">
      {/* SECTION 0: TITAN COMMAND BAR */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`web3-card rounded-2xl p-3.5 border relative overflow-hidden ${
          titanContext.attentionRequired ? 'border-red-500/50 shadow-red-500/20' : 'border-white/10'
        }`}
      >
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${getMoodColor(titanContext.titanMood)} rounded-full blur-3xl opacity-20`} />
        
        <div className="relative flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getMoodColor(titanContext.titanMood)} border flex items-center justify-center text-white shadow-lg shrink-0`}>
            {getMoodIcon(titanContext.titanMood)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-extrabold uppercase tracking-wider text-usdt-green mb-0.5 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-usdt-green animate-pulse" />
              Welcome Back Operator
            </div>
            <div className="text-xs font-black text-text-primary leading-tight truncate">
              {activeRecord?.nickname ? `${activeRecord.nickname} online • ${titanContext.titanMessage}` : titanContext.titanMessage}
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            <div className={`w-2 h-2 rounded-full ${
              titanState.syncStatus === 'COMPLETE' ? 'bg-usdt-green' : 'bg-amber-400 animate-pulse'
            }`} />
            <span className="text-[10px] font-mono text-text-tertiary uppercase">
              {titanState.syncStatus}
            </span>
          </div>
        </div>
      </motion.div>

      {/* SECTION 1: HERO - Centered Signature Spinner */}
      <div className="flex flex-col gap-3">
        <MiningModeToggle />
        <MiningSpinner />
        <BalanceDisplay />
      </div>

      {/* OPERATIONAL HUD TELEMETRY */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="web3-card rounded-2xl p-4 border border-white/10"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-extrabold text-text-tertiary uppercase tracking-wider flex items-center gap-2">
            <Activity size={14} className="text-ton-blue" />
            Operational Telemetry
          </h3>
          <span className="text-[10px] font-mono text-usdt-green bg-usdt-green/10 px-2 py-0.5 rounded-full border border-usdt-green/20">
            LIVE FEED
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-control-bg/50 rounded-xl p-2.5 border border-white/5">
            <div className="text-[9px] font-bold text-text-tertiary uppercase">Power</div>
            <div className="text-sm font-black text-text-primary font-mono mt-1">
              {Math.round(titanState.machinePower)} GH/s
            </div>
          </div>
          <div className="bg-control-bg/50 rounded-xl p-2.5 border border-white/5">
            <div className="text-[9px] font-bold text-text-tertiary uppercase">Efficiency</div>
            <div className="text-sm font-black text-text-primary font-mono mt-1">
              {(titanState.machineEfficiency * 100).toFixed(0)}%
            </div>
          </div>
          <div className="bg-control-bg/50 rounded-xl p-2.5 border border-white/5">
            <div className="text-[9px] font-bold text-text-tertiary uppercase">Temp</div>
            <div className={`text-sm font-black font-mono mt-1 ${
              titanState.machineTemperature > 70 ? 'text-red-400' : 'text-text-primary'
            }`}>
              {titanState.machineTemperature}°C
            </div>
          </div>
        </div>
      </motion.div>

      {/* SECTION 2: FLEET OVERVIEW & MACHINE SELECTOR */}
      <FleetOverviewCard
        onOpenShop={() => setShowShopSection(true)}
        onSelectTier={(tier) => setSelectedTierCode(tier)}
        selectedTierCode={selectedTierCode}
      />

      {/* SECTION 3: OPERATIONAL MACHINE CONTROLS */}
      <MachineControlCenter
        activeTierCode={selectedTierCode}
        onOpenShop={() => setShowShopSection(true)}
      />

      {/* QUICK ACTIONS ROW */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h3 className="text-xs font-extrabold text-text-tertiary uppercase tracking-wider mb-2.5 flex items-center gap-2">
          <Zap size={14} className="text-amber-400" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setShowShopSection(!showShopSection)}
            className="web3-card p-2.5 rounded-xl border border-white/10 flex flex-col items-center gap-1.5 hover:border-usdt-green/30 transition-colors press-feedback"
          >
            <div className="w-8 h-8 rounded-lg bg-usdt-green/10 text-usdt-green flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
            <span className="text-[10px] font-extrabold text-text-primary">Upgrade</span>
          </button>
          <button
            onClick={() => useMiningStore.getState().claimMinedYield()}
            className="web3-card p-2.5 rounded-xl border border-white/10 flex flex-col items-center gap-1.5 hover:border-gold/30 transition-colors press-feedback"
          >
            <div className="w-8 h-8 rounded-lg bg-gold/10 text-gold flex items-center justify-center">
              <Activity size={16} />
            </div>
            <span className="text-[10px] font-extrabold text-text-primary">Claim</span>
          </button>
          <button 
            onClick={() => setShowShopSection(!showShopSection)}
            className="web3-card p-2.5 rounded-xl border border-white/10 flex flex-col items-center gap-1.5 hover:border-ton-blue/30 transition-colors press-feedback"
          >
            <div className="w-8 h-8 rounded-lg bg-ton-blue/10 text-ton-blue flex items-center justify-center">
              <ShoppingCart size={16} />
            </div>
            <span className="text-[10px] font-extrabold text-text-primary">Shop</span>
          </button>
          <button
            onClick={() => openOwnersManual(selectedTierCode)}
            className="web3-card p-2.5 rounded-xl border border-white/10 flex flex-col items-center gap-1.5 hover:border-purple-400/30 transition-colors press-feedback"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <HelpCircle size={16} />
            </div>
            <span className="text-[10px] font-extrabold text-text-primary">Manual</span>
          </button>
        </div>
      </motion.div>

      {/* SHOP SECTION (Collapsible) */}
      <AnimatePresence>
        {showShopSection && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-text-tertiary uppercase tracking-wider flex items-center gap-2">
                  <ShoppingCart size={14} className="text-ton-blue" />
                  Titan Infrastructure Catalog
                </h3>
                <button
                  onClick={() => setShowEducationModal(true)}
                  className="text-[10px] font-bold text-text-tertiary hover:text-usdt-green flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded-full transition-colors"
                >
                  <HelpCircle size={11} />
                  <span>How it works</span>
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {MACHINE_CATALOG.filter((m) => m.id !== 'free-trial').slice(0, 3).map((machine) => {
                  const isOwned = isMachineOwned(machine.tierCode);

                  return (
                    <div
                      key={machine.id}
                      className={`relative rounded-2xl p-4 flex flex-col gap-3 border transition-all shadow-lg ${
                        isOwned
                          ? 'bg-gradient-to-br from-usdt-green/20 via-card-bg to-[#0d1319] border-usdt-green/40'
                          : machine.isPopular
                          ? 'bg-gradient-to-br from-usdt-green/15 via-card-bg to-[#0d1319] border-usdt-green/50'
                          : 'bg-card-bg/95 border-white/10 hover:border-usdt-green/30'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-usdt-green/20 to-ton-blue/20 border border-white/10 flex items-center justify-center text-2xl">
                            ⚡
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-extrabold text-text-primary">{machine.name}</h4>
                              {isOwned && (
                                <span className="text-[9px] font-bold text-usdt-green bg-usdt-green/20 px-2 py-0.5 rounded-full border border-usdt-green/30 uppercase">
                                  Owned
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-text-secondary mt-0.5">{machine.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black text-text-primary font-mono">₮{machine.priceUsdt}</div>
                          <div className="text-[10px] text-text-tertiary">One-time</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                        <div className="bg-white/5 rounded-lg p-2">
                          <div className="text-[9px] font-bold text-text-tertiary uppercase">Daily Yield</div>
                          <div className="text-xs font-extrabold text-usdt-green font-mono mt-0.5">
                            ₮{machine.dailyYieldUsdt.toFixed(2)}
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2">
                          <div className="text-[9px] font-bold text-text-tertiary uppercase">Power</div>
                          <div className="text-xs font-extrabold text-text-primary font-mono mt-0.5">
                            {machine.capacityGhs} GH/s
                          </div>
                        </div>
                      </div>

                      {!isOwned && (
                        <button
                          onClick={() => openShop()}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-usdt-green to-[#00c853] text-app-bg font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-usdt-green/20 press-feedback"
                        >
                          <ShoppingCart size={14} />
                          Purchase Infrastructure
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION 4: DAILY CHALLENGE */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="web3-card-gold rounded-2xl p-4 border border-gold/30 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-extrabold text-gold uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={14} />
              Daily Challenge
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              titanState.challengeStatus === 'COMPLETED' ? 'text-usdt-green bg-usdt-green/20 border border-usdt-green/30' :
              'text-gold bg-gold/20'
            }`}>
              +50 Crystals
            </span>
          </div>
          <p className="text-sm font-extrabold text-text-primary mb-3">
            Play Titan Reactor 3 times today
          </p>
          <button
            onClick={() => openGames()}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-gold to-gold-bright text-app-bg font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-gold/20 press-feedback"
          >
            <Play size={14} />
            Start Challenge
            <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>

      {/* SECTION 5: MINI GAMES LAUNCHER GRID */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h3 className="text-xs font-extrabold text-text-tertiary uppercase tracking-wider mb-2.5 flex items-center gap-2">
          <Play size={14} className="text-purple-400" />
          Mini Games
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => openGames()}
            className="web3-card p-3 rounded-xl border border-white/10 flex flex-col items-center text-center gap-1.5 hover:border-purple-400/30 transition-colors press-feedback"
          >
            <div className="text-2xl">🎰</div>
            <div className="text-xs font-extrabold text-text-primary">Roulette</div>
            <div className="text-[10px] text-text-tertiary">Win up to 100 Crystals</div>
          </button>
          <button
            onClick={() => openGames()}
            className="web3-card p-3 rounded-xl border border-white/10 flex flex-col items-center text-center gap-1.5 hover:border-purple-400/30 transition-colors press-feedback"
          >
            <div className="text-2xl">🏀</div>
            <div className="text-xs font-extrabold text-text-primary">Basketball</div>
            <div className="text-[10px] text-text-tertiary">Score shots for rewards</div>
          </button>
          <button
            onClick={() => openGames()}
            className="web3-card p-3 rounded-xl border border-white/10 flex flex-col items-center text-center gap-1.5 hover:border-purple-400/30 transition-colors press-feedback"
          >
            <div className="text-2xl">⚛️</div>
            <div className="text-xs font-extrabold text-text-primary">Titan Reactor</div>
            <div className="text-[10px] text-text-tertiary">Chain reactions</div>
          </button>
          <button
            onClick={() => openGames()}
            className="web3-card p-3 rounded-xl border border-white/10 flex flex-col items-center text-center gap-1.5 hover:border-purple-400/30 transition-colors press-feedback"
          >
            <div className="text-2xl">⚡</div>
            <div className="text-xs font-extrabold text-text-primary">Power Grid</div>
            <div className="text-[10px] text-text-tertiary">Connect the power</div>
          </button>
        </div>
      </motion.div>

      {/* SECTION 6: EVENTS */}
      {events.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-xs font-extrabold text-text-tertiary uppercase tracking-wider mb-2.5 flex items-center gap-2">
            <Calendar size={14} className="text-usdt-green" />
            Active Events
          </h3>
          <div className="flex flex-col gap-2">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="web3-card p-3 rounded-xl border border-white/10 flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-text-primary">{evt.title}</span>
                  <span className="text-[10px] text-text-tertiary">{evt.description}</span>
                </div>
                {evt.badge && (
                  <span className="text-[9px] font-bold text-usdt-green bg-usdt-green/10 border border-usdt-green/20 px-2 py-0.5 rounded-full uppercase">
                    {evt.badge}
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* SECTION 7: COOLER SLIDER */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <CoolerSlider />
      </motion.div>

      {/* MODALS */}
      <MachineOwnersManualModal />
      <MachineActivationModal />
      <MachineCertificateModal />
      <MachineEducationModal
        isOpen={showEducationModal}
        onClose={() => {
          setShowEducationModal(false);
          localStorage.setItem('has_seen_machine_education_v2', 'true');
        }}
      />
    </div>
  );
};
