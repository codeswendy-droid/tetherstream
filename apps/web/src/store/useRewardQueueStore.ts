import { create } from 'zustand';
import {
  growthService,
  type MissionItem,
  type RewardHistoryItem,
  type ClaimResult,
  type ProgressOverview,
  type AchievementItem,
} from '../services/growthService';

export const REWARD_ERROR_MESSAGES: Record<string, string> = {
  REWARD_NOT_FOUND: 'This reward no longer exists.',
  REWARD_FORBIDDEN: 'This reward belongs to another account.',
  REWARD_ALREADY_CLAIMED: 'This reward has already been claimed.',
  REWARD_EXPIRED: 'This reward has expired and is no longer available.',
  REWARD_CLAIM_IN_PROGRESS: 'This reward is already being processed. Please wait.',
  REWARD_NOT_CLAIMABLE: 'This reward cannot be claimed right now.',
  REWARD_RULE_DISABLED: 'This reward campaign is no longer active.',
  REWARD_REQUIREMENTS_INCOMPLETE: 'Your requirements are not complete yet.',
  REWARD_CLAIM_FAILED: 'Claim failed. Please try again.',
  INTERNAL_ERROR: 'Network error. Please check your connection and try again.',
};

interface RewardQueueState {
  queue: MissionItem[];
  missions: MissionItem[];
  history: RewardHistoryItem[];
  progress: ProgressOverview | null;
  achievements: AchievementItem[];
  totalAchievementsUnlocked: number;
  totalAchievements: number;
  isLoading: boolean;
  isClaiming: boolean;
  claimingId: string | null;
  error: string | null;

  fetchQueue: () => Promise<void>;
  fetchMissions: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  fetchProgress: () => Promise<void>;
  fetchAchievements: () => Promise<void>;
  fetchAll: () => Promise<void>;
  claimReward: (id: string) => Promise<{ success: boolean; error?: string; reward?: ClaimResult['reward'] }>;
  autoClaim: (id: string) => Promise<{ success: boolean; error?: string; reward?: ClaimResult['reward'] }>;
  refreshAfterClaim: (claimedId: string) => Promise<void>;
  reset: () => void;
}

export const useRewardQueueStore = create<RewardQueueState>((set, get) => ({
  queue: [],
  missions: [],
  history: [],
  progress: null,
  achievements: [],
  totalAchievementsUnlocked: 0,
  totalAchievements: 0,
  isLoading: false,
  isClaiming: false,
  claimingId: null,
  error: null,

  fetchQueue: async () => {
    set({ isLoading: true, error: null });
    try {
      const queue = await growthService.getAvailableRewards();
      set({ queue, isLoading: false });
    } catch (err: any) {
      console.warn('Failed to load reward queue:', err?.message);
      set({ isLoading: false });
    }
  },

  fetchMissions: async () => {
    try {
      const missions = await growthService.getMissions();
      set({ missions });
    } catch (err: any) {
      console.warn('Failed to load mission queue:', err?.message);
    }
  },

  fetchHistory: async () => {
    try {
      const history = await growthService.getRewardHistory();
      set({ history });
    } catch (err: any) {
      console.warn('Failed to load reward history:', err?.message);
    }
  },

  fetchProgress: async () => {
    try {
      const progress = await growthService.getProgressOverview();
      set({ progress });
    } catch (err: any) {
      console.warn('Failed to load progress overview:', err?.message);
    }
  },

  fetchAchievements: async () => {
    try {
      const { achievements, totalUnlocked, total } = await growthService.getAchievements();
      set({ achievements, totalAchievementsUnlocked: totalUnlocked, totalAchievements: total });
    } catch (err: any) {
      console.warn('Failed to load achievements:', err?.message);
    }
  },

  fetchAll: async () => {
    await Promise.all([
      get().fetchMissions(),
      get().fetchHistory(),
      get().fetchProgress(),
      get().fetchAchievements(),
    ]);
  },

  claimReward: async (id) => {
    set({ isClaiming: true, claimingId: id, error: null });
    try {
      const result = await growthService.claimReward(id);
      set({ isClaiming: false, claimingId: null });
      return { success: true, reward: result.reward };
    } catch (err: any) {
      const apiError = err?.response?.data?.error;
      const code: string = apiError?.code || '';
      const message = apiError?.message || REWARD_ERROR_MESSAGES.INTERNAL_ERROR;
      set({ isClaiming: false, claimingId: null, error: message });
      return { success: false, error: REWARD_ERROR_MESSAGES[code] || message };
    }
  },

  autoClaim: async (id) => {
    const result = await get().claimReward(id);
    if (result.success) {
      await get().refreshAfterClaim(id);
    }
    return result;
  },

  refreshAfterClaim: async (claimedId) => {
    set((state) => ({
      queue: state.queue.filter((r) => r.id !== claimedId),
      history: [],
    }));
    await Promise.all([get().fetchMissions(), get().fetchHistory(), get().fetchProgress(), get().fetchAchievements()]);
  },

  reset: () =>
    set({
      queue: [],
      missions: [],
      history: [],
      progress: null,
      achievements: [],
      totalAchievementsUnlocked: 0,
      totalAchievements: 0,
      isLoading: false,
      isClaiming: false,
      claimingId: null,
      error: null,
    }),
}));
