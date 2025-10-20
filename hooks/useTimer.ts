import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import {
  getBreakMessage,
  getResumeMessage,
  getSessionStartMessage,
} from "../constants/AuthMessages";
import { useTimerSettings } from "../context/TimerSettingsContext";
import { TimerState, UseTimerProps, UseTimerReturn } from "../types/timer";
import {
  cancelAllScheduledNotifications,
  requestNotificationPermissions,
  scheduleTimerNotification,
  sendTimerCompleteNotification,
} from "../utils/notificationService";
import { formatTime } from "../utils/timer/timerUtils";
import {
  calculateRemainingTime,
  handleAppStateChange,
  initializeTimerState,
  loadTimerState,
  pauseTimer as pauseTimerService,
  saveTimerState,
  startTimer as startTimerService,
  switchTimerMode as switchTimerModeService,
} from "../utils/timerService";

export const useTimer = ({
  initialFocusDuration,
  initialBreakDuration,
  onFocusComplete,
}: UseTimerProps = {}): UseTimerReturn => {
  const { settings } = useTimerSettings();

  const focusDurationSettingSeconds = useMemo(
    () => Math.max(60, Math.round(settings.focusDurationMinutes) * 60),
    [settings.focusDurationMinutes]
  );

  const shortBreakSettingSeconds = useMemo(
    () => Math.max(60, Math.round(settings.shortBreakMinutes) * 60),
    [settings.shortBreakMinutes]
  );

  const longBreakSettingSeconds = useMemo(
    () => Math.max(60, Math.round(settings.longBreakMinutes) * 60),
    [settings.longBreakMinutes]
  );

  const focusSessionsPerCycleSetting = useMemo(
    () => Math.max(1, Math.round(settings.focusSessionsPerCycle)),
    [settings.focusSessionsPerCycle]
  );

  const defaultFocusSeconds =
    initialFocusDuration ?? focusDurationSettingSeconds;
  const defaultShortBreakSeconds =
    initialBreakDuration ?? shortBreakSettingSeconds;
  const defaultLongBreakSeconds = longBreakSettingSeconds;

  const initialFocusRef = useRef(defaultFocusSeconds);
  const initialBreakRef = useRef(defaultShortBreakSeconds);
  const longBreakRef = useRef(defaultLongBreakSeconds);
  const focusCycleRef = useRef(focusSessionsPerCycleSetting);
  const shortBreakRef = useRef(defaultShortBreakSeconds);

  // Reference to app state
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Refs for timer stabilization
  const isDurationUpdatingRef = useRef<boolean>(false);
  const expectedTimerSecondsRef = useRef<number | null>(null);

  // Timer state
  const [focusDuration, setFocusDuration] =
    useState<number>(defaultFocusSeconds);
  const [breakDuration, setBreakDuration] = useState<number>(
    defaultShortBreakSeconds
  );
  const [selectedPreset, setSelectedPreset] =
    useState<number>(defaultFocusSeconds);
  const [timerSeconds, setTimerSeconds] = useState<number>(defaultFocusSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isRest, setIsRest] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string>(
    getSessionStartMessage()
  );
  const [taskCompleted, setTaskCompleted] = useState<boolean>(false);
  const [, setCompletedFocusSessions] = useState<number>(0);

  // Notification state
  const [notificationsPermission, setNotificationsPermission] =
    useState<boolean>(false);
  const [notificationId, setNotificationId] = useState<string | null>(null);

  // Refs for timer management
  const timerStateRef = useRef<TimerState | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimestampRef = useRef<number | null>(null);
  const latestTimerSecondsRef = useRef<number>(defaultFocusSeconds);
  const completionTriggeredRef = useRef<boolean>(false);
  const completedFocusSessionsRef = useRef<number>(0);

  useEffect(() => {
    latestTimerSecondsRef.current = timerSeconds;
  }, [timerSeconds]);

  useEffect(() => {
    if (isRunning) {
      completionTriggeredRef.current = false;
    }
  }, [isRunning]);

  useEffect(() => {
    const focusSeconds = focusDurationSettingSeconds;
    const shortBreakSeconds = shortBreakSettingSeconds;
    const longBreakSeconds = longBreakSettingSeconds;
    const sessionsPerCycle = focusSessionsPerCycleSetting;

    initialFocusRef.current = focusSeconds;
    initialBreakRef.current = shortBreakSeconds;
    longBreakRef.current = longBreakSeconds;
    focusCycleRef.current = sessionsPerCycle;
    shortBreakRef.current = shortBreakSeconds;

    const adjustTimer = (previousDuration: number, nextDuration: number) => {
      if (previousDuration === nextDuration) {
        return;
      }

      const elapsed = Math.max(0, previousDuration - timerSeconds);
      const newRemaining = Math.max(0, nextDuration - elapsed);

      if (isRunning) {
        if (startTimestampRef.current) {
          startTimestampRef.current = Date.now() - elapsed * 1000;
        }
        if (latestTimerSecondsRef.current !== newRemaining) {
          latestTimerSecondsRef.current = newRemaining;
        }
        if (timerSeconds !== newRemaining) {
          setTimerSeconds(newRemaining);
        }
      } else {
        if (latestTimerSecondsRef.current !== nextDuration) {
          latestTimerSecondsRef.current = nextDuration;
        }
        if (timerSeconds !== nextDuration) {
          setTimerSeconds(nextDuration);
        }
      }
    };

    if (isRest) {
      const isLongBreak =
        completedFocusSessionsRef.current % sessionsPerCycle === 0 &&
        completedFocusSessionsRef.current !== 0;
      const targetBreak = isLongBreak ? longBreakSeconds : shortBreakSeconds;

      if (breakDuration !== targetBreak) {
        setBreakDuration(targetBreak);
      }
      adjustTimer(breakDuration, targetBreak);
    } else {
      if (focusDuration !== focusSeconds) {
        setFocusDuration(focusSeconds);
      }
      if (selectedPreset !== focusSeconds) {
        setSelectedPreset(focusSeconds);
      }
      adjustTimer(focusDuration, focusSeconds);
    }
  }, [
    focusDurationSettingSeconds,
    shortBreakSettingSeconds,
    longBreakSettingSeconds,
    focusSessionsPerCycleSetting,
    isRest,
    isRunning,
    timerSeconds,
    focusDuration,
    breakDuration,
    selectedPreset,
  ]);

  // Helper function to keep timer state synchronized
  const synchronizeTimerState = useCallback(
    async (overrides: Partial<TimerState> = {}) => {
      if (!timerStateRef.current) {
        timerStateRef.current = initializeTimerState();
      }

      const isRunningState = overrides.isRunning ?? isRunning;
      const isRestState = overrides.isRest ?? isRest;
      const focusValue = overrides.focusDuration ?? focusDuration;
      const breakValue = overrides.breakDuration ?? breakDuration;
      const shortBreakValue =
        overrides.shortBreakDuration ??
        timerStateRef.current?.shortBreakDuration ??
        shortBreakRef.current;
      const longBreakValue =
        overrides.longBreakDuration ??
        timerStateRef.current?.longBreakDuration ??
        longBreakRef.current;
      const focusCycleValue =
        overrides.focusSessionsPerCycle ??
        timerStateRef.current?.focusSessionsPerCycle ??
        focusCycleRef.current;
      const secondsValue = overrides.timerSeconds ?? timerSeconds;
      const notificationValue = overrides.notificationId ?? notificationId;
      const completedFocusSessionsValue =
        overrides.completedFocusSessions ??
        timerStateRef.current?.completedFocusSessions ??
        completedFocusSessionsRef.current;

      if (completedFocusSessionsRef.current !== completedFocusSessionsValue) {
        completedFocusSessionsRef.current = completedFocusSessionsValue;
        setCompletedFocusSessions((prev) =>
          prev === completedFocusSessionsValue
            ? prev
            : completedFocusSessionsValue
        );
      }
      const activeDuration = isRestState ? breakValue : focusValue;

      let startTimeValue: number | null;
      if (overrides.startTime !== undefined) {
        startTimeValue = overrides.startTime;
      } else if (isRunningState && secondsValue > 0) {
        startTimeValue =
          startTimestampRef.current ??
          Date.now() - (activeDuration - secondsValue) * 1000;
      } else {
        startTimeValue = null;
      }

      if (isRunningState && startTimeValue !== null) {
        startTimestampRef.current = startTimeValue;
      }

      if (!isRunningState) {
        startTimestampRef.current = null;
      }

      const currentState: TimerState = {
        ...timerStateRef.current,
        isRunning: isRunningState,
        isRest: isRestState,
        timerSeconds: secondsValue,
        focusDuration: focusValue,
        breakDuration: breakValue,
        shortBreakDuration: shortBreakValue,
        longBreakDuration: longBreakValue,
        focusSessionsPerCycle: focusCycleValue,
        startTime: startTimeValue,
        notificationId: notificationValue,
        lastActiveTime: Date.now(),
        completedFocusSessions: completedFocusSessionsValue,
      };

      shortBreakRef.current = shortBreakValue;
      longBreakRef.current = longBreakValue;
      focusCycleRef.current = focusCycleValue;

      await saveTimerState(currentState);
      timerStateRef.current = currentState;
      return currentState;
    },
    [
      breakDuration,
      focusDuration,
      isRest,
      isRunning,
      notificationId,
      timerSeconds,
    ]
  );

  // Initialize notification permissions, streak data, and timer state
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        // Request notification permissions
        const hasPermission = await requestNotificationPermissions();
        if (!isMounted) return;
        setNotificationsPermission(hasPermission);
        console.log("Notification permission status:", hasPermission);

        // Load saved timer state if exists
        const savedTimerState = await loadTimerState();
        if (!isMounted) return;
        if (savedTimerState) {
          console.log("Restored timer state:", savedTimerState);

          // Update our component state with the saved timer state
          setIsRunning(savedTimerState.isRunning);
          setIsRest(savedTimerState.isRest);
          setFocusDuration(savedTimerState.focusDuration);
          setBreakDuration(savedTimerState.breakDuration);
          const savedShortBreak =
            savedTimerState.shortBreakDuration ?? defaultShortBreakSeconds;
          const savedLongBreak =
            savedTimerState.longBreakDuration ?? defaultLongBreakSeconds;
          const savedCycle =
            savedTimerState.focusSessionsPerCycle ??
            focusSessionsPerCycleSetting;
          shortBreakRef.current = savedShortBreak;
          longBreakRef.current = savedLongBreak;
          focusCycleRef.current = savedCycle;
          initialBreakRef.current = savedShortBreak;
          initialFocusRef.current = savedTimerState.focusDuration;
          const savedFocusCount = savedTimerState.completedFocusSessions ?? 0;
          completedFocusSessionsRef.current = savedFocusCount;
          setCompletedFocusSessions((prev) =>
            prev === savedFocusCount ? prev : savedFocusCount
          );

          // Calculate remaining time based on when the timer was last active
          let restoredSeconds: number;
          let restoredStartTime: number | null = null;

          if (savedTimerState.isRunning && savedTimerState.startTime) {
            restoredSeconds = calculateRemainingTime(
              savedTimerState.startTime,
              savedTimerState.isRest
                ? savedTimerState.breakDuration
                : savedTimerState.focusDuration,
              savedTimerState.lastActiveTime
            );
            restoredStartTime = savedTimerState.startTime;
          } else {
            restoredSeconds = savedTimerState.isRest
              ? savedTimerState.breakDuration
              : savedTimerState.focusDuration;
          }

          setTimerSeconds(restoredSeconds);
          latestTimerSecondsRef.current = restoredSeconds;
          startTimestampRef.current =
            savedTimerState.isRunning && restoredStartTime
              ? restoredStartTime
              : null;

          // Store in our ref for later use
          timerStateRef.current = {
            ...savedTimerState,
            timerSeconds: restoredSeconds,
            startTime:
              savedTimerState.isRunning && restoredStartTime
                ? restoredStartTime
                : null,
            completedFocusSessions: savedFocusCount,
            shortBreakDuration: savedShortBreak,
            longBreakDuration: savedLongBreak,
            focusSessionsPerCycle: savedCycle,
          };
        } else {
          // Initialize timer state with defaults
          const initialState = initializeTimerState();
          initialState.focusDuration = initialFocusRef.current;
          initialState.breakDuration = initialBreakRef.current;
          initialState.shortBreakDuration = defaultShortBreakSeconds;
          initialState.longBreakDuration = defaultLongBreakSeconds;
          initialState.focusSessionsPerCycle = focusSessionsPerCycleSetting;
          initialState.completedFocusSessions = 0;
          shortBreakRef.current = defaultShortBreakSeconds;
          longBreakRef.current = defaultLongBreakSeconds;
          focusCycleRef.current = focusSessionsPerCycleSetting;
          completedFocusSessionsRef.current = 0;
          setCompletedFocusSessions((prev) => (prev === 0 ? prev : 0));
          timerStateRef.current = initialState;
          await saveTimerState(initialState);
        }
      } catch (error) {
        console.error("Error loading timer data:", error);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Set up app state change listener for background timer handling
  useEffect(() => {
    console.log("Setting up app state change listener");

    // App state change handler
    const appStateChangeHandler = async (nextAppState: AppStateStatus) => {
      const previousState = appStateRef.current;
      console.log(`App state changed from ${previousState} to ${nextAppState}`);

      // Update the ref with current state
      appStateRef.current = nextAppState;

      // Create current timer state
      if (!timerStateRef.current) {
        timerStateRef.current = initializeTimerState();
      }

      const activeDuration = isRest ? breakDuration : focusDuration;
      const shouldTrackStart = isRunning && timerSeconds > 0;
      const derivedStartTime = shouldTrackStart
        ? startTimestampRef.current ??
          Date.now() - (activeDuration - timerSeconds) * 1000
        : null;

      if (shouldTrackStart && derivedStartTime !== null) {
        startTimestampRef.current = derivedStartTime;
      }

      if (!shouldTrackStart) {
        startTimestampRef.current = null;
      }

      const currentTimerState = await synchronizeTimerState({
        isRunning,
        isRest,
        timerSeconds,
        focusDuration,
        breakDuration,
        shortBreakDuration: shortBreakRef.current,
        longBreakDuration: longBreakRef.current,
        focusSessionsPerCycle: focusCycleRef.current,
        startTime: derivedStartTime,
        notificationId,
        completedFocusSessions: completedFocusSessionsRef.current,
      });

      // Use the timer service to handle app state changes
      const updatedState = await handleAppStateChange(
        nextAppState,
        currentTimerState
      );

      if (updatedState) {
        console.log("Timer state updated:", updatedState);

        // Update our local state
        timerStateRef.current = updatedState;
        startTimestampRef.current = updatedState.startTime;
        if (focusDuration !== updatedState.focusDuration) {
          setFocusDuration(updatedState.focusDuration);
        }
        if (breakDuration !== updatedState.breakDuration) {
          setBreakDuration(updatedState.breakDuration);
        }
        initialFocusRef.current = updatedState.focusDuration;
        initialBreakRef.current = updatedState.shortBreakDuration;
        shortBreakRef.current = updatedState.shortBreakDuration;
        longBreakRef.current = updatedState.longBreakDuration;
        focusCycleRef.current = updatedState.focusSessionsPerCycle;
        completedFocusSessionsRef.current =
          updatedState.completedFocusSessions ?? 0;
        setCompletedFocusSessions((prev) =>
          prev === completedFocusSessionsRef.current
            ? prev
            : completedFocusSessionsRef.current
        );

        // App going to background - schedule notification if timer is running
        if (
          previousState === "active" &&
          nextAppState.match(/inactive|background/) &&
          updatedState.isRunning
        ) {
          console.log(
            "App going to background with timer running, scheduling notification"
          );

          try {
            // Cancel any existing notifications first
            await cancelAllScheduledNotifications();

            // Calculate remaining time
            const remainingTime = calculateRemainingTime(
              updatedState.startTime,
              updatedState.isRest
                ? updatedState.breakDuration
                : updatedState.focusDuration,
              updatedState.lastActiveTime
            );

            // Schedule notification for when timer completes
            const { scheduledTime } = await scheduleTimerNotification(
              remainingTime,
              updatedState.isRest
            );
            console.log(
              `Background notification scheduled for ${remainingTime} seconds from now at:`,
              scheduledTime
            );
          } catch (error) {
            console.error("Error scheduling background notification:", error);
          }
        }

        // App coming to foreground - update timer based on elapsed time
        if (
          nextAppState === "active" &&
          previousState.match(/inactive|background/)
        ) {
          // Update UI state
          setIsRunning(updatedState.isRunning);
          setIsRest(updatedState.isRest);
          setTimerSeconds(updatedState.timerSeconds);
          latestTimerSecondsRef.current = updatedState.timerSeconds;

          // Update timer state
          if (updatedState.isRest !== isRest) {
            // Timer mode changed (focus/break)
            if (updatedState.isRest) {
              setCurrentMessage(getBreakMessage());
            } else {
              setCurrentMessage(getSessionStartMessage());
            }
          }
        }
      } else if (nextAppState.match(/inactive|background/)) {
        try {
          await saveTimerState(currentTimerState);
          timerStateRef.current = currentTimerState;
        } catch (error) {
          console.error("Failed to persist timer state on background:", error);
        }
      }
    };

    // Set up the app state change listener
    const subscription = AppState.addEventListener(
      "change",
      appStateChangeHandler
    );

    // Cleanup function
    return () => {
      subscription.remove();
    };
  }, [
    isRunning,
    timerSeconds,
    isRest,
    focusDuration,
    breakDuration,
    notificationId,
  ]);
  // Initialize timer when mode changes but not running
  useEffect(() => {
    // Only update when not running
    if (!isRunning) {
      const currentDuration = isRest ? breakDuration : focusDuration;

      // Use a controlled way to update the timer seconds
      if (timerSeconds !== currentDuration) {
        console.log(
          `Initializing timer to ${isRest ? "break" : "focus"} duration:`,
          currentDuration
        );
        setTimerSeconds(currentDuration);
        latestTimerSecondsRef.current = currentDuration;
        completionTriggeredRef.current = false;

        // Also update the timer state ref to maintain consistency
        if (timerStateRef.current) {
          timerStateRef.current = {
            ...timerStateRef.current,
            timerSeconds: currentDuration,
            lastActiveTime: Date.now(),
          };
        }
      }
    }
  }, [isRest, isRunning, breakDuration, focusDuration, timerSeconds]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      // Save final state when component unmounts
      const saveTimerOnUnmount = async () => {
        if (timerStateRef.current) {
          // Update with latest UI state
          const activeDuration = isRest ? breakDuration : focusDuration;
          const shouldTrackStart = isRunning && timerSeconds > 0;
          const startTime = shouldTrackStart
            ? startTimestampRef.current ??
              Date.now() - (activeDuration - timerSeconds) * 1000
            : null;

          if (shouldTrackStart && startTime !== null) {
            startTimestampRef.current = startTime;
          }

          if (!shouldTrackStart) {
            startTimestampRef.current = null;
          }

          const finalState: TimerState = {
            ...timerStateRef.current,
            isRunning,
            isRest,
            timerSeconds,
            focusDuration,
            breakDuration,
            shortBreakDuration: shortBreakRef.current,
            longBreakDuration: longBreakRef.current,
            focusSessionsPerCycle: focusCycleRef.current,
            startTime,
            notificationId,
            lastActiveTime: Date.now(),
            completedFocusSessions: completedFocusSessionsRef.current,
          };

          await saveTimerState(finalState);
          console.log("Saved timer state on unmount");
        }
      };

      saveTimerOnUnmount().catch((error) => {
        console.error("Error saving timer state on unmount:", error);
      });
    };
  }, [
    isRunning,
    isRest,
    timerSeconds,
    focusDuration,
    breakDuration,
    notificationId,
  ]);

  const handleTimerCompletion = useCallback(
    async (restModeCompleted: boolean) => {
      completionTriggeredRef.current = true;

      try {
        await cancelAllScheduledNotifications();
      } catch (error) {
        console.error("Error cancelling scheduled notifications:", error);
      }

      setNotificationId(null);
      startTimestampRef.current = null;

      try {
        await sendTimerCompleteNotification(restModeCompleted);
      } catch (error) {
        console.error("Error sending completion notification:", error);
      }

      if (appStateRef.current === "active") {
        try {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
        } catch (error) {
          console.error("Error triggering haptics:", error);
        }
      }

      const focusDefault = initialFocusRef.current;
      const shortBreakDefault = shortBreakRef.current;
      const longBreakDefault = longBreakRef.current;
      const focusSessionsPerCycle = Math.max(
        1,
        focusCycleRef.current || focusSessionsPerCycleSetting
      );
      let nextIsRest: boolean;
      let nextTimerSeconds: number;
      let nextBreakDurationValue = breakDuration;
      let updatedFocusCount = completedFocusSessionsRef.current;
      const now = Date.now();

      if (!restModeCompleted) {
        setTaskCompleted(true);
        const incremented = completedFocusSessionsRef.current + 1;
        updatedFocusCount = incremented;
        const shouldTakeLongBreak = incremented % focusSessionsPerCycle === 0;
        nextIsRest = true;
        nextTimerSeconds = shouldTakeLongBreak
          ? longBreakDefault
          : shortBreakDefault;
        nextBreakDurationValue = nextTimerSeconds;
        setBreakDuration(nextTimerSeconds);
        setFocusDuration(focusDefault);
        setIsRest(true);
        setCurrentMessage(getBreakMessage());
        try {
          if (onFocusComplete) {
            await onFocusComplete({
              durationSeconds: focusDefault,
              completedAt: new Date(now),
            });
          }
        } catch (error) {
          console.error("Error completing focus session:", error);
        }
      } else {
        setTaskCompleted(false);
        nextIsRest = false;
        nextTimerSeconds = focusDefault;
        nextBreakDurationValue = shortBreakDefault;
        setBreakDuration(shortBreakDefault);
        setFocusDuration(focusDefault);
        setIsRest(false);
        setCurrentMessage(getSessionStartMessage());
        if (completedFocusSessionsRef.current >= focusSessionsPerCycle) {
          updatedFocusCount = 0;
        }
        setSelectedPreset(focusDefault);
      }

      shortBreakRef.current = shortBreakDefault;
      longBreakRef.current = longBreakDefault;
      focusCycleRef.current = focusSessionsPerCycle;

      completedFocusSessionsRef.current = updatedFocusCount;
      setCompletedFocusSessions((prev) =>
        prev === updatedFocusCount ? prev : updatedFocusCount
      );
      latestTimerSecondsRef.current = nextTimerSeconds;
      setTimerSeconds(nextTimerSeconds);
      setIsRunning(false);
      completionTriggeredRef.current = false;
      expectedTimerSecondsRef.current = null;

      const updatedState: TimerState = {
        ...(timerStateRef.current || initializeTimerState()),
        isRunning: false,
        isRest: nextIsRest,
        timerSeconds: nextTimerSeconds,
        focusDuration: focusDefault,
        breakDuration: nextBreakDurationValue,
        shortBreakDuration: shortBreakDefault,
        longBreakDuration: longBreakDefault,
        focusSessionsPerCycle,
        startTime: null,
        notificationId: null,
        lastActiveTime: now,
        completedFocusSessions: updatedFocusCount,
      };

      timerStateRef.current = updatedState;
      try {
        await saveTimerState(updatedState);
      } catch (error) {
        console.error("Error saving completion state:", error);
      }
    },
    [breakDuration, focusSessionsPerCycleSetting, onFocusComplete]
  );

  // Consolidated timer countdown effect with timestamp-based updates
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isRunning) {
      return;
    }

    const activeDuration = isRest ? breakDuration : focusDuration;

    if (!startTimestampRef.current) {
      const baselineSeconds = latestTimerSecondsRef.current;
      startTimestampRef.current =
        Date.now() - Math.max(0, activeDuration - baselineSeconds) * 1000;
    }

    const tick = () => {
      if (!startTimestampRef.current) {
        return;
      }

      if (isDurationUpdatingRef.current) {
        return;
      }

      const elapsedSeconds = Math.floor(
        (Date.now() - startTimestampRef.current) / 1000
      );
      const nextSeconds = Math.max(0, activeDuration - elapsedSeconds);

      if (
        expectedTimerSecondsRef.current !== null &&
        nextSeconds !== expectedTimerSecondsRef.current
      ) {
        return;
      }

      latestTimerSecondsRef.current = nextSeconds;
      setTimerSeconds(nextSeconds);

      if (timerStateRef.current) {
        timerStateRef.current = {
          ...timerStateRef.current,
          timerSeconds: nextSeconds,
        };
      }

      if (nextSeconds === 0) {
        if (!completionTriggeredRef.current) {
          completionTriggeredRef.current = true;
          void handleTimerCompletion(isRest);
        }
        startTimestampRef.current = null;
        setIsRunning(false);
      } else {
        completionTriggeredRef.current = false;
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, isRest, focusDuration, breakDuration, handleTimerCompletion]);

  // Update message based on current timer state
  const updateMessageBasedOnState = (running: boolean, rest: boolean) => {
    if (running) {
      setCurrentMessage(getResumeMessage());
    } else if (rest) {
      setCurrentMessage(getBreakMessage());
    } else {
      setCurrentMessage(getSessionStartMessage());

      // If starting after task completion, briefly show a "task start" expression
      if (taskCompleted) {
        // Reset task completed status
        setTaskCompleted(false);
      }
    }
  };
  // Safe function to update timer durations without causing flickering or freezing
  const updateTimerDuration = useCallback(
    async (isRestMode: boolean, newDuration: number) => {
      const sanitizedDuration = Math.max(60, Math.round(newDuration));
      isDurationUpdatingRef.current = true;

      const previousDuration = isRestMode ? breakDuration : focusDuration;
      const isEditingCurrentMode = isRestMode === isRest;
      const elapsedSeconds = isEditingCurrentMode
        ? Math.max(0, previousDuration - timerSeconds)
        : 0;
      const nextRemainingSeconds = isEditingCurrentMode
        ? Math.max(0, sanitizedDuration - elapsedSeconds)
        : timerSeconds;

      if (isRestMode) {
        setBreakDuration(sanitizedDuration);
        shortBreakRef.current = sanitizedDuration;
        initialBreakRef.current = sanitizedDuration;
      } else {
        setFocusDuration(sanitizedDuration);
        setSelectedPreset(sanitizedDuration);
        initialFocusRef.current = sanitizedDuration;
      }

      let updatedStartTime: number | null = null;

      if (isEditingCurrentMode) {
        latestTimerSecondsRef.current = nextRemainingSeconds;
        setTimerSeconds(nextRemainingSeconds);
        completionTriggeredRef.current = false;

        if (isRunning) {
          updatedStartTime =
            Date.now() - Math.min(elapsedSeconds, sanitizedDuration) * 1000;
          startTimestampRef.current = updatedStartTime;
        } else {
          startTimestampRef.current = null;
        }

        if (nextRemainingSeconds === 0) {
          setIsRunning(false);
        }
      }

      const overrides: Partial<TimerState> = {};
      if (isRestMode) {
        overrides.breakDuration = sanitizedDuration;
        overrides.shortBreakDuration = shortBreakRef.current;
        overrides.longBreakDuration = longBreakRef.current;
      } else {
        overrides.focusDuration = sanitizedDuration;
        overrides.shortBreakDuration = shortBreakRef.current;
        overrides.longBreakDuration = longBreakRef.current;
      }

      overrides.focusSessionsPerCycle = focusCycleRef.current;

      overrides.completedFocusSessions = completedFocusSessionsRef.current;

      if (isEditingCurrentMode) {
        overrides.timerSeconds = latestTimerSecondsRef.current;
        overrides.startTime = updatedStartTime;
      }

      if (isEditingCurrentMode) {
        expectedTimerSecondsRef.current = latestTimerSecondsRef.current;
      } else {
        expectedTimerSecondsRef.current = null;
      }

      try {
        await synchronizeTimerState(overrides);
      } finally {
        setTimeout(() => {
          isDurationUpdatingRef.current = false;
          expectedTimerSecondsRef.current = null;
        }, 150);
      }

      completionTriggeredRef.current = false;
    },
    [
      breakDuration,
      focusDuration,
      isRest,
      isRunning,
      synchronizeTimerState,
      timerSeconds,
    ]
  );

  const startTimer = async () => {
    const newRunningState = !isRunning;
    if (newRunningState) {
      completionTriggeredRef.current = false;
    }

    try {
      const activeDuration = isRest ? breakDuration : focusDuration;
      const baselineSeconds = latestTimerSecondsRef.current;
      const startTimestamp =
        newRunningState && baselineSeconds > 0
          ? startTimestampRef.current ??
            Date.now() - (activeDuration - baselineSeconds) * 1000
          : null;

      // Log which mode/duration will be used on start
      console.log(
        `[Timer] ${newRunningState ? "Starting" : "Pausing"} ${
          isRest ? "break" : "focus"
        } | using ${timerSeconds}s (focus:${focusDuration}s, break:${breakDuration}s)`
      );

      // Update UI state first for immediate feedback
      setIsRunning(newRunningState);
      if (newRunningState && taskCompleted) {
        setTaskCompleted(false);
      }

      // Synchronize state to ensure consistency
      const currentTimerState = await synchronizeTimerState({
        isRunning: newRunningState,
        startTime: startTimestamp,
        timerSeconds: baselineSeconds,
      });

      if (newRunningState) {
        // Starting the timer
        const modeLabel = isRest ? "break" : "focus";
        const configuredDuration = isRest ? breakDuration : focusDuration;
        console.log(
          `[START] mode=${modeLabel}, timerSeconds=${timerSeconds}, configuredDuration=${configuredDuration}`
        );
        console.log("Starting timer with duration:", timerSeconds);

        // Use timer service to start timer (schedules notification internally)
        const updatedState = await startTimerService({
          ...currentTimerState,
          isRunning: true,
        });
        timerStateRef.current = updatedState;
        startTimestampRef.current = updatedState.startTime;
        setNotificationId(updatedState.notificationId);
      } else {
        // Use timer service to pause timer
        const updatedState = await pauseTimerService({
          ...currentTimerState,
          isRunning: false,
        });
        timerStateRef.current = updatedState;
        startTimestampRef.current = null;

        if (notificationsPermission) {
          await cancelAllScheduledNotifications();
          setNotificationId(null);
        }
      }
    } catch (error) {
      console.error("Error handling timer state:", error);
      // Revert UI state if there was an error
      setIsRunning(!newRunningState);
    }

    updateMessageBasedOnState(newRunningState, isRest);
  };

  const pauseTimer = async () => {
    setIsRunning(false);
    startTimestampRef.current = null;
    latestTimerSecondsRef.current = timerSeconds;
    completionTriggeredRef.current = false;

    try {
      if (!timerStateRef.current) {
        timerStateRef.current = initializeTimerState();
      }

      const currentTimerState: TimerState = {
        ...timerStateRef.current,
        isRunning: false,
        isRest,
        timerSeconds,
        focusDuration,
        breakDuration,
        shortBreakDuration: shortBreakRef.current,
        longBreakDuration: longBreakRef.current,
        focusSessionsPerCycle: focusCycleRef.current,
        startTime: null,
        notificationId,
        lastActiveTime: Date.now(),
        completedFocusSessions: completedFocusSessionsRef.current,
      };

      const updatedState = await pauseTimerService(currentTimerState);
      timerStateRef.current = updatedState;
      startTimestampRef.current = updatedState.startTime;
      setTimerSeconds(updatedState.timerSeconds);
      latestTimerSecondsRef.current = updatedState.timerSeconds;

      if (notificationsPermission) {
        await cancelAllScheduledNotifications();
        setNotificationId(null);
      }

      updateMessageBasedOnState(false, isRest);
    } catch (error) {
      console.error("Error pausing timer:", error);
    }
  };

  // Toggle between focus and break sessions
  const toggleTimerMode = async () => {
    // Remember the current running state so we can restore it
    const wasRunningBeforeSwitch = isRunning;

    console.log(
      `Toggling timer mode from ${isRest ? "rest" : "focus"} to ${
        isRest ? "focus" : "rest"
      }`
    );

    try {
      // First, clean up any existing interval to prevent race conditions
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Cancel any existing notifications
      if (notificationsPermission && notificationId) {
        await cancelAllScheduledNotifications();
        setNotificationId(null);
      }

      // Pause the timer while making changes for better UI responsiveness
      if (wasRunningBeforeSwitch) {
        setIsRunning(false);
      }

      // Toggle between focus and rest mode
      const newIsRest = !isRest;
      setIsRest(newIsRest);
      startTimestampRef.current = null;
      completionTriggeredRef.current = false;
      if (taskCompleted) {
        setTaskCompleted(false);
      }

      // Set the appropriate timer based on the new mode
      const newDuration = newIsRest ? breakDuration : focusDuration;
      setTimerSeconds(newDuration);
      latestTimerSecondsRef.current = newDuration;
      setSelectedPreset(newDuration); // Keep selectedPreset updated for UI consistency

      // Update the message based on the new mode
      if (newIsRest) {
        setCurrentMessage(getBreakMessage());
        console.log("Switched to break mode with duration:", breakDuration);
      } else {
        setCurrentMessage(getSessionStartMessage());
        console.log("Switched to focus mode with duration:", focusDuration);
      }

      // Synchronize and update timer state
      await synchronizeTimerState();

      // Use timer service to switch mode with updated state
      const updatedState = await switchTimerModeService({
        ...(timerStateRef.current || initializeTimerState()),
        isRunning: false, // Start paused when switching modes
        isRest: newIsRest,
        timerSeconds: newDuration,
        focusDuration,
        breakDuration,
        shortBreakDuration: shortBreakRef.current,
        longBreakDuration: longBreakRef.current,
        focusSessionsPerCycle: focusCycleRef.current,
        startTime: null,
        notificationId: null,
        lastActiveTime: Date.now(),
        completedFocusSessions: completedFocusSessionsRef.current,
      });
      timerStateRef.current = updatedState;
      startTimestampRef.current = updatedState.startTime;

      // If the timer was running before, restart it after a short delay
      // to ensure all state updates have been processed
      if (wasRunningBeforeSwitch) {
        // Use requestAnimationFrame for smoother UI updates
        requestAnimationFrame(() => {
          setIsRunning(true);
        });
      }
    } catch (error) {
      console.error("Error toggling timer mode:", error);
    }
  };

  return {
    isRunning,
    isRest,
    timerSeconds,
    focusDuration,
    breakDuration,
    selectedPreset,
    notificationsPermission,
    taskCompleted,
    currentMessage,
    startTimer,
    pauseTimer,
    toggleTimerMode: toggleTimerMode,
    updateTimerDuration,
    formatTime,
  };
};
