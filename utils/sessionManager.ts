import AsyncStorage from "@react-native-async-storage/async-storage";

// Keys for AsyncStorage
const SESSIONS_COUNT_KEY = "@nada_sessions_count";
const SESSION_GOAL_KEY = "@nada_session_goal";
const LAST_RESET_DATE_KEY = "@nada_last_reset_date";

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
  // Check if we need to reset for a new day
  await checkAndResetSessions();

  // Get the current values
  const sessionsCount = await getSessionsCount();
  const sessionGoal = await getSessionGoal();

  console.log("Sessions initialized:", { sessionsCount, sessionGoal });
  return { sessionsCount, sessionGoal };
};

/**
 * Record a completed session and increment the count
 * @returns The updated sessions count
 */
export const recordCompletedFocusSession = async (): Promise<number> => {
  // Get current sessions count
  const currentCount = await getSessionsCount();

  // Increment by 1
  const newCount = currentCount + 1;

  // Save the updated count
  await saveSessionsCount(newCount);

  return newCount;
};

// Re-export all functions to ensure they're available
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
};
