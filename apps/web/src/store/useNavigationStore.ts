 import { create } from 'zustand';

type TabId = 'wallet' | 'grow' | 'hub' | 'rewards' | 'profile';
type DeprecatedTabId = 'friends' | 'boost' | 'growth' | 'mine' | 'treasury';

// Mapping from old tab IDs to new tab IDs
const TAB_REDIRECTS: Record<DeprecatedTabId, TabId> = {
  friends: 'grow',
  boost: 'hub',
  growth: 'grow',
  mine: 'hub',
  treasury: 'rewards',
};

interface NavigationState {
  activeTab: TabId;
  showGames: boolean;
  showShop: boolean;
  setActiveTab: (tab: TabId | DeprecatedTabId) => void;
  openGames: () => void;
  closeGames: () => void;
  openShop: () => void;
  closeShop: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeTab: 'hub',
  showGames: false,
  showShop: false,
  setActiveTab: (tab) => {
    // Handle redirect from deprecated tab IDs
    const mappedTab = (tab in TAB_REDIRECTS) ? TAB_REDIRECTS[tab as DeprecatedTabId] : tab as TabId;
    set({ activeTab: mappedTab, showGames: false, showShop: false });
  },
  openGames: () => set({ showGames: true }),
  closeGames: () => set({ showGames: false }),
  openShop: () => set({ showShop: true }),
  closeShop: () => set({ showShop: false }),
}));
