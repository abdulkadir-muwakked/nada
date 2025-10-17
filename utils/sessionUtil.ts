import AsyncStorage from "@react-native-async-storage/async-storage";

// Keys for AsyncStorage
const SESSIONS_COUNT_KEY = "@nada_sessions_count";
const SESSION_GOAL_KEY = "@nada_session_goal";
const LAST_RESET_DATE_KEY = "@nada_last_reset_date";
const SESSION_HISTORY_KEY = "@nada_session_history_v1";

// Default session goal
const DEFAULT_GOAL = 4;

/**
 * Check if two dates are the same calendar day
 */
const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Get the current sessions count from storage
 * @returns The current sessions count (0 if not found)
 */
export const getSessionsCount = async (): Promise<number> => {
  try {
    const sessionsString = await AsyncStorage.getItem(SESSIONS_COUNT_KEY);
    return sessionsString ? parseInt(sessionsString, 10) : 0;
  } catch (error) {
    console.error("Error getting sessions count:", error);
    return 0;
  }
};

/**
 * Get the current session goal from storage
 * @returns The current session goal (DEFAULT_GOAL if not found)
 */
export const getSessionGoal = async (): Promise<number> => {
  try {
    const goalString = await AsyncStorage.getItem(SESSION_GOAL_KEY);
    return goalString ? parseInt(goalString, 10) : DEFAULT_GOAL;
  } catch (error) {
    console.error("Error getting session goal:", error);
    return DEFAULT_GOAL;
  }
};

/**
 * Save the current sessions count to storage
 * @param count The sessions count to save
 */
export const saveSessionsCount = async (count: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(SESSIONS_COUNT_KEY, count.toString());
  } catch (error) {
    console.error("Error saving sessions count:", error);
  }
};

/**
 * Save the session goal to storage
 * @param goal The session goal to save
 */
export const saveSessionGoal = async (goal: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(SESSION_GOAL_KEY, goal.toString());
  } catch (error) {
    console.error("Error saving session goal:", error);
  }
};

/**
 * Get the last reset date from storage
 * @returns The last reset date or null if not found
 */
export const getLastResetDate = async (): Promise<Date | null> => {
  try {
    const lastResetString = await AsyncStorage.getItem(LAST_RESET_DATE_KEY);
    return lastResetString ? new Date(lastResetString) : null;
  } catch (error) {
    console.error("Error getting last reset date:", error);
    return null;
  }
};

/**
 * Save the last reset date to storage
 * @param date The date to save (defaults to today)
 */
export const saveLastResetDate = async (
  date: Date = new Date()
): Promise<void> => {
  try {
    await AsyncStorage.setItem(LAST_RESET_DATE_KEY, date.toISOString());
  } catch (error) {
    console.error("Error saving last reset date:", error);
  }
};

/**
 * Check if we need to reset the sessions count (new day)
 * @returns true if sessions were reset, false otherwise
 */
export const checkAndResetSessions = async (): Promise<boolean> => {
  const lastResetDate = await getLastResetDate();
  const today = new Date();

  if (!lastResetDate || !isSameDay(lastResetDate, today)) {
    // It's a new day or first run, reset sessions count
    await saveSessionsCount(0);
    await saveLastResetDate(today);
    return true;
  }

  return false;
};

/**
 * Initialize sessions data on app startup
 * Resets the sessions count if it's a new day
 * @returns The current sessions count and goal after initialization
 */
export const initializeSessions = async (): Promise<{
  sessionsCount: number;
  sessionGoal: number;
}> => {
  console.log("Initializing sessions...");
  try {
    // Check if we need to reset for a new day
    await checkAndResetSessions();

    // Get the current values
    const sessionsCount = await getSessionsCount();
    const sessionGoal = await getSessionGoal();

    console.log("Sessions initialized:", { sessionsCount, sessionGoal });
    return { sessionsCount, sessionGoal };
  } catch (error) {
    console.error("Error in initializeSessions:", error);
    // Return default values as fallback
    return { sessionsCount: 0, sessionGoal: DEFAULT_GOAL };
  }
};

type SessionHistoryMap = Record<string, { sessions: number; minutes: number }>;

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const loadSessionHistory = async (): Promise<SessionHistoryMap> => {
  try {
    const raw = await AsyncStorage.getItem(SESSION_HISTORY_KEY);
    if (raw) {
      return JSON.parse(raw) as SessionHistoryMap;
    }
  } catch (error) {
    console.error("Error loading session history:", error);
  }
  return {};
};

const saveSessionHistory = async (history: SessionHistoryMap): Promise<void> => {
  try {
    await AsyncStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Error saving session history:", error);
  }
};

/**
 * Record a completed session and increment the count
 * @returns The updated sessions count
 */
export const recordCompletedFocusSession = async (
  durationMinutes: number,
  completedAt: Date = new Date()
): Promise<number> => {
  try {
    const sanitizedMinutes = Math.max(1, Math.round(durationMinutes));

    // Update daily session count
    const currentCount = await getSessionsCount();
    const newCount = currentCount + 1;
    await saveSessionsCount(newCount);

    const history = await loadSessionHistory();
    const key = formatDateKey(completedAt);
    const existing = history[key] || { sessions: 0, minutes: 0 };
    history[key] = {
      sessions: existing.sessions + 1,
      minutes: existing.minutes + sanitizedMinutes,
    };
    await saveSessionHistory(history);

    return newCount;
  } catch (error) {
    console.error("Error recording focus session:", error);
    return 0;
  }
};

export const getSessionHistory = async (): Promise<SessionHistoryMap> => {
  return loadSessionHistory();
};

export const clearSessionHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SESSION_HISTORY_KEY);
  } catch (error) {
    console.error("Error clearing session history:", error);
  }
};

export const resetSessionData = async (): Promise<void> => {
  await clearSessionHistory();
  await saveSessionsCount(0);
  await saveLastResetDate(new Date());
};

export type { SessionHistoryMap };

export default {
  getSessionsCount,
  getSessionGoal,
  saveSessionsCount,
  saveSessionGoal,
  getLastResetDate,
  saveLastResetDate,
  checkAndResetSessions,
  initializeSessions,
  recordCompletedFocusSession,
  getSessionHistory,
  clearSessionHistory,
  resetSessionData,
};
