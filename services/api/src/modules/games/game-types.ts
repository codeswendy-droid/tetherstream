import { GameDifficulty } from '@prisma/client';

/**
 * Server-side reward configuration stored in GameCatalog.rewardConfig.
 * Administrators can tune these values through the admin API without deploys.
 */
export interface CrystalRewardBand {
  minScore: number;
  maxScore: number;
  crystals: number;
}

export interface UsdtRewardBand {
  minScore: number;
  maxScore: number;
  usdt: string;
  probability: number;
}

export interface RouletteSectorConfig {
  label: string;
  type: 'USDT' | 'CRYSTALS' | 'BOOST';
  value: number;
  weight: number;
  premium: boolean;
}

/**
 * Configurable non-currency reward grants. Administrators tune these tables in
 * GameCatalog.rewardConfig — no code changes required for balancing.
 */
export interface RewardGrantConfig {
  /** Flat XP awarded on any completed (non-voided) session */
  xpOnComplete?: number;
  /** XP awarded only for winning sessions */
  xpOnWin?: number;
  /** Seasonal event points per completed session */
  eventPointsOnComplete?: number;
  /** Probability (0..1) of earning a mystery box on a completed session */
  mysteryBoxChance?: number;
  /** Chance-based machine boost token grants (Titan hardware boosters) */
  machineBoostChance?: number;
  /** Flat achievement progress pushed to a named achievement on completion */
  achievementProgress?: Array<{ code: string; amount: number }>;
}

export interface GameRewardConfig {
  /** Hard floors/caps for anti-cheat validation */
  minDurationMs?: number;
  maxDurationMs?: number;
  minScorePerSecond?: number;
  maxScorePerSecond?: number;
  /** Crystal reward bands — score -> crystal payout */
  crystalRewards?: CrystalRewardBand[];
  /** USDT reward bands — score -> chance-based USDT reward (claim queue) */
  usdtRewards?: UsdtRewardBand[];
  /** XP per score point */
  xpPerScore?: number;
  /** True for chance-based games where the outcome is predetermined server-side */
  chanceGame?: boolean;
  /** Sector table for chance games (roulette) */
  sectors?: RouletteSectorConfig[];
  /** Score floor required to "win" the session (win streak tracking) */
  winScoreThreshold?: number;
  /** Crystal cost escalation tiers: [playsBeforeTier, costMultiplier] */
  escalationEnabled?: boolean;
  /** USDT payout cap in USDT/day for this game (economy protection) */
  dailyUsdtCap?: string;
  /** Game-specific anti-cheat bounds (per-game physics) */
  antiCheat?: {
    /** Maximum taps/events per score point (reactor: ~2 taps per point) */
    maxEventsPerScore?: number;
    /** Minimum time between skill actions (reaction-time floor in ms) */
    minEventIntervalMs?: number;
    /** Maximum score achievable per second of play (physics ceiling) */
    maxScorePerSecond?: number;
    /** Power Grid: maximum moves for the smallest board (rotations count) */
    maxMovesPerLevel?: number;
    /** Whether score must be achievable via timed puzzles (grid: solve ceiling) */
    requireScoreTelemetry?: boolean;
  };
  /** Rules shown in the entry dialog */
  rules?: string[];
  /** Non-currency reward grants (Part 7 reward types) */
  grants?: RewardGrantConfig;
  /** Per-game progress stats captured from the session summary */
  stats?: {
    trackCombo?: boolean;
    trackAccuracy?: boolean;
    trackReactionMs?: boolean;
    trackMoves?: boolean;
    trackEfficiency?: boolean;
    trackLevels?: boolean;
    trackPerfect?: boolean;
    /** Efficiency ceiling used to normalize efficiency to 0-100 */
    efficiencyCeiling?: number;
  };
}

export interface GameCatalogView {
  gameId: string;
  code: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  accentColor: string;
  crystalCost: number;
  dailyLimit: number;
  estimatedDurationSec: number;
  difficulty: GameDifficulty;
  enabled: boolean;
  rewardPreview: {
    minCrystals: number;
    maxCrystals: number;
    maxUsdt: string;
  };
  playsUsedToday: number;
  currentCost: number;
  winScoreThreshold: number;
  /** Config-driven rules shown in the entry dialog */
  rules?: string[];
  /** Per-game personal best (progression) */
  personalBest: GamePlayerStatView | null;
  /** Current leaderboard rank for this game (all-time, global) */
  leaderboardRank: number | null;
  /** Sector table for chance games — served from config so the client renders
   * exactly what the server rewards */
  sectors?: RouletteSectorConfig[];
}

export interface GameEventView {
  code: string;
  title: string;
  description: string;
  gameId: string | null;
  crystalMultiplier: number;
  usdtMultiplier: string;
  startsAt: Date;
  endsAt: Date;
  active: boolean;
}

export interface GameRewardResult {
  crystals: number;
  usdt: string | null;
  usdtRewardId: string | null;
  xp: number;
  multipliers: { crystal: number; usdt: string };
  events: string[];
  /** Non-currency grants to persist (XP, event points, boxes, boosts...) */
  grants?: RewardGrantDecision[];
}

export interface RewardGrantDecision {
  type: 'XP' | 'EVENT_POINTS' | 'MYSTERY_BOX' | 'MACHINE_BOOST' | 'ACHIEVEMENT_PROGRESS' | 'BOOST_TOKEN';
  amount: number;
  metadata?: Record<string, unknown>;
}

export interface AntiCheatVerdict {
  ok: boolean;
  status: 'COMPLETED' | 'REJECTED' | 'VOID';
  reasons: string[];
}

/** Per-game statistics submitted by the client at session end (validated) */
export interface GameSessionStats {
  combo?: number;
  accuracy?: number;
  reactionMs?: number;
  moves?: number;
  efficiency?: number;
  levelsCompleted?: number;
  perfect?: boolean;
}

export interface GamePlayerStatView {
  gameId: string;
  gamesPlayed: number;
  gamesWon: number;
  highestScore: number;
  bestCombo: number;
  bestAccuracy: number;
  bestReactionMs: number;
  bestMoves: number;
  bestTimeMs: number;
  bestEfficiency: number;
  levelsCompleted: number;
  perfectSessions: number;
  xpEarned: number;
  lastPlayedAt: Date | null;
}

export interface DailyChallengeView {
  id: string;
  code: string;
  gameId: string;
  gameName: string;
  gameIcon: string;
  title: string;
  description: string;
  objectiveType: string;
  target: number;
  rewardCrystals: number;
  rewardXp: number;
  completedToday: boolean;
  progress: number;
}
