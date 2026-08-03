import { create } from 'zustand';
import { growthService, type RewardQueueItem, type RewardHistoryItem, type ClaimResult } from '../services/growthService';

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
  queue: RewardQueueItem[];
  history: RewardHistoryItem[];
  isLoading: boolean;
  isClaiming: boolean;
  claimingId: string | null;
  error: string | null;

  fetchQueue: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  fetchAll: () => Promise<void>;
  claimReward: (id: string) => Promise<{ success: boolean; error?: string; reward?: ClaimResult['reward'] }>;
  refreshAfterClaim: (claimedId: string) => void;
  reset: () => void;
}

export const useRewardQueueStore = create<RewardQueueState>((set, get) => ({
  queue: [],
  history: [],
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

  fetchHistory: async () => {
    try {
      const history = await growthService.getRewardHistory();
      set({ history });
    } catch (err: any) {
      console.warn('Failed to load reward history:', err?.message);
    }
  },

  fetchAll: async () => {
    await Promise.all([get().fetchQueue(), get().fetchHistory()]);
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

  refreshAfterClaim: async (claimedId) => {
    set((state) => ({
      queue: state.queue.filter((r) => r.id !== claimedId),
      history: [],
    }));
    await Promise.all([get().fetchQueue(), get().fetchHistory()]);
  },

  reset: () => set({ queue: [], history: [], isLoading: false, isClaiming: false, claimingId: null, error: null }),
}));
