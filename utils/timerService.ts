import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppStateStatus } from "react-native";
import { defaultTimerSettings } from "../context/TimerSettingsContext";
import { TimerState } from "../types/timer";
import {
  BREAK_SESSION_END_NOTIFICATION,
  cancelAllScheduledNotifications,
  FOCUS_SESSION_END_NOTIFICATION,
  scheduleTimerNotification,
} from "./notificationService";

// Storage keys
const TIMER_STATE_KEY = "@nada_timer_state";

// Initialize timer state
export const initializeTimerState = (): TimerState => ({
  isRunning: false,
  isRest: false,
  timerSeconds: 25 * 60, // Default 25 minutes
  focusDuration: 25 * 60,
  breakDuration: 5 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 25 * 60,
  focusSessionsPerCycle: 4,
  startTime: null,
  notificationId: null,
  lastActiveTime: Date.now(),
  completedFocusSessions: 0,
});

// Save timer state to storage
export const saveTimerState = async (timerState: TimerState): Promise<void> => {
  try {
    await AsyncStorage.setItem(TIMER_STATE_KEY, JSON.stringify(timerState));
  } catch (error) {
    console.error("Error saving timer state:", error);
  }
};

// Load timer state from storage
export const loadTimerState = async (): Promise<TimerState | null> => {
  try {
    const savedState = await AsyncStorage.getItem(TIMER_STATE_KEY);
    return savedState ? (JSON.parse(savedState) as TimerState) : null;
  } catch (error) {
    console.error("Error loading timer state:", error);
    return null;
  }
};

// Clear timer state from storage
export const clearTimerState = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TIMER_STATE_KEY);
  } catch (error) {
    console.error("Error clearing timer state:", error);
  }
};

// Calculate remaining time based on saved start time
export const calculateRemainingTime = (
  startTime: number | null,
  duration: number,
  lastActiveTime: number
): number => {
  if (!startTime) return duration;

  // Calculate elapsed time since timer started
  const now = Date.now();
  const elapsedSeconds = Math.floor((now - startTime) / 1000);

  // Calculate remaining time
  const remainingSeconds = Math.max(0, duration - elapsedSeconds);
  return remainingSeconds;
};

// Start timer and schedule notification
export const startTimer = async (
  timerState: TimerState
): Promise<TimerState> => {
  // Cancel any existing notifications
  if (timerState.notificationId) {
    await cancelAllScheduledNotifications();
  }

  const now = Date.now();
  const updatedState: TimerState = {
    ...timerState,
    isRunning: true,
    startTime: now,
    lastActiveTime: now,
  };

  // Schedule notification for timer completion
  // Use the notification type for logging purposes
  console.log(
    `Using notification type: ${
      updatedState.isRest
        ? BREAK_SESSION_END_NOTIFICATION
        : FOCUS_SESSION_END_NOTIFICATION
    }`
  );

  const { scheduledTime, identifier } = await scheduleTimerNotification(
    updatedState.timerSeconds,
    updatedState.isRest
  );

  console.log(
    `Timer started. ${
      updatedState.isRest ? "Break" : "Focus"
    } session will end at:`,
    scheduledTime
  );

  // Store the notification identifier
  updatedState.notificationId = identifier;

  // Save updated state
  await saveTimerState(updatedState);
  return updatedState;
};

// Pause timer
export const pauseTimer = async (
  timerState: TimerState
): Promise<TimerState> => {
  // Calculate elapsed time since timer started
  const now = Date.now();
  let elapsedSeconds = 0;

  if (timerState.startTime) {
    elapsedSeconds = Math.floor((now - timerState.startTime) / 1000);
  }

  // Calculate remaining time
  const remainingSeconds = Math.max(
    0,
    timerState.timerSeconds - elapsedSeconds
  );

  // Cancel scheduled notification
  if (timerState.notificationId) {
    await cancelAllScheduledNotifications();
  }

  const updatedState: TimerState = {
    ...timerState,
    isRunning: false,
    timerSeconds: remainingSeconds,
    startTime: null,
    notificationId: null,
    lastActiveTime: now,
  };

  // Save updated state
  await saveTimerState(updatedState);
  return updatedState;
};

