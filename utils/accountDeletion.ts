import AsyncStorage from "@react-native-async-storage/async-storage";
import { cancelAllScheduledNotifications } from "./notificationService";
import { resetSessionData } from "./sessionUtil";
import { resetStreak } from "./streakManager";
import { clearTimerState } from "./timerService";

const TIMER_SETTINGS_KEY = "@nada_timer_settings_v1";
const NETWORK_HISTORY_KEY = "@nada_network_history";

export const purgeDeletedAccountData = async (): Promise<void> => {
  await cancelAllScheduledNotifications();
  await clearTimerState();
  await resetSessionData();
  await resetStreak();
  await AsyncStorage.multiRemove([TIMER_SETTINGS_KEY, NETWORK_HISTORY_KEY]);
};
