import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Animated,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CircularProgress from "../../components/CircularProgress";
import NadaCharacter from "../../components/NadaCharacter";
import NadaLogo from "../../components/NadaLogo";
import { SignOutButton } from "../../components/SignOutButton";
import SpeechBubble from "../../components/SpeechBubble";
import {
  getBreakMessage,
  getResumeMessage,
  getSessionStartMessage,
} from "../../constants/AuthMessages";
import { NadaTheme } from "../../constants/NadaTheme";
import {
  initializeStreak,
  recordCompletedSession,
} from "../../utils/streakManager";
// Import from new sessionUtil file instead
import {
  initializeSessions,
  recordCompletedFocusSession,
} from "../../utils/sessionUtil";

const NadaHomeScreen = () => {
  // Fix: useMemo for Animated.Value to avoid changing reference every render
  const scaleAnim = React.useMemo(() => new Animated.Value(1), []);
  const router = useRouter();
  const { isSignedIn } = useAuth();

  // Timer presets
  const TIMER_PRESETS = [
    { label: "15m", value: 15 * 60 },
    { label: "25m", value: 25 * 60 },
    { label: "45m", value: 45 * 60 },
  ];
  const REST_PRESET = { label: "Rest 5m", value: 5 * 60 };

  // Add separate state variables for focus and break durations
  const [focusDuration, setFocusDuration] = useState<number>(
    TIMER_PRESETS[1].value
  ); // Default 25m
  const [breakDuration, setBreakDuration] = useState<number>(REST_PRESET.value); // Default 5m
  const [selectedPreset, setSelectedPreset] = useState<number>(
    TIMER_PRESETS[1].value
  ); // Default 25m
  const [timerSeconds, setTimerSeconds] = useState<number>(selectedPreset);
  const [isRunning, setIsRunning] = useState(false);
  const [isRest, setIsRest] = useState(false);
  // Note: custom time handling is now managed within the TimerPresets component

  const [currentSession, setCurrentSession] = useState<number>(0);
  const [sessionGoal, setSessionGoal] = useState<number>(4);
  const [streak, setStreak] = useState<number>(0);
  const [currentMessage, setCurrentMessage] = useState<string>(
    getSessionStartMessage()
  );
  const [taskCompleted, setTaskCompleted] = useState<boolean>(false);

  // Initialize timer when component mounts
  useEffect(() => {
    // Set initial timer values
    setTimerSeconds(focusDuration);
    console.log("Initial timer setup - focus duration:", focusDuration, "break duration:", breakDuration);
  }, [focusDuration, breakDuration]);

  // Initialize streak and session data when app loads
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load streak data
        const currentStreak = await initializeStreak();
        setStreak(currentStreak);

        // Load sessions data
        const { sessionsCount, sessionGoal: goal } = await initializeSessions();
        setCurrentSession(sessionsCount);
        setSessionGoal(goal);
      } catch (error) {
        console.error("Error loading app data:", error);
      }
    };

    loadData();
  }, []);

  // When preset changes, update timer
  useEffect(() => {
    // Use the appropriate duration based on mode
    if (isRest) {
      setTimerSeconds(breakDuration);
      console.log("Setting timer to break duration:", breakDuration);
    } else {
      setTimerSeconds(focusDuration);
      console.log("Setting timer to focus duration:", focusDuration);
    }
  }, [focusDuration, breakDuration, isRest]);

  // Timer countdown effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (!isRunning && interval) {
      clearInterval(interval);
    }
    if (timerSeconds === 0 && isRunning) {
      if (!isRest) {
        // Timer completed, switch to rest
        setIsRest(true);
        // Use breakDuration instead of selectedPreset
        setTimerSeconds(breakDuration);
        // Update message for break time
        setCurrentMessage(getBreakMessage());
        console.log("Focus session completed, switching to break mode with duration:", breakDuration);

        // Record a completed focus session and update streak and sessions count
        const updateCounts = async () => {
          try {
            // Update streak count
            const updatedStreak = await recordCompletedSession();
            setStreak(updatedStreak);

            // Update sessions count
            const updatedSessions = await recordCompletedFocusSession();
            setCurrentSession(updatedSessions);
          } catch (error) {
            console.error("Error updating counts:", error);
          }
        };
        updateCounts();
      } else {
        // Rest completed
        setIsRunning(false);
        // Show task completed expression briefly
        setTaskCompleted(true);
        // Custom sarcastic completion message
        setCurrentMessage("Wow, you actually finished something. I'm shocked.");
        // Reset task completed status after 3 seconds
        setTimeout(() => {
          setTaskCompleted(false);
          // Return to default message
          setCurrentMessage(getSessionStartMessage());
        }, 3000);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timerSeconds, isRest, breakDuration]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Note: Custom time and preset selection functionality has been moved to the TimerPresets component
  // The component will directly update the state as needed

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

  const handlePlayPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    const newRunningState = !isRunning;
    setIsRunning(newRunningState);

    // If starting a new focus session, briefly show taskStart expression
    if (newRunningState && !isRest) {
      // This state variable will be used in the NadaCharacter expression prop
      const isStarting = true;

      // We're using the variable to make the compiler happy, but the real effect
      // is from the re-render when setting isRunning
      console.log("Starting new focus session", isStarting);
    }

    // Update the message when user clicks play/pause
    updateMessageBasedOnState(newRunningState, isRest);
  };

  const handleMotivatePress = () => {
    // Get a new motivational message based on current timer state
    if (isSignedIn) {
      if (isRest) {
        setCurrentMessage(getBreakMessage());
      } else if (isRunning) {
        setCurrentMessage(getResumeMessage());
      } else {
        setCurrentMessage(getSessionStartMessage());
      }
    }
  };

  // Handle navigation to auth screens
  const handleAuthPress = (screen: "sign-in" | "sign-up") => {
    router.push(`/${screen}`);
  };

  // Toggle between focus and break sessions
  const toggleSessionMode = () => {
    // Apply button press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Remember the current running state so we can restore it
    const wasRunning = isRunning;

    // Pause the timer while we make changes
    if (wasRunning) {
      setIsRunning(false);
    }

    // Toggle between focus and rest mode
    const newIsRest = !isRest;
    setIsRest(newIsRest);

    // Set the appropriate timer based on the new mode
    if (newIsRest) {
      // Switching to break mode
      setTimerSeconds(breakDuration);
      setSelectedPreset(breakDuration); // Keep selectedPreset updated for UI consistency
      setCurrentMessage(getBreakMessage());
      console.log("Switched to break mode with duration:", breakDuration);
    } else {
      // Switching to focus mode
      setTimerSeconds(focusDuration);
      setSelectedPreset(focusDuration); // Keep selectedPreset updated for UI consistency
      setCurrentMessage(getSessionStartMessage());
      console.log("Switched to focus mode with duration:", focusDuration);
    }

    // Force update the timer display to reflect the new mode immediately
    // This helps ensure proper visual feedback
    setTimeout(() => {
      // This triggers a re-render with the new mode properly applied
      setTimerSeconds((prev) => prev);
    }, 0);

    // If the timer was already running, restart it in the new mode after a brief pause
    if (wasRunning) {
      // Use setTimeout to ensure state updates complete before restarting
      setTimeout(() => {
        setIsRunning(true);
      }, 100);
    }
  };

  // Get appropriate session message based on timer state
  const getTimerStateMessage = (): string => {
    return currentMessage;
  };

  // Using the reusable SpeechBubble component

  // TimerDisplay with just the timer display
  const TimerDisplay = () => {
    // Calculate normalized progress based on timer mode
    // Focus mode: progress = remaining time / total time (starts at 1, ends at 0)
    // Break mode: progress = elapsed time / total time = 1 - (remaining time / total time) (starts at 0, ends at 1)
    const normalizedProgress = isRest
      ? 1 - timerSeconds / breakDuration // Break mode: starts empty (0), ends full (1)
      : timerSeconds / focusDuration; // Focus mode: starts full (1), ends empty (0)
      
    console.log("Progress calculation:", { 
      isRest, 
      timerSeconds, 
      focusDuration, 
      breakDuration, 
      progress: normalizedProgress 
    });

    // Get label based on current state with expressive language
    // This ensures the correct label is always displayed based on the actual mode
    const getTimerLabel = () => {
      if (taskCompleted) return "NICE JOB!";
      if (isRest) return "REST TIME"; // Explicitly tied to isRest state
      if (isRunning) return isRest ? "RESTING" : "FOCUSING"; // Clear distinction
      return "READY?";
    };

    // Determine the progress color based on task completion state
    const progressColor = taskCompleted ? NadaTheme.colors.primary : "#ff6b6b";

    return (
      <View style={styles.timerContainer}>
        <CircularProgress
          progress={normalizedProgress}
          mode={isRest ? "break" : "focus"}
          size={180}
          strokeWidth={6}
          backgroundColor="rgba(255, 255, 255, 0.1)"
          progressColor={progressColor}
          animated={isRunning}
        />
        <View style={styles.timerDisplay}>
          <Text style={styles.timerTime}>{formatTime(timerSeconds)}</Text>
          <Text
            style={[
              styles.timerLabel,
              taskCompleted && { color: NadaTheme.colors.primary },
            ]}
          >
            {getTimerLabel()}
          </Text>
        </View>
      </View>
    );
  };

  // Separate component for timer presets with dropdown style
  const TimerPresets = () => {
    // State for dropdown visibility
    const [isFocusDropdownOpen, setIsFocusDropdownOpen] = useState(false);
    const [isRestDropdownOpen, setIsRestDropdownOpen] = useState(false);

    // State for custom time inputs
    const [customFocusTime, setCustomFocusTime] = useState("");
    const [customRestTime, setCustomRestTime] = useState("");

    // Get the currently selected preset label for display
    const getSelectedFocusLabel = () => {
      // Always use focusDuration for the Focus label, regardless of current mode
      // Find the matching preset
      const matchingPreset = TIMER_PRESETS.find(
        (p) => p.value === focusDuration
      );
      if (matchingPreset) return matchingPreset.label;

      // If no match, must be custom time
      const minutes = Math.floor(focusDuration / 60);
      return `${minutes}m`;
    };

    const getSelectedRestLabel = () => {
      // Always use breakDuration for the Rest label, regardless of current mode
      // Check against standard break durations
      if (breakDuration === 5 * 60) return "5m";
      if (breakDuration === 10 * 60) return "10m";
      if (breakDuration === 15 * 60) return "15m";

      // If custom time
      const minutes = Math.floor(breakDuration / 60);
      return `${minutes}m`;
    };

    // Handlers for custom time inputs
    const handleCustomFocusTimeChange = (text: string) => {
      setCustomFocusTime(text);
      const num = parseInt(text, 10);
      if (!isNaN(num) && num > 0) {
        const seconds = num * 60;
        // Always update focus duration
        setFocusDuration(seconds);
        console.log("Custom focus duration set to:", seconds);
        
        // Only apply immediately if focus is selected
        if (!isRest) {
          setSelectedPreset(seconds);
          setTimerSeconds(seconds);
          setCurrentMessage(getSessionStartMessage());
          setIsRunning(false);
        }
        setIsFocusDropdownOpen(false);
      }
    };

    const handleCustomRestTimeChange = (text: string) => {
      setCustomRestTime(text);
      const num = parseInt(text, 10);
      if (!isNaN(num) && num > 0) {
        const seconds = num * 60;
        // Always update break duration
        setBreakDuration(seconds);
        console.log("Custom break duration set to:", seconds);
        
        // Only apply immediately if rest is selected
        if (isRest) {
          setSelectedPreset(seconds);
          setTimerSeconds(seconds);
          setCurrentMessage(getBreakMessage());
          setIsRunning(false);
        }
        setIsRestDropdownOpen(false);
      }
    };

    // Handle focus preset selection
    const handleFocusPresetSelect = (value: number) => {
      // Always update the focus duration
      setFocusDuration(value);
      console.log("Focus duration updated to:", value);
      
      if (!isRest) {
        // Already in focus mode, update the current timer
        setSelectedPreset(value);
        setTimerSeconds(value);
      } else {
        // Switch from rest to focus
        setIsRest(false);
        setSelectedPreset(value);
        setTimerSeconds(value);
        setCurrentMessage(getSessionStartMessage());
      }

      // Close the dropdown
      setIsFocusDropdownOpen(false);

      // If running, briefly pause
      if (isRunning) {
        setIsRunning(false);
        setTimeout(() => {
          setIsRunning(true);
        }, 100);
      }
    };

    // Handle rest preset selection
    const handleRestPresetSelect = (value: number) => {
      // Always update the break duration
      setBreakDuration(value);
      console.log("Break duration updated to:", value);
      
      if (isRest) {
        // Already in rest mode, update the current timer
        setSelectedPreset(value);
        setTimerSeconds(value);
      } else {
        // Switch from focus to rest
        setIsRest(true);
        setSelectedPreset(value);
        setTimerSeconds(value);
        setCurrentMessage(getBreakMessage());
      }

      // Close the dropdown
      setIsRestDropdownOpen(false);

      // If running, briefly pause
      if (isRunning) {
        setIsRunning(false);
        setTimeout(() => {
          setIsRunning(true);
        }, 100);
      }
    };

    // Close dropdowns when clicking outside
    const closeDropdowns = () => {
      setIsFocusDropdownOpen(false);
      setIsRestDropdownOpen(false);
    };

    // Animation values for smooth dropdown transitions
    const focusDropdownAnim = React.useRef(new Animated.Value(0)).current;
    const restDropdownAnim = React.useRef(new Animated.Value(0)).current;

    // Using TouchableOpacity with activeOpacity={1} and onPress={closeDropdowns}
    // to handle outside touches to close the dropdowns

    // Animate dropdown opening/closing with spring animation for more natural feel
    React.useEffect(() => {
      Animated.spring(focusDropdownAnim, {
        toValue: isFocusDropdownOpen ? 1 : 0,
        friction: 8, // Higher friction = less oscillation
        tension: 40, // Lower tension = slower animation
        useNativeDriver: false,
      }).start();
    }, [isFocusDropdownOpen, focusDropdownAnim]);

    React.useEffect(() => {
      Animated.spring(restDropdownAnim, {
        toValue: isRestDropdownOpen ? 1 : 0,
        friction: 8,
        tension: 40,
        useNativeDriver: false,
      }).start();
    }, [isRestDropdownOpen, restDropdownAnim]);

    // Calculate dropdown heights and opacity for animation
    const focusDropdownHeight = focusDropdownAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 180], // Approximate height of the dropdown content
    });

    const restDropdownHeight = restDropdownAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 180], // Approximate height of the dropdown content
    });

    const focusDropdownOpacity = focusDropdownAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.8, 1], // Fade in faster than the height animation
    });

    const restDropdownOpacity = restDropdownAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.8, 1],
    });

    // Rest presets
    const REST_PRESETS = [
      { label: "5m", value: 5 * 60 },
      { label: "10m", value: 10 * 60 },
      { label: "15m", value: 15 * 60 },
    ];

    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={closeDropdowns}
        style={styles.presetsContainer}
      >
        <Text style={styles.presetsTitle}>Timer Settings</Text>

        <View style={styles.dropdownsContainer}>
          {/* Focus Time Dropdown */}
          <View style={styles.dropdownWrapper}>
            <Text style={styles.dropdownLabel}>Focus</Text>
            <TouchableOpacity
              style={[
                styles.dropdownHeader,
                isFocusDropdownOpen && styles.dropdownHeaderActive,
                !isRest && styles.dropdownHeaderSelected,
              ]}
              onPress={(e) => {
                e.stopPropagation();
                setIsRestDropdownOpen(false);
                setIsFocusDropdownOpen(!isFocusDropdownOpen);
              }}
            >
              <Text style={styles.dropdownHeaderText}>
                {getSelectedFocusLabel()}
              </Text>
              <Text style={styles.dropdownArrow}>
                {isFocusDropdownOpen ? "▲" : "▼"}
              </Text>
            </TouchableOpacity>

            <Animated.View
              style={[
                styles.dropdownContent,
                {
                  maxHeight: focusDropdownHeight,
                  opacity: focusDropdownOpacity,
                },
              ]}
            >
              {TIMER_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.label}
                  style={[
                    styles.dropdownItem,
                    focusDuration === preset.value && styles.dropdownItemActive,
                  ]}
                  onPress={() => handleFocusPresetSelect(preset.value)}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      focusDuration === preset.value && styles.dropdownItemTextActive,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}

              <View style={styles.customInputContainer}>
                <TextInput
                  style={styles.dropdownCustomInput}
                  value={customFocusTime}
                  onChangeText={setCustomFocusTime}
                  placeholder="Custom (min)"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  keyboardType="numeric"
                  maxLength={3}
                  onEndEditing={() =>
                    handleCustomFocusTimeChange(customFocusTime)
                  }
                />
                <TouchableOpacity
                  style={styles.customApplyButton}
                  onPress={() => handleCustomFocusTimeChange(customFocusTime)}
                >
                  <Text style={styles.customApplyText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>

          {/* Rest Time Dropdown */}
          <View style={styles.dropdownWrapper}>
            <Text style={styles.dropdownLabel}>Rest</Text>
            <TouchableOpacity
              style={[
                styles.dropdownHeader,
                isRestDropdownOpen && styles.dropdownHeaderActive,
                isRest && styles.dropdownHeaderSelected,
              ]}
              onPress={(e) => {
                e.stopPropagation();
                setIsFocusDropdownOpen(false);
                setIsRestDropdownOpen(!isRestDropdownOpen);
              }}
            >
              <Text style={styles.dropdownHeaderText}>
                {getSelectedRestLabel()}
              </Text>
              <Text style={styles.dropdownArrow}>
                {isRestDropdownOpen ? "▲" : "▼"}
              </Text>
            </TouchableOpacity>

            <Animated.View
              style={[
                styles.dropdownContent,
                { maxHeight: restDropdownHeight, opacity: restDropdownOpacity },
              ]}
            >
              {REST_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.label}
                  style={[
                    styles.dropdownItem,
                    breakDuration === preset.value && styles.dropdownItemActive,
                  ]}
                  onPress={() => handleRestPresetSelect(preset.value)}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      breakDuration === preset.value && styles.dropdownItemTextActive,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}

              <View style={styles.customInputContainer}>
                <TextInput
                  style={styles.dropdownCustomInput}
                  value={customRestTime}
                  onChangeText={setCustomRestTime}
                  placeholder="Custom (min)"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  keyboardType="numeric"
                  maxLength={3}
                  onEndEditing={() =>
                    handleCustomRestTimeChange(customRestTime)
                  }
                />
                <TouchableOpacity
                  style={styles.customApplyButton}
                  onPress={() => handleCustomRestTimeChange(customRestTime)}
                >
                  <Text style={styles.customApplyText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const SessionInfo = () => (
    <View style={styles.sessionInfo}>
      <View style={styles.sessionItem}>
        <Text style={styles.sessionNumber}>{currentSession}</Text>
        <Text style={styles.sessionText}>sessions</Text>
      </View>
      <View style={styles.sessionItem}>
        <Text style={styles.sessionNumber}>{sessionGoal}</Text>
        <Text style={styles.sessionText}>goal</Text>
      </View>
    </View>
  );

  const Controls = () => (
    <View style={styles.controls}>
      <View>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[
              styles.controlBtn,
              isRest && styles.restModeBtn,
              !isRest && styles.focusModeBtn,
            ]}
            onPress={toggleSessionMode}
            accessibilityLabel={
              isRest ? "Switch to focus mode" : "Switch to break mode"
            }
          >
            <Text style={styles.controlIcon}>{isRest ? "📚" : "☕️"}</Text>
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.buttonLabel}>{isRest ? "Focus" : "Break"}</Text>
      </View>

      <View>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[styles.controlBtn, styles.primaryBtn]}
            onPress={handlePlayPress}
            accessibilityLabel={isRunning ? "Pause timer" : "Start timer"}
          >
            <Text style={styles.controlIcon}>{isRunning ? "⏸️" : "▶️"}</Text>
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.buttonLabel}>{isRunning ? "Pause" : "Start"}</Text>
      </View>

      <View>
        <TouchableOpacity
          style={styles.controlBtn}
          accessibilityLabel="Skip to next"
        >
          <Text style={styles.controlIcon}>⏭️</Text>
        </TouchableOpacity>
        <Text style={styles.buttonLabel}>Skip</Text>
      </View>
    </View>
  );

  // Bottom navigation removed

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={NadaTheme.colors.background}
        translucent={false}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <NadaLogo size="medium" />
        </View>
        <View style={styles.headerRight}>
          {isSignedIn ? (
            <View style={styles.authButtonsContainer}>
              <TouchableOpacity
                style={styles.authButton}
                onPress={() =>
                  console.log("Profile functionality not implemented")
                }
              >
                <Text style={styles.authButtonText}>Profile</Text>
              </TouchableOpacity>
              <View style={styles.signOutButtonContainer}>
                <SignOutButton />
              </View>
            </View>
          ) : (
            <View style={styles.authButtonsContainer}>
              <TouchableOpacity
                style={styles.authButton}
                onPress={() => handleAuthPress("sign-in")}
              >
                <Text style={styles.authButtonText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.authButton, styles.authButtonSecondary]}
                onPress={() => handleAuthPress("sign-up")}
              >
                <Text style={styles.authButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Status Bar - Shows streak and auth status */}
      <View style={styles.statusBarContainer}>
        <View style={styles.streakCounter}>
          <Text style={styles.streakText}>{streak} day streak</Text>
        </View>
        {/* 
        {isSignedIn && (
          <View style={styles.authStatusIndicator}>
            {/* <View style={styles.statusDot} /> */}
        {/* <Text style={styles.statusText}>Signed In</Text> */}
        {/* </View> */}
        {/* )} */}
        {/*  */}
      </View>

      {/* Main Content - Now Scrollable */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.mainContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <NadaCharacter
          expression={
            !isSignedIn
              ? "neutral"
              : taskCompleted
              ? "taskComplete"
              : !isRunning && !isRest
              ? "neutral"
              : // When the timer just started, briefly show the taskStart expression
              isRunning && !isRest && timerSeconds === selectedPreset
              ? "taskStart"
              : isRunning && !isRest
              ? "focusOngoing"
              : isRest
              ? "breakTime"
              : "neutral"
          }
        />
        <SpeechBubble
          message={
            isSignedIn
              ? getTimerStateMessage()
              : "Sign in if you must. I'll judge your productivity either way."
          }
        />
        <TimerDisplay />
        <TimerPresets />
        <SessionInfo />
        <Controls />

        <TouchableOpacity
          style={styles.motivateBtn}
          onPress={handleMotivatePress}
        >
          <Text style={styles.motivateText}>
            {isSignedIn
              ? "Actually motivate me 🙄"
              : "Sign in for more features 🙄"}
          </Text>
        </TouchableOpacity>

        {!isSignedIn && (
          <View style={styles.authPromptContainer}>
            <Text style={styles.authPromptText}>
              Sign in to track your productivity progress.
            </Text>
            <View style={styles.authPromptButtonsContainer}>
              <TouchableOpacity
                style={styles.authPromptButton}
                onPress={() => handleAuthPress("sign-in")}
              >
                <Text style={styles.authPromptButtonText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.authPromptButton,
                  styles.authPromptButtonSecondary,
                ]}
                onPress={() => handleAuthPress("sign-up")}
              >
                <Text style={styles.authPromptButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NadaTheme.colors.background,
    width: "100%",
    height: "100%",
    position: "relative",
  },

  // New dropdown styles
  dropdownsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 15,
  },

  dropdownWrapper: {
    width: "48%",
  },

  dropdownLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
    paddingLeft: 4,
  },

  dropdownHeader: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 15,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },

  dropdownHeaderActive: {
    borderColor: "rgba(255, 255, 255, 0.4)",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },

  dropdownHeaderSelected: {
    backgroundColor: "rgba(255, 107, 107, 0.2)",
    borderColor: "rgba(255, 107, 107, 0.4)",
  },

  dropdownHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },

  dropdownArrow: {
    fontSize: 12,
    color: "#ffffff",
    opacity: 0.8,
  },

  dropdownContent: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    marginTop: 5,
    overflow: "hidden",
    zIndex: 10,
    position: "absolute",
    top: 45, // Position below the header
    left: 0,
    right: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
  },

  dropdownItemActive: {
    backgroundColor: "rgba(255, 107, 107, 0.3)",
  },

  dropdownItemText: {
    fontSize: 15,
    color: "#ffffff",
    fontWeight: "500",
  },

  dropdownItemTextActive: {
    fontWeight: "600",
  },

  customInputContainer: {
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dropdownCustomInput: {
    flex: 1,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    color: "#ffffff",
    marginRight: 8,
    fontSize: 14,
  },

  customApplyButton: {
    backgroundColor: "rgba(255, 107, 107, 0.8)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  customApplyText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },

  scrollContainer: {
    flex: 1,
    width: "100%",
    backgroundColor: NadaTheme.colors.background,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
  },

  headerLeft: {
    // flex: 1,
    paddingHorizontal: 15,
    // gap: 12,
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  authButtonsContainer: {
    flexDirection: "row",
    gap: 8,
  },

  authButton: {
    backgroundColor: NadaTheme.colors.overlay,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: NadaTheme.colors.overlayBorder,
  },

  authButtonSecondary: {
    backgroundColor: NadaTheme.colors.highlight,
    borderColor: NadaTheme.colors.highlightBorder,
  },

  authButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: NadaTheme.colors.text,
  },

  signOutButtonContainer: {
    // This will be used to style the SignOutButton wrapper
  },

  streakCounter: {
    backgroundColor: "rgba(255, 107, 107, 0.15)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.3)",
  },

  streakText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ff6b6b",
  },

  statusBarContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
    gap: 15,
  },

  authStatusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(46, 213, 115, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(46, 213, 115, 0.3)",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2ed573",
  },

  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#2ed573",
  },

  mainContent: {
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 15,
    paddingBottom: 30, // Reduced padding since the nav bar is removed
    minHeight: "100%", // Ensures content fills the ScrollView even if content is short
    backgroundColor: NadaTheme.colors.background, // Ensure consistent background color
  },

  speechBubble: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: 30,
    maxWidth: 280,
    position: "relative",
  },

  speechTriangle: {
    position: "absolute",
    top: -8,
    left: "50%",
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },

  nadaText: {
    fontSize: 16,
    color: "#e0e0e0",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 22,
  },

  timerContainer: {
    position: "relative",
    width: 180,
    height: 180,
    marginBottom: 10,
  },

  progressContainer: {
    width: 180,
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 90,
  },

  timerCircle: {
    width: 180,
    height: 180,
    borderWidth: 6,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 90,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },

  timerProgress: {
    position: "absolute",
    top: -6,
    left: -6,
    width: 180,
    height: 180,
    borderWidth: 6,
    borderColor: "transparent",
    borderTopColor: "#ff6b6b",
    borderRadius: 90,
  },

  timerDisplay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },

  timerTime: {
    fontSize: 36,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 5,
  },

  timerLabel: {
    fontSize: 14,
    color: "#a0a0a0",
    fontWeight: "500",
  },

  // New preset styles
  presetsContainer: {
    width: "100%",
    marginTop: 15,
    marginBottom: 15,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },

  presetsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 15,
    textAlign: "center",
  },

  presetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  presetCard: {
    width: "48%",
    padding: 15,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },

  presetCardActive: {
    backgroundColor: "#ff6b6b",
    borderColor: "#ff6b6b",
  },

  presetCardText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },

  presetCardTextActive: {
    color: "#1a1a2e",
  },

  customTimeContainer: {
    marginTop: 10,
    alignItems: "center",
  },

  customLabel: {
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 10,
    fontWeight: "500",
  },

  customInput: {
    width: "50%",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#ffffff",
    textAlign: "center",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },

  // Keep original styles for backward compatibility
  presetRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },

  presetBtn: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: 5,
  },

  presetBtnActive: {
    backgroundColor: "#ff6b6b",
  },

  presetText: {
    fontSize: 14,
    color: "#ffffff",
  },

  presetTextActive: {
    color: "#1a1a2e",
  },

  customInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  sessionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
    marginBottom: 20,
  },

  sessionItem: {
    alignItems: "center",
  },

  sessionNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ff6b6b",
  },

  sessionText: {
    fontSize: 12,
    color: "#a0a0a0",
    marginTop: 2,
  },

  controls: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 30,
  },

  controlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  primaryBtn: {
    backgroundColor: "#ff6b6b",
    borderWidth: 0,
    shadowColor: "#ff6b6b",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 5,
  },

  controlIcon: {
    fontSize: 24,
  },

  motivateBtn: {
    width: 280,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  motivateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },

  // Button styles for mode toggling
  focusModeBtn: {
    backgroundColor: "rgba(25, 118, 210, 0.4)",
    borderColor: "rgba(25, 118, 210, 0.6)",
  },

  restModeBtn: {
    backgroundColor: "rgba(76, 175, 80, 0.4)",
    borderColor: "rgba(76, 175, 80, 0.6)",
  },

  buttonLabel: {
    fontSize: 12,
    color: "#a0a0a0",
    marginTop: 4,
    textAlign: "center",
  },

  authPromptContainer: {
    width: "100%",
    marginTop: 25,
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },

  authPromptText: {
    fontSize: 16,
    color: NadaTheme.colors.text,
    marginBottom: 15,
    textAlign: "center",
  },

  authPromptButtonsContainer: {
    flexDirection: "row",
    gap: 15,
  },

  authPromptButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: NadaTheme.colors.overlay,
    borderWidth: 1,
    borderColor: NadaTheme.colors.overlayBorder,
  },

  authPromptButtonSecondary: {
    backgroundColor: NadaTheme.colors.primary,
    borderColor: "transparent",
  },

  authPromptButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: NadaTheme.colors.text,
  },

  // Bottom navigation styles removed
});

export default NadaHomeScreen;
