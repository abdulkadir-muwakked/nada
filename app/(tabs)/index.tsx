import { useAuth } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
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
import { useRevenueCat } from "../../context/RevenueCatContext";
import { useTimerSettings } from "../../context/TimerSettingsContext";
import { useSession } from "../../hooks/useSession";
import { useNadaMessage } from "../../hooks/useNadaMessage";
import { useTheme } from "../../hooks/useTheme";
import { useTimer } from "../../hooks/useTimer";
import type { NadaThemeType } from "../../types/nada";

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
  const { currentSession, sessionGoal, streak, recordCompletedSession } =
    useSession();
  const { settings } = useTimerSettings();
  const { isPremium, loading: revenueCatLoading } = useRevenueCat();

  const configuredGoal = useMemo(
    () => Math.max(1, Math.round(settings.focusSessionsPerCycle)),
    [settings.focusSessionsPerCycle]
  );

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
  } = useTimer({
    onFocusComplete: async ({ durationSeconds, completedAt }) => {
      await recordCompletedSession(durationSeconds, completedAt);
    },
  });
  const { message: aiMessage, loading: aiLoading } = useNadaMessage({
    sessionNumber: Math.max(1, currentSession),
    totalGoal: Math.max(1, configuredGoal),
    currentMode: isRest ? "break" : "focus",
    persona: settings.persona,
    autoFetch: isSignedIn || false,
    enabled: isSignedIn || false,
  });
  const { theme, colors, isDark } = useTheme();
  const themedStyles = useMemo(() => createStyles(theme), [theme]);

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

  // Handle navigation to auth screens
  const handleAuthPress = (screen: "sign-in" | "sign-up") => {
    router.push(`/${screen}`);
  };

  const handlePremiumPress = async () => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    if (revenueCatLoading || isPremium) {
      return;
    }

    router.push("/premium-messages");
  };

  return (
    <View style={themedStyles.container}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
        translucent={false}
      />

      {/* Header */}
      <View style={themedStyles.header}>
        <View style={themedStyles.headerLeft}>
          <NadaLogo size="medium" />
        </View>
        <View style={themedStyles.headerRight}>
          {isSignedIn ? (
            <View style={themedStyles.authButtonsContainer}>
              <TouchableOpacity
                style={themedStyles.settingsButton}
                onPress={() => router.push("/settings")}
                accessibilityRole="button"
                accessibilityLabel="Open settings"
              >
                <Feather name="settings" size={18} color={colors.text} />
              </TouchableOpacity>
              <View style={themedStyles.signOutButtonContainer}>
                <SignOutButton />
              </View>
            </View>
          ) : (
            <View style={themedStyles.authButtonsContainer}>
              <TouchableOpacity
                style={themedStyles.authButton}
                onPress={() => handleAuthPress("sign-in")}
              >
                <Text style={themedStyles.authButtonText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  themedStyles.authButton,
                  themedStyles.authButtonSecondary,
                ]}
                onPress={() => handleAuthPress("sign-up")}
              >
                <Text style={themedStyles.authButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Status Bar - Shows streak and auth status */}
      <View style={themedStyles.statusBarContainer}>
        <View style={themedStyles.streakCounter}>
          <Text style={themedStyles.streakText}>{streak} day streak</Text>
        </View>
      </View>

      {/* Main Content - Now Scrollable */}
      <ScrollView
        style={themedStyles.scrollContainer}
        contentContainerStyle={themedStyles.mainContent}
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
              ? aiLoading
                ? currentMessage
                : aiMessage || currentMessage
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

        <SessionInfo
          currentSession={currentSession}
          sessionGoal={configuredGoal ?? sessionGoal}
        />

        <Controls
          isRunning={isRunning}
          isRest={isRest}
          scaleAnim={scaleAnim}
          onPlayPress={handlePlayPress}
          onToggleMode={handleToggleMode}
          onSkip={handleSkip}
        />

        {!isPremium ? (
          <View style={themedStyles.premiumUpsellWrap}>
            <Text style={themedStyles.premiumPromptTitle}>
              Upgrade to Hypocrite Mode.
            </Text>
            <Text style={themedStyles.premiumPromptSubtitle}>
              Nada will finally start praising you.
            </Text>
            <TouchableOpacity
              style={[
                themedStyles.premiumCta,
                revenueCatLoading && themedStyles.premiumCtaDisabled,
              ]}
              onPress={handlePremiumPress}
              disabled={revenueCatLoading}
              accessibilityRole="button"
              accessibilityLabel="Unlock Hypocrite Mode"
            >
              <Text style={themedStyles.premiumCtaTitle}>
                Unlock Hypocrite Mode
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {isSignedIn && isPremium ? (
          <View style={themedStyles.premiumBadge}>
            <Text style={themedStyles.premiumBadgeText}>
              Premium sarcasm unlocked
            </Text>
          </View>
        ) : null}

        {/* <TouchableOpacity
          style={themedStyles.motivateBtn}
          onPress={handleMotivatePress}
        >
          <Text style={themedStyles.motivateText}>
            {isSignedIn
              ? "Actually motivate me 🙄"
              : "Sign in for more features 🙄"}
          </Text>
        </TouchableOpacity> */}

        {!isSignedIn && (
          <View style={themedStyles.authPromptContainer}>
            <Text style={themedStyles.authPromptText}>
              Sign in to track your productivity progress.
            </Text>
            <View style={themedStyles.authPromptButtonsContainer}>
              <TouchableOpacity
                style={themedStyles.authPromptButton}
                onPress={() => handleAuthPress("sign-in")}
              >
                <Text style={themedStyles.authPromptButtonText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  themedStyles.authPromptButton,
                  themedStyles.authPromptButtonSecondary,
                ]}
                onPress={() => handleAuthPress("sign-up")}
              >
                <Text style={themedStyles.authPromptButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: NadaThemeType) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      width: "100%",
      height: "100%",
      position: "relative",
    },

    scrollContainer: {
      flex: 1,
      width: "100%",
      backgroundColor: theme.colors.background,
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
      backgroundColor: theme.colors.overlay,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.overlayBorder,
    },

    authButtonSecondary: {
      backgroundColor: theme.colors.highlight,
      borderColor: theme.colors.highlightBorder,
    },

    settingsButton: {
      backgroundColor: theme.colors.overlay,
      borderRadius: theme.borderRadius.circle,
      borderWidth: 1,
      borderColor: theme.colors.overlayBorder,
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },

    authButtonText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.text,
    },

    signOutButtonContainer: {},

    streakCounter: {
      backgroundColor: theme.colors.highlight,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.highlightBorder,
    },

    streakText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.primary,
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
      backgroundColor: theme.colors.background,
    },

    motivateBtn: {
      width: 280,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 30,
      backgroundColor: theme.colors.overlay,
      borderWidth: 1,
      borderColor: theme.colors.overlayBorder,
      justifyContent: "center",
      alignItems: "center",
    },

    motivateText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.text,
    },

    premiumCta: {
      width: 300,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 20,
      backgroundColor: theme.colors.highlight,
      borderWidth: 1,
      borderColor: theme.colors.highlightBorder,
      alignItems: "center",
      justifyContent: "center",
    },

    premiumCtaDisabled: {
      opacity: 0.7,
    },

    premiumUpsellWrap: {
      width: 300,
      marginTop: 14,
      alignItems: "center",
      gap: 6,
    },

    premiumPromptTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.text,
      textAlign: "center",
    },

    premiumPromptSubtitle: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.colors.textSecondary,
      textAlign: "center",
      marginBottom: 6,
    },

    premiumCtaTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.primary,
    },

    premiumBadge: {
      marginTop: 14,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.overlayBorder,
      backgroundColor: theme.colors.overlay,
    },

    premiumBadgeText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.text,
    },

    authPromptContainer: {
      width: "100%",
      marginTop: 25,
      paddingVertical: 20,
      paddingHorizontal: 15,
      borderRadius: 20,
      backgroundColor: theme.colors.overlay,
      borderWidth: 1,
      borderColor: theme.colors.overlayBorder,
      alignItems: "center",
    },

    authPromptText: {
      fontSize: 16,
      color: theme.colors.text,
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
      backgroundColor: theme.colors.overlay,
      borderWidth: 1,
      borderColor: theme.colors.overlayBorder,
    },

    authPromptButtonSecondary: {
      backgroundColor: theme.colors.primary,
      borderColor: "transparent",
    },

    authPromptButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
    },
  });

export default NadaHomeScreen;
