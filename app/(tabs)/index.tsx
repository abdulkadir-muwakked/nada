import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Animated,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import NadaCharacter from "../../components/NadaCharacter";
import NadaLogo from "../../components/NadaLogo";
import { SignOutButton } from "../../components/SignOutButton";
import SpeechBubble from "../../components/SpeechBubble";
import Controls from "../../components/timer/Controls";
import SessionInfo from "../../components/timer/SessionInfo";
import TimerDisplay from "../../components/timer/TimerDisplay";
import TimerPresets from "../../components/timer/TimerPresets";
import { NadaTheme } from "../../constants/NadaTheme";
import { useSession } from "../../hooks/useSession";
import { useTimer } from "../../hooks/useTimer";

// Define props interface for the content component
interface NadaHomeContentProps {
  isSignedIn: boolean;
  scaleAnim: Animated.Value;
  router: ReturnType<typeof useRouter>;
}

/**
 * Main Home Screen component
 * Creates the animation value and provides authenticated state
 */
const NadaHomeScreen = () => {
  // Fix: useMemo for Animated.Value to avoid changing reference every render
  const scaleAnim = useMemo(() => new Animated.Value(1), []);
  const router = useRouter();
  const { isSignedIn } = useAuth();

  return (
    <NadaHomeContent
      isSignedIn={isSignedIn || false}
      scaleAnim={scaleAnim}
      router={router}
    />
  );
};

/**
 * Main content component - receives auth state and animation value as props
 * This separation allows for better testing and avoids re-renders
 */
const NadaHomeContent = ({
  isSignedIn,
  scaleAnim,
  router,
}: NadaHomeContentProps) => {
  // Use our custom hooks for timer and session management
  const {
    isRunning,
    isRest,
    timerSeconds,
    focusDuration,
    breakDuration,
    selectedPreset,
    taskCompleted,
    currentMessage,
    startTimer,
    toggleTimerMode,
    updateTimerDuration,
  } = useTimer();

  const { currentSession, sessionGoal, streak } = useSession();

  // Animation for button presses
  const animateButtonPress = () => {
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
  };

  // Handler for play/pause button
  const handlePlayPress = async () => {
    animateButtonPress();
    await startTimer();
  };

  // Handle toggle mode button
  const handleToggleMode = async () => {
    animateButtonPress();
    await toggleTimerMode();
  };

  // Handle skip button press
  const handleSkip = async () => {
    animateButtonPress();
    // Skip to the next timer phase
    if (isRest) {
      // If in rest mode, skip to focus mode
      await toggleTimerMode();
    } else {
      // If in focus mode and running, pause and reset
      if (isRunning) {
        await startTimer(); // Toggle running state
      }
      // Then switch to rest mode
      await toggleTimerMode();
    }
  };

  // Handle motivate button press
  const handleMotivatePress = () => {
    // Get a new motivational message based on current timer state
    if (isSignedIn) {
      // The message is already managed in the useTimer hook
      // This is just to trigger a re-render with potentially a new message
    }
  };

  // Handle navigation to auth screens
  const handleAuthPress = (screen: "sign-in" | "sign-up") => {
    router.push(`/${screen}`);
  };

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
              ? currentMessage
              : "Sign in if you must. I'll judge your productivity either way."
          }
        />

        {/* Timer Components */}
        <TimerDisplay
          timerSeconds={timerSeconds}
          focusDuration={focusDuration}
          breakDuration={breakDuration}
          isRest={isRest}
          isRunning={isRunning}
          taskCompleted={taskCompleted}
        />

        <TimerPresets
          focusDuration={focusDuration}
          breakDuration={breakDuration}
          isRest={isRest}
          updateTimerDuration={updateTimerDuration}
        />

        <SessionInfo
          currentSession={currentSession}
          sessionGoal={sessionGoal}
        />

        <Controls
          isRunning={isRunning}
          isRest={isRest}
          scaleAnim={scaleAnim}
          onPlayPress={handlePlayPress}
          onToggleMode={handleToggleMode}
          onSkip={handleSkip}
        />

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
    paddingHorizontal: 15,
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

  signOutButtonContainer: {},

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

  mainContent: {
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 15,
    paddingBottom: 30,
    minHeight: "100%",
    backgroundColor: NadaTheme.colors.background,
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
});

export default NadaHomeScreen;
