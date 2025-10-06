import { useEffect, useRef, useState } from "react";
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
  sendTimerCompleteNotification,
} from "../utils/notificationService";
import { formatTime } from "../utils/timer/timerUtils";
import {
  calculateRemainingTime,
  handleAppStateChange,
  initializeTimerState,
  loadTimerState,
  pauseTimer as pauseTimerService,
  resetTimer as resetTimerService,
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

  // Consolidated timer countdown effect with robust interval management
  useEffect(() => {
    // Track the last tick time to handle potential delays
    let lastTickTime = Date.now();

    // Clean up any existing interval to prevent duplicates
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only start a new interval if the timer is running and has time remaining
    if (isRunning && timerSeconds > 0) {
      console.log(
        `Starting timer interval with ${timerSeconds} seconds remaining`
      );

      // Use setInterval with compensation for drift
      intervalRef.current = setInterval(() => {
        // Calculate elapsed time since last tick
        const now = Date.now();
        const elapsedMs = now - lastTickTime;
        lastTickTime = now;

        // Calculate how many seconds should have passed (accounting for delays)
        const elapsedSeconds = Math.floor(elapsedMs / 1000);

        // Update timer with a functional state update to avoid stale closures
        setTimerSeconds((prev: number) => {
          // Ensure we don't go below zero
          const newValue = Math.max(0, prev - Math.max(1, elapsedSeconds));
          return newValue;
        });
      }, 1000);
    }

    // Handle timer completion
    if (timerSeconds === 0 && isRunning) {
      // Timer has reached zero while running
      const handleTimerCompletion = async () => {
        try {
          // Cancel any scheduled notifications first
          await cancelAllScheduledNotifications();
          setNotificationId(null);

          if (!isRest) {
            // Focus timer completed, switch to rest mode
            console.log("Focus session completed, switching to break mode");

            // Send notification if app is in foreground (background notifications are handled separately)
            if (appStateRef.current === "active" && notificationsPermission) {
              await sendTimerCompleteNotification(false); // Focus completed
            }

            // Switch to rest mode
            setIsRest(true);
            setTimerSeconds(breakDuration);
            setCurrentMessage(getBreakMessage());

            // Update the timer state
            if (timerStateRef.current) {
              const updatedState = await switchTimerModeService(
                timerStateRef.current
              );
              timerStateRef.current = updatedState;
            }
          } else {
            // Break timer completed
            console.log("Break session completed");

            // Send notification if app is in foreground
            if (appStateRef.current === "active" && notificationsPermission) {
              await sendTimerCompleteNotification(true); // Break completed
            }

            // Stop the timer
            setIsRunning(false);

            // Reset timer state
            if (timerStateRef.current) {
              const updatedState = await resetTimerService(
                timerStateRef.current
              );
              timerStateRef.current = updatedState;
            }

            // Show task completed animation
            setTaskCompleted(true);
            setCurrentMessage(
              "Wow, you actually finished something. I'm shocked."
            );

            // Reset task completed status after 3 seconds
            setTimeout(() => {
              setTaskCompleted(false);
              setCurrentMessage(getSessionStartMessage());
            }, 3000);
          }
        } catch (error) {
          console.error("Error handling timer completion:", error);
        }
      };

      handleTimerCompletion();
    }

    // Save current timer state to maintain consistency
    const saveCurrentState = async () => {
      if (timerStateRef.current) {
        // Update the timer state with current UI state
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
      }
    };

    // Debounce saving state to avoid excessive writes
    const timeoutId = setTimeout(saveCurrentState, 1000);

    return () => {
      // Clean up interval and timeout on unmount or when dependencies change
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      clearTimeout(timeoutId);
    };
  }, [
    isRunning,
    timerSeconds,
    isRest,
    breakDuration,
    focusDuration,
    notificationsPermission,
    notificationId,
  ]);

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
  const updateTimerDuration = (isRestMode: boolean, newDuration: number) => {
    // Store the timer state before changes
    const wasRunning = isRunning;
    const currentMode = isRest;
    const currentSeconds = timerSeconds;
    const currentDuration = isRest ? breakDuration : focusDuration;

    console.log(
      `Updating ${isRestMode ? "break" : "focus"} duration from ${
        isRestMode ? breakDuration : focusDuration
      } to ${newDuration}`
    );

    // First, clear any existing interval to prevent race conditions
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Pause timer while making changes
    if (wasRunning) {
      setIsRunning(false);
    }

    // Calculate how much of the current timer has elapsed (as a percentage)
    let percentageComplete = 0;
    if (currentSeconds > 0 && currentDuration > 0) {
      percentageComplete = (currentDuration - currentSeconds) / currentDuration;
    }

    // Update the appropriate duration state and timer seconds based on the current mode
    if (isRestMode) {
      setBreakDuration(newDuration);

      // If we're in rest mode, we need to update the timer
      if (currentMode === true) {
        // Apply the same percentage of completion to the new duration
        const newSeconds = wasRunning
          ? Math.max(1, Math.round(newDuration * (1 - percentageComplete)))
          : newDuration;

        console.log(
          `Adjusting rest timer: ${currentSeconds}s → ${newSeconds}s (${Math.round(
            percentageComplete * 100
          )}% complete)`
        );
        setTimerSeconds(newSeconds);
        setSelectedPreset(newDuration);
      }
    } else {
      setFocusDuration(newDuration);

      // If we're in focus mode, we need to update the timer
      if (currentMode === false) {
        // Apply the same percentage of completion to the new duration
        const newSeconds = wasRunning
          ? Math.max(1, Math.round(newDuration * (1 - percentageComplete)))
          : newDuration;

        console.log(
          `Adjusting focus timer: ${currentSeconds}s → ${newSeconds}s (${Math.round(
            percentageComplete * 100
          )}% complete)`
        );
        setTimerSeconds(newSeconds);
        setSelectedPreset(newDuration);
      }
    }

    // Update timer state ref to avoid inconsistency
    if (timerStateRef.current) {
      timerStateRef.current = {
        ...timerStateRef.current,
        focusDuration: isRestMode ? focusDuration : newDuration,
        breakDuration: isRestMode ? newDuration : breakDuration,
        timerSeconds:
          currentMode === isRestMode
            ? wasRunning
              ? Math.max(1, Math.round(newDuration * (1 - percentageComplete)))
              : newDuration
            : timerSeconds,
        isRunning: false, // Will be set to true below if needed
        lastActiveTime: Date.now(),
      };
    }

    // If the timer was running, restart it after allowing state to update
    if (wasRunning) {
      // Use requestAnimationFrame to ensure DOM updates first
      requestAnimationFrame(() => {
        setIsRunning(true);
      });
    }
  };

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
