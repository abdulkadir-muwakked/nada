import AsyncStorage from "@react-native-async-storage/async-storage";

// Keys for AsyncStorage
const STREAK_KEY = "@nada_streak_count";
const LAST_ACTIVE_DATE_KEY = "@nada_last_active_date";

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
 * Check if the first date is exactly one day before the second date
 */
const isYesterday = (previous: Date, current: Date): boolean => {
  const yesterday = new Date(current);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(previous, yesterday);
};

/**
 * Get the current streak count from storage
 * @returns The current streak count (0 if not found)
 */
export const getStreak = async (): Promise<number> => {
  try {
    const streakString = await AsyncStorage.getItem(STREAK_KEY);
    return streakString ? parseInt(streakString, 10) : 0;
  } catch (error) {
    console.error("Error getting streak:", error);
    return 0;
  }
};

/**
 * Get the last active date from storage
 * @returns The last active date or null if not found
 */
export const getLastActiveDate = async (): Promise<Date | null> => {
  try {
    const lastActiveDateString = await AsyncStorage.getItem(
      LAST_ACTIVE_DATE_KEY
    );
    return lastActiveDateString ? new Date(lastActiveDateString) : null;
  } catch (error) {
    console.error("Error getting last active date:", error);
    return null;
  }
};

/**
 * Save the current streak count to storage
 * @param streak The streak count to save
 */
export const saveStreak = async (streak: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(STREAK_KEY, streak.toString());
  } catch (error) {
    console.error("Error saving streak:", error);
  }
};

/**
 * Save the last active date to storage
 * @param date The date to save (defaults to today)
 */
export const saveLastActiveDate = async (
  date: Date = new Date()
): Promise<void> => {
  try {
    await AsyncStorage.setItem(LAST_ACTIVE_DATE_KEY, date.toISOString());
  } catch (error) {
    console.error("Error saving last active date:", error);
  }
};

/**
 * Update the streak based on the current date and last active date
 * - If last active date is today → streak unchanged
 * - If last active date is yesterday → streak += 1
 * - If last active date is older than yesterday → streak = 1
 * @returns The updated streak count
 */
export const updateStreak = async (): Promise<number> => {
  const currentStreak = await getStreak();
  const lastActiveDate = await getLastActiveDate();
  const today = new Date();

  let newStreak = currentStreak;

  if (!lastActiveDate) {
    // First time use or data was cleared
    newStreak = 1;
  } else if (isSameDay(lastActiveDate, today)) {
    // Already active today, streak unchanged
    newStreak = currentStreak;
  } else if (isYesterday(lastActiveDate, today)) {
    // Active yesterday, increment streak
    newStreak = currentStreak + 1;
  } else {
    // Not active yesterday or today, reset streak
    newStreak = 1;
  }

  // Save the new streak and update the last active date
  await saveStreak(newStreak);
  await saveLastActiveDate(today);

  return newStreak;
};

/**
 * Record a completed session and update streak
 * Should be called whenever a focus session is completed
 * @returns The updated streak count
 */
export const recordCompletedSession = async (): Promise<number> => {
  // Save today as the last active date
  await saveLastActiveDate();

  // Get current streak and last active date
  const currentStreak = await getStreak();
  const lastActiveDate = await getLastActiveDate();
  const today = new Date();

  // If this is the first activity today, and we were either
  // inactive before or active yesterday, update the streak
  if (!lastActiveDate || !isSameDay(lastActiveDate, today)) {
    return updateStreak();
  }

  // Otherwise just return the current streak
  return currentStreak;
};

/**
 * Reset the streak counter
 * Useful for testing or when explicitly needed
 */
export const resetStreak = async (): Promise<void> => {
  try {
    await saveStreak(0);
    await AsyncStorage.removeItem(LAST_ACTIVE_DATE_KEY);
  } catch (error) {
    console.error("Error resetting streak:", error);
  }
};

/**
 * Initialize the streak on app startup
 * Updates streak based on last activity
 * @returns The current streak count after initialization
 */
export const initializeStreak = async (): Promise<number> => {
  const lastActiveDate = await getLastActiveDate();

  if (!lastActiveDate) {
    // First time use, set streak to 0 and don't set last active date
    await saveStreak(0);
    return 0;
  }

  // Check and update streak based on the time gap
  return updateStreak();
};
