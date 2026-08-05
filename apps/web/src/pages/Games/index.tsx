import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Sparkles,
  Trophy,
  Calendar,
  Users,
  Globe,
  Zap,
  X,
  Clock,
  Target,
  TrendingUp,
  Crown,
  Award,
  ShieldCheck,
  Gauge,
} from 'lucide-react';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useGameStore } from '../../store/useGameStore';
import { useWalletStore } from '../../store/useWalletStore';
import { useQuestStore } from '../../store/useQuestStore';
import { gamesService, type GameCatalogItem, type GameEndResult, type GameStartSession } from '../../services/gamesService';
import { showToast } from '../../components/Toast';
import { RouletteGame } from './components/RouletteGame';
import { BasketballGame } from './components/BasketballGame';
import { MemoryMatrixGame } from './components/MemoryMatrixGame';
import { TitanReactor } from './components/TitanReactor';
import { PowerGrid } from './components/PowerGrid';
import { EntryDialog } from './components/EntryDialog';
import { AnimatedCounter } from './components/AnimatedCounter';

type Period = 'daily' | 'weekly' | 'all';
type Scope = 'global' | 'friends';

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

const categoryLabel: Record<string, string> = {
  chance: '🎰 Chance',
  skill: '🎯 Skill',
  puzzle: '🧩 Puzzle',
};

const countryFlag = (code?: string | null) => {
  if (!code || code.length !== 2) return null;
  const a = code.charCodeAt(0);
  const b = code.charCodeAt(1);
  if (a < 65 || a > 90 || b < 65 || b > 90) return null;
  return String.fromCodePoint(0x1f1e6 + a - 65, 0x1f1e6 + b - 65);
};