// Reset timer
export const resetTimer = async (
  timerState: TimerState
): Promise<TimerState> => {
  // Cancel scheduled notification
  if (timerState.notificationId) {
    await cancelAllScheduledNotifications();
  }

  const duration = timerState.isRest
    ? timerState.breakDuration
    : timerState.focusDuration;

  const updatedState: TimerState = {
    ...timerState,
    isRunning: false,
    timerSeconds: duration,
    startTime: null,
    notificationId: null,
    lastActiveTime: Date.now(),
  };

  // Save updated state
  await saveTimerState(updatedState);
  return updatedState;
};

// Switch timer mode (focus/break)
export const switchTimerMode = async (
  timerState: TimerState
): Promise<TimerState> => {
  // Cancel scheduled notification
  if (timerState.notificationId) {
    await cancelAllScheduledNotifications();
  }

  const newIsRest = !timerState.isRest;
  const duration = newIsRest
    ? timerState.breakDuration
    : timerState.focusDuration;

  const updatedState: TimerState = {
    ...timerState,
    isRest: newIsRest,
    timerSeconds: duration,
    startTime: null,
    isRunning: false,
    notificationId: null,
    lastActiveTime: Date.now(),
  };

  // Save updated state
  await saveTimerState(updatedState);
  return updatedState;
};

// Update timer on app state change (background/foreground)
export const handleAppStateChange = async (
  nextAppState: AppStateStatus,
  timerState: TimerState
): Promise<TimerState | null> => {
  // Only process if timer is running
  if (!timerState.isRunning || !timerState.startTime) {
    return null;
  }

  const now = Date.now();

  if (nextAppState === "active") {
    // App came to foreground

    // Calculate elapsed time since timer started
    const elapsedSeconds = Math.floor((now - timerState.startTime) / 1000);

    // Calculate remaining time
    let remainingSeconds = Math.max(
      0,
      timerState.timerSeconds - elapsedSeconds
    );

    // Check if timer completed while in background
    if (remainingSeconds <= 0) {
      const focusSessionsPerCycle = Math.max(
        1,
        timerState.focusSessionsPerCycle || defaultTimerSettings.focusSessionsPerCycle
      );
      const shortBreakDuration =
        timerState.shortBreakDuration ||
        defaultTimerSettings.shortBreakMinutes * 60;
      const longBreakDuration =
        timerState.longBreakDuration ||
        defaultTimerSettings.longBreakMinutes * 60;

      let updatedFocusSessions = timerState.completedFocusSessions || 0;
      let nextIsRest: boolean;
      let nextTimerSeconds: number;
      let nextBreakDuration: number;

      if (!timerState.isRest) {
        // Focus session completed
        updatedFocusSessions += 1;
        const shouldTakeLongBreak =
          updatedFocusSessions % focusSessionsPerCycle === 0;
        nextIsRest = true;
        nextTimerSeconds = shouldTakeLongBreak
          ? longBreakDuration
          : shortBreakDuration;
        nextBreakDuration = nextTimerSeconds;
      } else {
        // Break completed
        nextIsRest = false;
        nextTimerSeconds = timerState.focusDuration;
        nextBreakDuration = shortBreakDuration;
        if (updatedFocusSessions >= focusSessionsPerCycle) {
          updatedFocusSessions = 0;
        }
      }

      const updatedState: TimerState = {
        ...timerState,
        isRest: nextIsRest,
        isRunning: false,
        timerSeconds: nextTimerSeconds,
        focusDuration: timerState.focusDuration,
        breakDuration: nextBreakDuration,
        shortBreakDuration,
        longBreakDuration,
        focusSessionsPerCycle,
        startTime: null,
        notificationId: null,
        lastActiveTime: now,
        completedFocusSessions: updatedFocusSessions,
      };

      await cancelAllScheduledNotifications();
      await saveTimerState(updatedState);
      return updatedState;
    } else {
      // Timer still running, update with remaining time
      const updatedState: TimerState = {
        ...timerState,
        timerSeconds: remainingSeconds,
        lastActiveTime: now,
      };

      // Save updated state
      await saveTimerState(updatedState);
      return updatedState;
    }
  } else if (nextAppState.match(/inactive|background/)) {
    // App went to background
    const updatedState: TimerState = {
      ...timerState,
      lastActiveTime: now,
    };

    // Save updated state
    await saveTimerState(updatedState);
    return updatedState;
  }

  return null;
};
