import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import Constants from "expo-constants";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Alert, AppState, AppStateStatus } from "react-native";
import GlobalErrorBoundary from "../components/GlobalErrorBoundary";
import SafeScreen from "../components/SafeScreen";
import { TimerSettingsProvider } from "../context/TimerSettingsContext";
import { useTheme } from "../hooks/useTheme";
import { initializeAdMob } from "../utils/adService";
import appStartupTracker from "../utils/appStartupTracker";
import networkStatusWatcher from "../utils/networkStatusWatcher";
import {
  configureNotifications,
  registerBackgroundTimerTask,
  requestNotificationPermissions,
  setupNotificationListeners,
} from "../utils/notificationService";
import { initializeOAuth } from "../utils/oauth";

// Initialize OAuth for Google sign-in
initializeOAuth();

// Root Layout component
function Layout() {
  const { colors, isDark } = useTheme();
  // Track notification permission status - used to determine app functionality
  const [, setHasNotificationPermission] = useState(false);

  // Reference to notification listener
  const notificationListener = useRef<any>(null);

  // Reference to app state
  const appState = useRef(AppState.currentState);

  // Initialize services when the app starts
  useEffect(() => {
    // Initialize all services
    const initServices = async () => {
      appStartupTracker.startStage("AppInitialization");

      try {
        // Start network status monitoring
        appStartupTracker.startStage("NetworkMonitoring");
        networkStatusWatcher.startWatching();
        appStartupTracker.endStage("NetworkMonitoring");

        // Initialize AdMob
        appStartupTracker.startStage("AdMobInitialization");
        console.log("Starting AdMob initialization...");
        await initializeAdMob();
        console.log("AdMob initialized successfully");
        appStartupTracker.endStage("AdMobInitialization");

        // Check if we're running in a development build where native modules are available
        const isExpoGo = Constants.appOwnership === "expo";

        if (isExpoGo) {
          console.log(
            "Running in Expo Go: Some native features like background notifications will be limited"
          );
        }

        try {
          // Configure notifications
          appStartupTracker.startStage("NotificationSetup");
          console.log("Setting up notifications...");
          await configureNotifications();

          // Request notification permissions
          const granted = await requestNotificationPermissions();
          setHasNotificationPermission(granted);
          console.log("Notification permissions granted:", granted);

          if (granted) {
            try {
              // Register background timer task - this might fail in Expo Go
              appStartupTracker.startStage("BackgroundTaskSetup");
              console.log("Registering background timer task...");
              await registerBackgroundTimerTask();
              appStartupTracker.endStage("BackgroundTaskSetup");
            } catch (taskError) {
              appStartupTracker.recordError(
                "BackgroundTaskSetup",
                taskError instanceof Error
                  ? taskError
                  : new Error(String(taskError))
              );
              console.warn(
                "Error registering background task - this is expected in Expo Go:",
                taskError
              );
            }

            // Setup notification listeners
            notificationListener.current = setupNotificationListeners();
          }
          appStartupTracker.endStage("NotificationSetup");
        } catch (notificationError) {
          appStartupTracker.recordError(
            "NotificationSetup",
            notificationError instanceof Error
              ? notificationError
              : new Error(String(notificationError))
          );
          console.error("Error setting up notifications:", notificationError);
          console.log("App will continue without notification functionality");
        }
      } catch (error) {
        // Log errors but continue app initialization
        appStartupTracker.recordError(
          "AppInitialization",
          error instanceof Error ? error : new Error(String(error))
        );
        console.error("Error initializing services:", error);
        console.log("App will continue with reduced functionality");

        // Show a user-friendly error alert
        Alert.alert(
          "App Initialization Issue",
          "The app encountered an issue during startup. Some features may be limited.",
          [{ text: "OK" }]
        );
      } finally {
        appStartupTracker.endStage("AppInitialization");
        console.log(appStartupTracker.getSummary());
      }
    };

    initServices();

    // Set up app state change listener
    const subscription = AppState.addEventListener(
      "change",
      _handleAppStateChange
    );

    // Cleanup function
    return () => {
      // Remove app state listener
      subscription.remove();

      // Remove notification listener if it exists
      if (notificationListener.current) {
        notificationListener.current.remove();
      }

      // Stop network monitoring
      networkStatusWatcher.stopWatching();
    };
  }, []);

  // Handle app state changes
  const _handleAppStateChange = (nextAppState: AppStateStatus) => {
    console.log(
      `App state changed from ${appState.current} to ${nextAppState}`
    );
    appState.current = nextAppState;
  };

  return (
    <GlobalErrorBoundary>
      <ClerkProvider tokenCache={tokenCache}>
        <StatusBar
          style={isDark ? "light" : "dark"}
          backgroundColor={colors.background}
          translucent={false}
        />
        <TimerSettingsProvider>
          <SafeScreen>
            <Stack
              screenOptions={{
                headerTintColor: colors.text,
                headerTitleStyle: {
                  color: colors.text,
                  fontWeight: "600",
                },
                headerStyle: {
                  backgroundColor: colors.background,
                },
                headerShadowVisible: false,
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen
                name="settings/index"
                options={{
                  title: "Settings",
                  headerBackTitle: "Back",
                }}
              />
            </Stack>
          </SafeScreen>
        </TimerSettingsProvider>
      </ClerkProvider>
    </GlobalErrorBoundary>
  );
}

// Make sure to export the layout
export default Layout;
