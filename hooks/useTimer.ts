import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Haptics from "expo-haptics";
import {
  getBreakMessage,
  getResumeMessage,
  getSessionStartMessage,
} from "../constants/AuthMessages";
import {
  DEFAULT_REST_PRESET,
  TIMER_PRESETS,
} from "../constants/timerConstants";
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
  initialFocusDuration = TIMER_PRESETS[1].value, // Default 25m
  initialBreakDuration = DEFAULT_REST_PRESET.value, // Default 5m
}: UseTimerProps = {}): UseTimerReturn => {
  const initialFocusRef = useRef(initialFocusDuration);
  const initialBreakRef = useRef(initialBreakDuration);

  // Reference to app state
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Refs for timer stabilization
  const isDurationUpdatingRef = useRef<boolean>(false);
  const expectedTimerSecondsRef = useRef<number | null>(null);

  // Timer state
  const [focusDuration, setFocusDuration] =
    useState<number>(initialFocusDuration);
  const [breakDuration, setBreakDuration] =
    useState<number>(initialBreakDuration);
  const [selectedPreset, setSelectedPreset] =
    useState<number>(initialFocusDuration);
  const [timerSeconds, setTimerSeconds] = useState<number>(selectedPreset);
  const [isRunning, setIsRunning] = useState(false);
  const [isRest, setIsRest] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string>(
    getSessionStartMessage()
  );
  const [taskCompleted, setTaskCompleted] = useState<boolean>(false);

  // Notification state
  const [notificationsPermission, setNotificationsPermission] =
    useState<boolean>(false);
  const [notificationId, setNotificationId] = useState<string | null>(null);

  // Refs for timer management
  const timerStateRef = useRef<TimerState | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimestampRef = useRef<number | null>(null);
  const latestTimerSecondsRef = useRef<number>(selectedPreset);
  const completionTriggeredRef = useRef<boolean>(false);

  useEffect(() => {
    latestTimerSecondsRef.current = timerSeconds;
  }, [timerSeconds]);

  useEffect(() => {
    if (isRunning) {
      completionTriggeredRef.current = false;
    }
  }, [isRunning]);

  // Helper function to keep timer state synchronized
  const synchronizeTimerState = async (overrides: Partial<TimerState> = {}) => {
    if (!timerStateRef.current) {
      timerStateRef.current = initializeTimerState();
    }

    const isRunningState = overrides.isRunning ?? isRunning;
    const isRestState = overrides.isRest ?? isRest;
    const focusValue = overrides.focusDuration ?? focusDuration;
    const breakValue = overrides.breakDuration ?? breakDuration;
    const secondsValue = overrides.timerSeconds ?? timerSeconds;
    const notificationValue = overrides.notificationId ?? notificationId;
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
      startTime: startTimeValue,
      notificationId: notificationValue,
      lastActiveTime: Date.now(),
    };

    await saveTimerState(currentState);
    timerStateRef.current = currentState;
    return currentState;
  };

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
          };
        } else {
          // Initialize timer state with defaults
          const initialState = initializeTimerState();
          initialState.focusDuration = initialFocusRef.current;
          initialState.breakDuration = initialBreakRef.current;
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

      const baseState = timerStateRef.current || initializeTimerState();
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

      const currentTimerState: TimerState = {
        ...baseState,
        isRunning,
        isRest,
        timerSeconds,
        focusDuration,
        breakDuration,
        startTime: derivedStartTime,
        notificationId,
        lastActiveTime: Date.now(),
      };

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
            startTime,
            notificationId,
            lastActiveTime: Date.now(),
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

      setTaskCompleted(true);
      latestTimerSecondsRef.current = 0;
      setTimerSeconds(0);

      if (restModeCompleted) {
        setCurrentMessage(getResumeMessage());
      } else {
        setCurrentMessage(getBreakMessage());
      }

      try {
        await synchronizeTimerState({
          isRunning: false,
          timerSeconds: 0,
          notificationId: null,
          startTime: null,
        });
      } catch (error) {
        console.error("Error synchronizing completion state:", error);
      }
    },
    [getBreakMessage, getResumeMessage, synchronizeTimerState]
  );

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
      } else {
        setFocusDuration(sanitizedDuration);
        setSelectedPreset(sanitizedDuration);
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
      } else {
        overrides.focusDuration = sanitizedDuration;
      }

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
        startTime: null,
        notificationId,
        lastActiveTime: Date.now(),
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
        startTime: null,
        notificationId: null,
        lastActiveTime: Date.now(),
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
