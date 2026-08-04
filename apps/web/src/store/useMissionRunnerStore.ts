import { create } from 'zustand';
import type { MissionItem } from '../services/growthService';

interface MissionRunnerState {
  runningMission: MissionItem | null;
  openRunner: (mission: MissionItem) => void;
  closeRunner: () => void;
}

export const useMissionRunnerStore = create<MissionRunnerState>((set) => ({
  runningMission: null,
  openRunner: (mission) => set({ runningMission: mission }),
  closeRunner: () => set({ runningMission: null }),
}));
