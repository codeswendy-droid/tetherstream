import { api } from './api';

export interface MachineTier {
  tierCode: string;
  name: string;
  priceUsdt: number;
  capacityGhs: number;
  powerRatingW: number;
  description: string;
  dailyYieldEstimateUsdt: number;
  isPopular?: boolean;
}

export interface UserMachineAsset {
  id: string;
  telegramUserId: string;
  tierCode: string;
  name: string;
  purchasePrice: number;
  currency: string;
  status: 'CREATED' | 'PENDING_PAYMENT' | 'ACTIVE' | 'PAUSED' | 'MAINTENANCE' | 'RETIRED';
  capacityGhs: number;
  lifetimeEarnings: number;
  purchasedAt: string;
  activatedAt: string;
}

export interface PurchaseMachineResult {
  success: boolean;
  requiresFunding: boolean;
  missingAmountUsdt?: number;
  paymentOrder?: any;
  machine?: UserMachineAsset;
  message: string;
}

export const machineService = {
  async getCatalog(): Promise<MachineTier[]> {
    const res = await api.get('/machines/catalog');
    return res.data.data;
  },

  async getMyMachines(): Promise<UserMachineAsset[]> {
    const res = await api.get('/machines/my');
    return res.data.data;
  },

  async purchaseMachine(tierCode: string, isSandbox?: boolean): Promise<PurchaseMachineResult> {
    const res = await api.post('/machines/purchase', { tierCode, isSandbox });
    return res.data.data;
  },

  async updateMachineNickname(machineId: string, nickname: string): Promise<any> {
    try {
      const res = await api.post(`/machines/${machineId}/nickname`, { nickname });
      return res.data.data;
    } catch {
      return { success: true, localOnly: true };
    }
  },

  async toggleMachineControl(machineId: string, action: 'start' | 'pause' | 'restart'): Promise<any> {
    try {
      const res = await api.post(`/machines/${machineId}/control`, { action });
      return res.data.data;
    } catch {
      return { success: true, localOnly: true };
    }
  },

  async getOwnershipCertificate(machineId: string): Promise<any> {
    try {
      const res = await api.get(`/machines/${machineId}/certificate`);
      return res.data.data;
    } catch {
      return null;
    }
  },
};
