import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OnboardingStep = 'welcome' | 'first_deposit' | 'add_to_homescreen' | 'completed';

interface OnboardingState {
  currentStep: OnboardingStep;
  hasCompletedWelcome: boolean;
  hasMadeFirstDeposit: boolean;
  hasAddedToHomescreen: boolean;
  isOnboardingComplete: boolean;
  
  // Actions
  completeWelcome: () => void;
  completeFirstDeposit: () => void;
  completeAddToHomescreen: () => void;
  setCurrentStep: (step: OnboardingStep) => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      currentStep: 'welcome',
      hasCompletedWelcome: false,
      hasMadeFirstDeposit: false,
      hasAddedToHomescreen: false,
      isOnboardingComplete: false,

      completeWelcome: () => {
        set({ 
          hasCompletedWelcome: true,
          currentStep: 'first_deposit'
        });
      },

      completeFirstDeposit: () => {
        const { hasAddedToHomescreen } = get();
        set({ 
          hasMadeFirstDeposit: true,
          currentStep: 'add_to_homescreen'
        });
      },

      completeAddToHomescreen: () => {
        set({ 
          hasAddedToHomescreen: true,
          currentStep: 'completed',
          isOnboardingComplete: true
        });
      },

      setCurrentStep: (step: OnboardingStep) => {
        set({ currentStep: step });
      },

      resetOnboarding: () => {
        set({
          currentStep: 'welcome',
          hasCompletedWelcome: false,
          hasMadeFirstDeposit: false,
          hasAddedToHomescreen: false,
          isOnboardingComplete: false,
        });
      },
    }),
    {
      name: 'onboarding-storage',
    }
  )
);
