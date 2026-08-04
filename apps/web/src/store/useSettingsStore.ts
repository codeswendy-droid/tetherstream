import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SettingsState {
  language: string;
  theme: 'dark' | 'light';
  setLanguage: (lang: string) => void;

  // Currency & Location Preferences
  preferLocalCurrency: boolean;
  userCountry: string;
  userCurrency: string;
  currencySymbol: string;
  currencyRate: number;
  setCurrencyPreference: (
    preferLocal: boolean,
    country: string,
    currency: string,
    symbol: string,
    rate: number
  ) => void;

  // Admin Payment Receiving Phone Numbers
  adminPhoneNumbers: string[];
  activeAdminPhone: string;
  setActiveAdminPhone: (phone: string) => void;
  addAdminPhoneNumber: (phone: string) => void;
  removeAdminPhoneNumber: (phone: string) => void;

  // Global Emergency Kill Switches
  pauseDeposits: boolean;
  pauseWithdrawals: boolean;
  maintenanceMode: boolean;
  toggleKillSwitch: (key: 'pauseDeposits' | 'pauseWithdrawals' | 'maintenanceMode') => void;

  // ─── NEW USER-SPECIFIC SETTINGS ───
  // Account
  displayName: string;
  avatarUrl: string;
  timeZone: string;
  dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY';

  // Notifications
  notifyDeposits: boolean;
  notifyWithdrawals: boolean;
  notifyRewardReady: boolean;
  notifyReferralJoined: boolean;
  notifyMachineStopped: boolean;
  notifyMachineMaintenance: boolean;
  notifyDailyReminder: boolean;
  notifyPromotional: boolean;
  notifyEvents: boolean;
  notifyChannel: 'push' | 'telegram' | 'whatsapp';

  // Privacy
  showProfileToReferrals: boolean;
  showLeaderboard: boolean;
  hideEarnings: boolean;
  shareReferralStats: boolean;

  // Machine Preferences
  autoOpenHub: boolean;
  preferredMachine: string;
  telemetryMode: 'standard' | 'compact' | 'advanced';
  reducedAnimations: boolean;
  hapticFeedback: boolean;

  // Appearance
  accentColor: 'green' | 'cyan' | 'gold' | 'purple';
  compactMode: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  graphicsQuality: 'low' | 'medium' | 'high';

  // Security
  twoFactorEnabled: boolean;
  connectedTelegram: string;
  connectedWhatsApp: string;

  // Generic updater action
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
}

const autoDetectGraphics = (): 'low' | 'medium' | 'high' => {
  if (typeof navigator === 'undefined') return 'high';
  const ram = (navigator as any).deviceMemory;
  const cores = navigator.hardwareConcurrency;
  
  // Low-end device: RAM <= 3GB or CPU Cores <= 4
  if ((ram && ram <= 3) || (cores && cores <= 4)) {
    return 'low';
  }
  // Mid-range: RAM <= 6GB or CPU Cores <= 6
  if ((ram && ram <= 6) || (cores && cores <= 6)) {
    return 'medium';
  }
  return 'high';
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'en',
      theme: 'dark',
      setLanguage: (language) => set({ language }),

      preferLocalCurrency: false,
      userCountry: 'United States',
      userCurrency: 'USDT',
      currencySymbol: '₮',
      currencyRate: 1.0,
      setCurrencyPreference: (preferLocal, country, currency, symbol, rate) =>
        set({
          preferLocalCurrency: preferLocal,
          userCountry: country,
          userCurrency: currency,
          currencySymbol: symbol,
          currencyRate: rate,
        }),

      adminPhoneNumbers: ['0771234567', '0789012345', '0701122334'],
      activeAdminPhone: '0771234567',
      setActiveAdminPhone: (phone) => set({ activeAdminPhone: phone }),
      addAdminPhoneNumber: (phone) =>
        set((state) => ({
          adminPhoneNumbers: [...state.adminPhoneNumbers.filter((p) => p !== phone), phone],
          activeAdminPhone: phone,
        })),
      removeAdminPhoneNumber: (phone) =>
        set((state) => {
          const filtered = state.adminPhoneNumbers.filter((p) => p !== phone);
          return {
            adminPhoneNumbers: filtered,
            activeAdminPhone: state.activeAdminPhone === phone ? filtered[0] || '' : state.activeAdminPhone,
          };
        }),

      pauseDeposits: false,
      pauseWithdrawals: false,
      maintenanceMode: false,
      toggleKillSwitch: (key) =>
        set((state) => ({
          [key]: !state[key],
        })),

      // ─── NEW USER-SPECIFIC SETTINGS DEFAULTS ───
      displayName: '',
      avatarUrl: '',
      timeZone: 'UTC',
      dateFormat: 'YYYY-MM-DD',

      notifyDeposits: true,
      notifyWithdrawals: true,
      notifyRewardReady: true,
      notifyReferralJoined: true,
      notifyMachineStopped: true,
      notifyMachineMaintenance: false,
      notifyDailyReminder: true,
      notifyPromotional: false,
      notifyEvents: true,
      notifyChannel: 'telegram',

      showProfileToReferrals: true,
      showLeaderboard: true,
      hideEarnings: false,
      shareReferralStats: true,

      autoOpenHub: true,
      preferredMachine: 'TS_TRIAL',
      telemetryMode: 'standard',
      reducedAnimations: false,
      hapticFeedback: true,

      accentColor: 'green',
      compactMode: false,
      largeText: false,
      reducedMotion: false,
      graphicsQuality: autoDetectGraphics(),

      twoFactorEnabled: false,
      connectedTelegram: '',
      connectedWhatsApp: '',

      updateSetting: (key, value) => set({ [key]: value }),
    }),
    {
      name: 'titan_settings_v1',
    }
  )
);



