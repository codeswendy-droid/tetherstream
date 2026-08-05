import { api } from './api';

export interface BackendPreferences {
  telegramUserId: number;
  authenticationMethod: string;
  notificationChannel: string;
  preferredShareChannel: string;
  pushToken: string | null;
  settings: Record<string, any>;
}

export const settingsService = {
  async getPreferences(): Promise<BackendPreferences> {
    const response = await api.get('/user/preferences');
    return response.data;
  },

  async updatePreferences(data: { settings?: any; notificationChannel?: any }): Promise<BackendPreferences> {
    const response = await api.patch('/user/preferences', data);
    return response.data;
  },
};
