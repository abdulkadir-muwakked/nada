import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
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

  // Helper function to keep timer state synchronized
  const synchronizeTimerState = async () => {
    if (!timerStateRef.current) {
      timerStateRef.current = initializeTimerState();
    }

    const currentState: TimerState = {
      ...timerStateRef.current,
      isRunning,
      isRest,
      timerSeconds,
      focusDuration,
      breakDuration,
      startTime: isRunning
        ? Date.now() -
          ((isRest ? breakDuration : focusDuration) - timerSeconds) * 1000
        : null,
      notificationId,
      lastActiveTime: Date.now(),
    };

    await saveTimerState(currentState);
    timerStateRef.current = currentState;
    return currentState;
  };

  // Initialize notification permissions, streak data, and timer state
  useEffect(() => {
    const loadData = async () => {
      try {
        // Request notification permissions
        const hasPermission = await requestNotificationPermissions();
        setNotificationsPermission(hasPermission);
        console.log("Notification permission status:", hasPermission);

        // Load saved timer state if exists
        const savedTimerState = await loadTimerState();
        if (savedTimerState) {
          console.log("Restored timer state:", savedTimerState);

          // Update our component state with the saved timer state
          setIsRunning(savedTimerState.isRunning);
          setIsRest(savedTimerState.isRest);
          setFocusDuration(savedTimerState.focusDuration);
          setBreakDuration(savedTimerState.breakDuration);

          // Calculate remaining time based on when the timer was last active
          if (savedTimerState.isRunning && savedTimerState.startTime) {
            const remainingTime = calculateRemainingTime(
              savedTimerState.startTime,
              savedTimerState.isRest
                ? savedTimerState.breakDuration
                : savedTimerState.focusDuration,
              savedTimerState.lastActiveTime
            );
            setTimerSeconds(remainingTime);
          } else {
            setTimerSeconds(
              savedTimerState.isRest
                ? savedTimerState.breakDuration
                : savedTimerState.focusDuration
            );
          }

          // Store in our ref for later use
          timerStateRef.current = savedTimerState;
        } else {
          // Initialize timer state with defaults
          const initialState = initializeTimerState();
          initialState.focusDuration = focusDuration;
          initialState.breakDuration = breakDuration;
          timerStateRef.current = initialState;
          await saveTimerState(initialState);
        }
      } catch (error) {
        console.error("Error loading timer data:", error);
      }
    };

    loadData();
  }, [breakDuration, focusDuration]);

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

      const currentTimerState: TimerState = {
        ...timerStateRef.current,
        isRunning,
        isRest,
        timerSeconds,
        focusDuration,
        breakDuration,
        startTime: isRunning
          ? Date.now() -
            ((isRest ? breakDuration : focusDuration) - timerSeconds) * 1000
          : null,
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
          const finalState: TimerState = {
            ...timerStateRef.current,
            isRunning,
            isRest,
            timerSeconds,
            focusDuration,
            breakDuration,
            startTime: isRunning
              ? Date.now() -
                ((isRest ? breakDuration : focusDuration) - timerSeconds) * 1000
              : null,
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
    let isMounted = true;
    let startTime: number | null = null;
    let initialSeconds: number | null = null;

    const updateTimer = () => {
      if (!isMounted || !startTime || !initialSeconds) return;

      // Don't update if duration is being changed
      if (isDurationUpdatingRef.current) return;

      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      const newSeconds = Math.max(0, initialSeconds - elapsedSeconds);

      // Verify expected value if set
      if (
        expectedTimerSecondsRef.current !== null &&
        newSeconds !== expectedTimerSecondsRef.current
      ) {
        return;
      }

      setTimerSeconds(newSeconds);

      if (newSeconds === 0) {
        setIsRunning(false);
      }
    };

    if (isRunning && timerSeconds > 0) {
      startTime = Date.now();
      initialSeconds = timerSeconds;
      const intervalId = setInterval(updateTimer, 1000);

      return () => {
        isMounted = false;
        clearInterval(intervalId);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [isRunning, timerSeconds]);

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
      // Set updating flag and store expected value
      isDurationUpdatingRef.current = true;
      expectedTimerSecondsRef.current = newDuration;

      // Temporarily pause timer if running
      const wasRunning = isRunning;
      if (wasRunning) {
        setIsRunning(false);
        // Small delay to ensure the interval is cleared
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Update the timer seconds
      setTimerSeconds(newDuration);

      // Small delay to ensure state updates are processed
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Resume timer if it was running
      if (wasRunning) {
        setIsRunning(true);
      }

      // Clear stabilization flags after a small delay
      setTimeout(() => {
        isDurationUpdatingRef.current = false;
        expectedTimerSecondsRef.current = null;
      }, 100);
    },
    [isRunning]
  );

  const startTimer = async () => {
    const newRunningState = !isRunning;

    try {
      // Log which mode/duration will be used on start
      console.log(
        `[Timer] ${newRunningState ? "Starting" : "Pausing"} ${
          isRest ? "break" : "focus"
        } | using ${timerSeconds}s (focus:${focusDuration}s, break:${breakDuration}s)`
      );

      // Update UI state first for immediate feedback
      setIsRunning(newRunningState);

      // Synchronize state to ensure consistency
      const currentTimerState = await synchronizeTimerState();

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
        setNotificationId(updatedState.notificationId);
      } else {
        // Use timer service to pause timer
        const updatedState = await pauseTimerService({
          ...currentTimerState,
          isRunning: false,
        });
        timerStateRef.current = updatedState;

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

      // Set the appropriate timer based on the new mode
      const newDuration = newIsRest ? breakDuration : focusDuration;
      setTimerSeconds(newDuration);
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
