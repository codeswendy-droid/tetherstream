import { api } from './api';

// ─── Admin Games API (GAME_MANAGE permission) ────────────────────────────────

export interface AdminGameView {
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
  difficulty: string;
  enabled: boolean;
  rewardConfig: unknown;
  updatedAt: string;
}

export interface AdminChallengeView {
  id: string;
  code: string;
  gameId: string;
  title: string;
  description: string;
  objectiveType: string;
  target: number;
  rewardCrystals: number;
  rewardXp: number;
  enabled: boolean;
}

export interface AdminGrantView {
  id: string;
  telegramUserId: string;
  gameId: string;
  sessionId: string;
  type: string;
  amount: string;
  reference: string;
  createdAt: string;
}

export interface AdminSessionView {
  id: string;
  telegramUserId: string;
  gameId: string;
  status: string;
  score: number;
  crystalCost: number;
  crystalsEarned: number;
  usdtEarned: string | null;
  durationMs: number;
  createdAt: string;
}

export interface AdminChallengeCompletionView {
  id: string;
  telegramUserId: string;
  challengeId: string;
  challengeDay: number;
  rewardCrystals: number;
  rewardXp: number;
  completedAt: string;
}

export const gameAdminService = {
  async getCatalog(): Promise<AdminGameView[]> {
    const res = await api.get('/admin/games/catalog');
    return res.data?.data ?? res.data ?? [];
  },

  async upsertGame(dto: Record<string, unknown>): Promise<AdminGameView> {
    const res = await api.post('/admin/games/catalog', dto);
    return res.data?.data ?? res.data;
  },

  async patchGame(gameId: string, dto: Record<string, unknown>): Promise<AdminGameView> {
    const res = await api.patch(`/admin/games/catalog/${gameId}`, dto);
    return res.data?.data ?? res.data;
  },

  async getEvents(): Promise<Array<Record<string, unknown>>> {
    const res = await api.get('/admin/games/events');
    return res.data?.items ?? res.data?.data?.items ?? [];
  },

  async upsertEvent(dto: Record<string, unknown>): Promise<unknown> {
    const res = await api.post('/admin/games/events', dto);
    return res.data?.data ?? res.data;
  },

  async deleteEvent(code: string): Promise<unknown> {
    const res = await api.delete(`/admin/games/events/${code}`);
    return res.data;
  },

  async getChallenges(): Promise<AdminChallengeView[]> {
    const res = await api.get('/admin/games/challenges');
    return res.data?.items ?? res.data?.data?.items ?? [];
  },

  async upsertChallenge(dto: Record<string, unknown>): Promise<AdminChallengeView> {
    const res = await api.post('/admin/games/challenges', dto);
    return res.data?.data ?? res.data;
  },

  async deleteChallenge(id: string): Promise<unknown> {
    const res = await api.delete(`/admin/games/challenges/${id}`);
    return res.data;
  },

  async getChallengeCompletions(limit = 50): Promise<AdminChallengeCompletionView[]> {
    const res = await api.get('/admin/games/challenges/completions', { params: { limit } });
    return res.data?.items ?? res.data?.data?.items ?? [];
  },

  async getGrants(limit = 100, type?: string): Promise<AdminGrantView[]> {
    const res = await api.get('/admin/games/grants', { params: { limit, type } });
    return res.data?.data ?? res.data ?? [];
  },

  async getSessions(params: { gameId?: string; status?: string; limit?: number } = {}): Promise<AdminSessionView[]> {
    const res = await api.get('/admin/games/sessions', { params });
    return res.data?.data ?? res.data ?? [];
  },

  async getLeaderboard(gameId?: string, period: 'daily' | 'weekly' | 'all' = 'daily') {
    const res = await api.get('/admin/games/leaderboard', { params: { gameId, period } });
    return res.data?.data ?? res.data;
  },
};
