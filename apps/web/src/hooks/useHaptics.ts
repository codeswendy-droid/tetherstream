import { useTelegram } from '../context/TelegramContext';
import { useSettingsStore } from '../store/useSettingsStore';

export const useHaptics = () => {
  const { hapticFeedback } = useTelegram();
  const enabled = useSettingsStore((s) => s.hapticFeedback);

  if (!enabled) {
    return {
      impactOccurred: () => {},
      notificationOccurred: () => {},
      selectionChanged: () => {},
    };
  }

  return hapticFeedback;
};
