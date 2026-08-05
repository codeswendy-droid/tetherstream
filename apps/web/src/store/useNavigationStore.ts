 import { create } from 'zustand';
import { useSettingsStore } from './useSettingsStore';

type TabId = 'wallet' | 'grow' | 'hub' | 'shop' | 'rewards';
type DeprecatedTabId = 'friends' | 'boost' | 'growth' | 'mine' | 'treasury' | 'profile';

// Mapping from old tab IDs to new tab IDs
const TAB_REDIRECTS: Record<DeprecatedTabId, TabId> = {
  friends: 'grow',
  boost: 'shop',
  growth: 'grow',
  mine: 'hub',
  treasury: 'rewards',
  profile: 'hub',
};

const getInitialTab = (): TabId => {
  if (typeof window !== 'undefined') {
    const autoOpen = useSettingsStore.getState().autoOpenHub;
    return autoOpen === false ? 'wallet' : 'hub';
  }
  return 'hub';
};

interface NavigationState {
  activeTab: TabId;
  showGames: boolean;
  showShop: boolean;
  isProfileDrawerOpen: boolean;
  setActiveTab: (tab: TabId | DeprecatedTabId) => void;
  openGames: () => void;
  closeGames: () => void;
  openShop: () => void;
  closeShop: () => void;
  openProfileDrawer: () => void;
  closeProfileDrawer: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeTab: getInitialTab(),
  showGames: false,
  showShop: false,
  isProfileDrawerOpen: false,
  setActiveTab: (tab) => {
    if (tab === 'profile') {
      set({ isProfileDrawerOpen: true, showGames: false, showShop: false });
      return;
    }
    // Handle redirect from deprecated tab IDs
    const mappedTab = (tab in TAB_REDIRECTS) ? TAB_REDIRECTS[tab as DeprecatedTabId] : tab as TabId;
    set({ activeTab: mappedTab, showGames: false, showShop: false, isProfileDrawerOpen: false });
  },
  openGames: () => set({ showGames: true }),
  closeGames: () => set({ showGames: false }),
  openShop: () => set({ activeTab: 'shop', showShop: true }),
  closeShop: () => set({ showShop: false }),
  openProfileDrawer: () => set({ isProfileDrawerOpen: true }),
  closeProfileDrawer: () => set({ isProfileDrawerOpen: false }),
}));