export const GamesScreen: React.FC = () => {
  const { closeGames } = useNavigationStore();
  const store = useGameStore();
  const wallet = useWalletStore();
  const { incrementProgress, incrementCategoryProgress } = useQuestStore();

  const [activeGame, setActiveGame] = useState<GameCatalogItem | null>(null);
  const [pendingEntry, setPendingEntry] = useState<GameCatalogItem | null>(null);
  const [session, setSession] = useState<GameStartSession | null>(null);
  const [starting, setStarting] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);
  const [result, setResult] = useState<GameEndResult | null>(null);
  const [period, setPeriod] = useState<Period>('daily');
  const [scope, setScope] = useState<Scope>('global');

  useEffect(() => {
    store.loadHub();
    store.loadLeaderboard({ period, scope });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeGame) return;
    store.loadLeaderboard({ gameId: activeGame.gameId, period, scope });
  }, [period, scope, activeGame?.gameId]);

  // ── Entry flow: dialog → confirm → backend start → launch ─────────────────
  const handleConfirmEntry = async (game: GameCatalogItem) => {
    if (starting) return;
    setStarting(true);
    setEntryError(null);
    try {
      const started = await gamesService.startSession(game.gameId);
      setPendingEntry(null);
      setSession(started);
      setActiveGame(game);
      store.refreshBalance();
      wallet.updateBalance({ crystalsBalance: wallet.crystalsBalance - started.crystalCost });
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || err?.message || 'Could not start the game.';
      setEntryError(message);
    } finally {
      setStarting(false);
    }
  };

  const handleGameComplete = (endResult: GameEndResult) => {
    setSession(null);
    setResult(endResult);
    if (endResult.levelUp) {
      showToast(`Level Up! You reached level ${endResult.levelUp.to} ⚡`, 'success');
    }
    if (activeGame) {
      store.refreshBalance();
      store.loadHub();
      store.loadLeaderboard({ gameId: activeGame.gameId, period, scope });
      incrementCategoryProgress('Games', 1);
      if (activeGame.code === 'ROULETTE') {
        incrementProgress('q19', 1);
        incrementProgress('q20', 1);
      } else if (activeGame.code === 'HOOPS') {
        incrementProgress('q21', 1);
      }
    }
  };

  const handleClaimDaily = async () => {
    const result = await store.claimDailyLogin();
    if (result) {
      showToast(`+${result.amount} 💎 daily crystals claimed! (Day ${result.dailyStreak})`, 'success');
    } else {
      showToast(store.error ?? 'Daily crystals already claimed today.', 'info');
    }
  };

  const activeEvents = useMemo(() => store.events.filter((e) => e.active), [store.events]);
  const challenge = store.dailyChallenge;

  const playFromChallenge = () => {
    const game = store.games.find((g) => g.gameId === challenge?.gameId);
    if (game) setPendingEntry(game);
  };

  const gameComponent = (game: GameCatalogItem) => {
    const props = {
      session: session!,
      onClose: () => {
        setActiveGame(null);
        setSession(null);
      },
      onComplete: handleGameComplete,
    };
    switch (game.gameId) {
      case 'crypto-roulette':
        return <RouletteGame {...props} sectors={game.sectors ?? []} />;
      case 'hoop-masters':
        return <BasketballGame {...props} />;
      case 'memory-matrix':
        return <MemoryMatrixGame {...props} />;
      case 'titan-core-reactor':
        return <TitanReactor {...props} />;
      case 'power-grid':
        return <PowerGrid {...props} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 bg-app-bg text-text-primary flex flex-col p-4 overflow-y-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4 pt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={closeGames}
            className="press-feedback p-2.5 rounded-full glass-panel text-text-secondary hover:text-text-primary shadow-md"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-title text-text-primary font-extrabold tracking-tight">Mini-Games</h1>
            <p className="text-[10px] text-text-secondary -mt-0.5">Skill, strategy &amp; rewards</p>
          </div>
        </div>
        {/* Crystal balance chip — always visible */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-[#a7ffeb]/10 to-white/[0.03] border border-[#a7ffeb]/25 rounded-full px-4 py-2 shadow-lg">
          <Sparkles size={14} className="text-[#a7ffeb]" />
          <span className="font-mono font-extrabold text-[#a7ffeb]">{store.balance ?? wallet.crystalsBalance}</span>
          <span className="text-[10px] uppercase tracking-wider text-text-secondary">💎</span>
        </div>
      </div>

      {/* Daily login card */}
      <div className="glass-panel border border-white/10 rounded-2xl p-4 mb-4 flex items-center justify-between shadow-xl relative overflow-hidden">
        <div className="absolute -right-6 -top-8 w-28 h-28 rounded-full bg-gold/10 blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gold/15 text-gold border border-gold/30 flex items-center justify-center shadow-[0_0_15px_rgba(255,179,0,0.2)]">
            <Calendar size={22} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-text-primary">
              Daily Login {store.dailyLogin?.dailyStreak ? `· Day ${store.dailyLogin.dailyStreak} 🔥` : ''}
            </h3>
            <p className="text-[11px] text-text-secondary mt-0.5">
              {store.dailyLogin?.claimedToday
                ? 'Claimed today — come back tomorrow!'
                : `Claim +${store.dailyLogin?.totalReward ?? 10} 💎 today${
                    store.dailyLogin?.machineBonus ? ` (incl. ${store.dailyLogin.machineBonus} machine bonus)` : ''
                  }`}
            </p>
          </div>
        </div>
        <button
          onClick={handleClaimDaily}
          disabled={store.dailyLogin?.claimedToday}
          className={`press-feedback text-xs font-extrabold px-4 py-2.5 rounded-xl border shadow-md ${
            store.dailyLogin?.claimedToday
              ? 'bg-white/[0.03] text-text-tertiary border-white/5'
              : 'bg-gradient-to-r from-gold to-[#ff9100] text-app-bg border-gold/40 shadow-[0_4px_16px_rgba(255,179,0,0.3)]'
          }`}
        >
          {store.dailyLogin?.claimedToday ? 'Claimed ✓' : 'Claim'}
        </button>
      </div>

      {/* Active events banner */}
      {activeEvents.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
          {activeEvents.map((event) => (
            <div
              key={event.code}
              className="shrink-0 flex items-center gap-2 bg-gradient-to-r from-[#d4af37]/15 to-white/[0.03] border border-[#d4af37]/35 rounded-xl px-3 py-2 shadow-lg"
            >
              <Zap size={14} className="text-gold" />
              <div>
                <p className="text-[11px] font-extrabold text-gold">{event.title}</p>
                <p className="text-[9px] text-text-secondary">
                  {event.crystalMultiplier > 1 ? `${event.crystalMultiplier}x crystals ` : ''}
                  {parseFloat(event.usdtMultiplier) > 1 ? `${event.usdtMultiplier}x USDT` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Daily challenge hero */}
      {challenge && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-4 rounded-2xl p-4 overflow-hidden border border-[#d4af37]/30 shadow-[0_0_24px_rgba(212,175,55,0.08)] bg-gradient-to-r from-[#2a2413] to-[#1a1608]"
        >
          <div className="absolute -right-8 -top-10 w-36 h-36 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center">
                <Target size={17} className="text-gold" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gold/80">Daily Challenge</p>
                <h3 className="text-sm font-extrabold text-white leading-tight">{challenge.title}</h3>
              </div>
            </div>
            {challenge.completedToday && (
              <span className="text-[10px] font-black bg-usdt-green/15 text-usdt-green border border-usdt-green/40 px-2.5 py-1 rounded-full uppercase tracking-wide">
                Done ✓
              </span>
            )}
          </div>
          <p className="text-[11px] text-text-secondary mb-3">{challenge.description}</p>

          {/* Progress */}
          <div className="bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 mb-3">
            <div className="flex items-center justify-between text-[10px] mb-1.5">
              <span className="font-mono text-text-secondary">
                {Math.min(Math.round(challenge.progress * challenge.target), challenge.target)} / {challenge.target}
              </span>
              <span className="font-black text-gold">
                {challenge.rewardCrystals > 0 ? `+${challenge.rewardCrystals} 💎` : ''}
                {challenge.rewardXp > 0 ? `${challenge.rewardXp > 0 && challenge.rewardCrystals > 0 ? ' · ' : ''}⚡ +${challenge.rewardXp} XP` : ''}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(challenge.progress * 100, 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-gold to-[#ff9100] shadow-[0_0_10px_rgba(255,179,0,0.5)]"
              />
            </div>
          </div>

          <button
            onClick={playFromChallenge}
            disabled={challenge.completedToday}
            className={`w-full py-3 rounded-xl text-xs font-extrabold tracking-wide press-feedback ${
              challenge.completedToday
                ? 'bg-white/[0.04] text-text-tertiary border border-white/5'
                : 'bg-gradient-to-r from-gold to-[#ff9100] text-app-bg shadow-[0_4px_18px_rgba(255,179,0,0.25)]'
            }`}
          >
            {challenge.completedToday ? 'Challenge Completed' : `Play ${challenge.gameName} to earn it →`}
          </button>
        </motion.div>
      )}

      {/* Games list */}
      <div className="flex flex-col gap-4 mb-6">
        {store.games.map((game) => {
          const remaining = Math.max(0, game.dailyLimit - game.playsUsedToday);
          const minutes = game.estimatedDurationSec >= 60 ? `${Math.round(game.estimatedDurationSec / 60)} min` : `${game.estimatedDurationSec}s`;
          return (
            <motion.div
              key={game.gameId}
              whileHover={{ scale: 1.01 }}
              className="glass-panel border border-white/10 hover:border-white/25 rounded-2xl p-5 flex flex-col gap-4 shadow-xl relative overflow-hidden"
            >
              <div
                className="absolute inset-x-0 top-0 h-12 blur-xl pointer-events-none opacity-30 overflow-hidden rounded-t-2xl"
                style={{ background: game.accentColor }}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border shadow-[0_0_15px_rgba(255,255,255,0.08)]"
                    style={{ background: `${game.accentColor}1a`, borderColor: `${game.accentColor}55` }}
                  >
                    {game.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-text-primary">{game.name}</h3>
                    <p className="text-xs text-text-secondary mt-0.5 max-w-[220px]">{game.description}</p>
                  </div>
                </div>
                <span
                  className="text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border"
                  style={{ color: difficultyColor[game.difficulty] ?? game.accentColor, background: `${game.accentColor}1a`, borderColor: `${game.accentColor}44` }}
                >
                  {difficultyLabel[game.difficulty] ?? game.difficulty}
                </span>
              </div>

              {/* Meta chips: category · est. time · rank */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-text-secondary">
                  {categoryLabel[game.category] ?? game.category}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-text-secondary">
                  <Clock size={10} /> {minutes}
                </span>
                {game.leaderboardRank != null && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-gold/10 border border-gold/30 text-gold">
                    <Crown size={10} /> #{game.leaderboardRank} global
                  </span>
                )}
                {game.personalBest && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-[#a7ffeb]/10 border border-[#a7ffeb]/30 text-[#a7ffeb]">
                    <TrendingUp size={10} /> PB {game.personalBest.highestScore}
                  </span>
                )}
              </div>

              {/* Economy strip: cost · plays left · rewards */}
              <div className="bg-control-bg/80 p-3 rounded-xl flex items-center justify-between text-xs font-mono border border-white/5 shadow-inner">
                <span className="text-gold font-bold">💎 {game.currentCost} entry</span>
                <span className="text-text-secondary">{remaining}/{game.dailyLimit} plays left</span>
                <span className="text-[#a7ffeb] font-bold">
                  💎{game.rewardPreview.minCrystals}-{game.rewardPreview.maxCrystals}
                </span>
                {parseFloat(game.rewardPreview.maxUsdt) > 0 && (
                  <span className="text-usdt-green font-bold">₮ up to {game.rewardPreview.maxUsdt}</span>
                )}
              </div>

              <button
                onClick={() => setPendingEntry(game)}
                disabled={starting || remaining <= 0}
                className="press-feedback bg-gradient-to-r from-usdt-green to-[#00c853] text-app-bg font-extrabold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,230,118,0.25)] disabled:opacity-40 disabled:shadow-none"
              >
                <Sparkles size={16} />
                {starting ? 'Starting...' : remaining <= 0 ? 'Daily limit reached' : `Play · ${game.currentCost} 💎`}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Leaderboard */}
      <div className="glass-panel border border-white/10 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold text-text-primary flex items-center gap-2">
            <Trophy size={16} className="text-gold" /> Leaderboard
          </h3>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setScope('global')}
              className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
                scope === 'global' ? 'bg-usdt-green/15 text-usdt-green border-usdt-green/40' : 'bg-white/[0.03] text-text-secondary border-white/10'
              }`}
            >
              <Globe size={11} /> Global
            </button>
            <button
              onClick={() => setScope('friends')}
              className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
                scope === 'friends' ? 'bg-usdt-green/15 text-usdt-green border-usdt-green/40' : 'bg-white/[0.03] text-text-secondary border-white/10'
              }`}
            >
              <Users size={11} /> Friends
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 mb-3">
          {(['daily', 'weekly', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 text-[10px] font-extrabold uppercase tracking-wide py-2 rounded-lg border transition-colors ${
                period === p ? 'bg-gold/15 text-gold border-gold/40' : 'bg-white/[0.03] text-text-secondary border-white/10'
              }`}
            >
              {p === 'all' ? 'All-Time' : p}
            </button>
          ))}
        </div>

        {store.isLoadingLeaderboard ? (
          <div className="py-6 text-center text-xs text-text-secondary">Loading leaderboard...</div>
        ) : !store.leaderboard || store.leaderboard.entries.length === 0 ? (
          <div className="py-6 text-center text-xs text-text-secondary">No ranked plays yet — be the first!</div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {store.leaderboard.entries.slice(0, 10).map((entry) => {
              const flag = countryFlag(entry.country);
              return (
                <div
                  key={`${entry.telegramUserId}-${entry.rank}`}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs ${
                    entry.telegramUserId === String(store.profile?.telegramUserId ?? '')
                      ? 'bg-usdt-green/10 border-usdt-green/40'
                      : 'bg-white/[0.02] border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`font-black w-5 text-center ${entry.rank <= 3 ? 'text-gold' : 'text-text-secondary'}`}>
                      {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                    </span>
                    <span className="font-bold text-text-primary truncate">
                      {flag && <span className="mr-1">{flag}</span>}
                      {entry.displayName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono shrink-0">
                    <span className="text-[#a7ffeb] font-bold">💎 {entry.crystalsEarned}</span>
                    <span className="text-text-secondary">{entry.score} pts</span>
                  </div>
                </div>
              );
            })}
            {store.leaderboard.myRank && store.leaderboard.myRank > 10 && (
              <div className="text-center text-[10px] text-text-secondary mt-1">Your rank: #{store.leaderboard.myRank}</div>
            )}
          </div>
        )}
      </div>

      {/* Entry dialog */}
      <AnimatePresence>
        {pendingEntry && (
          <EntryDialog
            game={pendingEntry}
            balance={store.balance ?? wallet.crystalsBalance}
            loading={starting}
            error={entryError}
            onClose={() => {
              setPendingEntry(null);
              setEntryError(null);
            }}
            onConfirm={() => handleConfirmEntry(pendingEntry)}
          />
        )}
      </AnimatePresence>

      {/* Active game overlay */}
      {activeGame && session && (
        <div className="fixed inset-0 z-[60] left-1/2 -translate-x-1/2 w-full max-w-[480px] h-full bg-black">
          {gameComponent(activeGame)}
        </div>
      )}

      {/* Result modal */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-[#050608]/95 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-[340px] bg-gradient-to-b from-[#1c1d29] to-[#0d0e15] border border-white/15 rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl max-h-[88vh] overflow-y-auto no-scrollbar"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 border relative"
                style={{
                  background: `${result.verdict.ok ? '#00e676' : '#f44336'}1a`,
                  borderColor: `${result.verdict.ok ? '#00e676' : '#f44336'}44`,
                }}
              >
                {result.verdict.ok ? '🎉' : '🛡️'}
                {result.isNewPersonalBest && result.verdict.ok && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
                    className="absolute -top-2 -right-3 text-lg"
                  >
                    🏆
                  </motion.span>
                )}
              </div>

              <h3 className="text-xl font-black text-white uppercase tracking-wide">
                {result.verdict.ok ? (result.isNewPersonalBest ? 'NEW PERSONAL BEST!' : 'REWARD EARNED') : 'VOIDED'}
              </h3>
              <p className="text-xs text-text-secondary mt-1 mb-4">{result.message}</p>

              {result.verdict.ok && (
                <>
                  {/* Score + crystals animated */}
                  <div className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 mb-4 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-secondary">Final score</span>
                      <AnimatedCounter value={result.score} suffix=" pts" className="text-sm text-white" />
                    </div>
                    {result.crystalsEarned > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-secondary">Crystals</span>
                        <AnimatedCounter value={result.crystalsEarned} prefix="+" suffix=" 💎" className="text-base text-[#a7ffeb]" />
                      </div>
                    )}
                    {result.usdtEarned && parseFloat(result.usdtEarned) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-secondary">USDT</span>
                        <AnimatedCounter
                          value={parseFloat(result.usdtEarned)}
                          prefix="+₮"
                          suffix=""
                          duration={1100}
                          className="text-base text-usdt-green"
                        />
                      </div>
                    )}
                    {result.xpEarned > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-secondary">Experience</span>
                        <AnimatedCounter value={result.xpEarned} prefix="+⚡" className="text-sm text-gold" />
                      </div>
                    )}
                    {result.levelUp && (
                      <div className="flex items-center justify-center gap-1.5 bg-gold/10 border border-gold/30 rounded-xl px-3 py-2 text-[11px] font-black text-gold animate-pulse">
                        <Gauge size={13} /> LEVEL UP — {result.levelUp.from} → {result.levelUp.to}
                      </div>
                    )}
                    {result.grantCount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-secondary">Bonus grants</span>
                        <span className="text-[11px] font-black text-[#b388ff]">×{result.grantCount} claimed</span>
                      </div>
                    )}
                  </div>

                  {/* Daily challenge completion */}
                  {result.challenge?.completed && (
                    <div className="w-full mb-3 bg-gradient-to-r from-[#d4af37]/15 to-[#ff9100]/10 border border-[#d4af37]/35 rounded-2xl px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target size={15} className="text-gold" />
                        <span className="text-[11px] font-bold text-gold">Daily Challenge cleared!</span>
                      </div>
                      <span className="font-mono text-[11px] font-black text-gold">
                        +{result.challenge.rewardCrystals} 💎 +{result.challenge.rewardXp}⚡
                      </span>
                    </div>
                  )}

                  {/* Achievements */}
                  {result.unlockedAchievements.length > 0 && (
                    <div className="w-full mb-4 flex flex-col gap-1.5">
                      {result.unlockedAchievements.map((a) => (
                        <div key={a.code} className="flex items-center gap-2 bg-[#b388ff]/10 border border-[#b388ff]/30 rounded-xl px-3 py-2">
                          <Award size={14} className="text-[#b388ff] shrink-0" />
                          <span className="text-[11px] font-bold text-text-primary flex-1 text-left">
                            Achievement unlocked: {a.name}
                          </span>
                          <span className="text-[9px] font-black uppercase text-[#b388ff]">{a.tier}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {!result.verdict.ok && result.verdict.reasons.length > 0 && (
                <div className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 mb-4">
                  <p className="text-[10px] text-text-tertiary font-mono break-words">
                    <ShieldCheck size={11} className="inline mr-1 text-error-red" />
                    {result.verdict.reasons.join(', ')}
                  </p>
                </div>
              )}

              {result.usdtEarned && parseFloat(result.usdtEarned) > 0 && (
                <p className="text-[10px] text-text-tertiary mb-4 border-t border-white/5 pt-3 w-full">
                  Claim from your rewards queue — payouts are validated and posted by the Rewards Engine.
                </p>
              )}

              <button
                onClick={() => setResult(null)}
                className="w-full py-4 btn-glossy-primary rounded-xl text-sm font-bold tracking-wider"
              >
                AWESOME
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close helper for session-less state */}
      {activeGame && !session && !result && (
        <button
          onClick={() => setActiveGame(null)}
          className="fixed top-4 right-4 z-[70] w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
};
