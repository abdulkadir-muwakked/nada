import AsyncStorage from "@react-native-async-storage/async-storage";
import * as BackgroundFetch from "expo-background-fetch";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";

// Constants for task names
export const BACKGROUND_TIMER_TASK = "BACKGROUND_TIMER_TASK";
export const FOCUS_SESSION_END_NOTIFICATION = "FOCUS_SESSION_END_NOTIFICATION";
export const BREAK_SESSION_END_NOTIFICATION = "BREAK_SESSION_END_NOTIFICATION";

// Notification messages from Nada
export const getFocusEndMessages = () => [
  "You actually finished your focus time. I'm genuinely shocked.",
  "Focus time over. You probably just scrolled through TikTok the whole time.",
  "Focus session ended. You actually did it. Proud of you... kind of.",
  "One focus session down, infinity more to go before you're productive.",
  "Focus time complete. Did you actually focus or just daydream?",
  "Focus time ended. Let's be real, how many times did you check your phone?",
];

export const getBreakEndMessages = () => [
  "Break's over. Let's go disappoint your to-do list again.",
  "Back to work. Try to actually focus this time.",
  "Break time's up. I bet you're thrilled to get back to pretending to work.",
  "Your very generous break is over. Time to stare blankly at your screen again.",
  "Break's over. Don't worry, another distraction will come along soon.",
  "Back to focus mode. Try to last longer than 30 seconds this time.",
];

// Random message selector
const getRandomMessage = (messageArray: string[]) => {
  return messageArray[Math.floor(Math.random() * messageArray.length)];
};

// Configure notification settings
export const configureNotifications = async () => {
  // Set notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Configure notification channel for Android
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("nada-timer", {
      name: "Nada Timer",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF6B6B",
      sound: "default",
    });
  }
};

// Request permissions for notifications
export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Only ask for permissions if not determined yet
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // Return true if permission granted, false otherwise
  return finalStatus === "granted";
};

// Define the background task at module scope so it's available in headless mode
try {
  if (TaskManager && typeof TaskManager.defineTask === "function") {
    TaskManager.defineTask(BACKGROUND_TIMER_TASK, async () => {
      try {
        const saved = await AsyncStorage.getItem("@nada_timer_state");
        if (!saved) {
          return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        const state = JSON.parse(saved) as {
          isRunning: boolean;
          isRest: boolean;
          timerSeconds: number;
          focusDuration: number;
          breakDuration: number;
          startTime: number | null;
          notificationId: string | null;
          lastActiveTime: number;
        };

        if (!state.isRunning || !state.startTime) {
          return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        const now = Date.now();
        const total = state.isRest ? state.breakDuration : state.focusDuration;
        const elapsed = Math.floor((now - state.startTime) / 1000);
        const remaining = Math.max(0, total - elapsed);

        if (remaining <= 0) {
          await sendTimerCompleteNotification(state.isRest);
          const nextDuration = state.isRest
            ? state.focusDuration
            : state.breakDuration;
          const updated = {
            ...state,
            isRest: !state.isRest,
            isRunning: false,
            timerSeconds: nextDuration,
            startTime: null,
            notificationId: null,
            lastActiveTime: now,
          };
          await AsyncStorage.setItem(
            "@nada_timer_state",
            JSON.stringify(updated)
          );
          return BackgroundFetch.BackgroundFetchResult.NewData;
        } else {
          const messages = state.isRest
            ? getBreakEndMessages()
            : getFocusEndMessages();
          const message = getRandomMessage(messages);
          const title = state.isRest
            ? "😐 Break time's up"
            : "😐 Focus session complete";

          const identifier = await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body: message,
              sound: "default",
              priority: Notifications.AndroidNotificationPriority.HIGH,
              data: { isRest: state.isRest },
              ...(Platform.OS === "android" ? { channelId: "nada-timer" } : {}),
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: remaining,
              repeats: false,
            },
          });

          const updated = {
            ...state,
            notificationId: identifier || state.notificationId,
            lastActiveTime: now,
          };
          await AsyncStorage.setItem(
            "@nada_timer_state",
            JSON.stringify(updated)
          );
          return BackgroundFetch.BackgroundFetchResult.NewData;
        }
      } catch (e) {
        console.error("Background task error:", e);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });
    console.log("TaskManager background task defined successfully");
  } else {
    console.log("TaskManager not available, background task not defined");
  }
} catch (error) {
  console.log("Error defining background task:", error);
  console.log(
    "This is expected in Expo Go or when not using a development build."
  );
}

// Register background task for timer
export const registerBackgroundTimerTask = async () => {
  try {
    // Check if TaskManager is available (will throw an error in Expo Go or if not properly linked)
    const isTaskManagerAvailable =
      TaskManager && typeof TaskManager.isTaskRegisteredAsync === "function";

    if (!isTaskManagerAvailable) {
      console.log(
        "TaskManager not available, skipping background task registration"
      );
      return;
    }

    // Avoid duplicate registrations
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_TIMER_TASK
    );

    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_TIMER_TASK, {
        minimumInterval: 60,
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log("Background timer task registered successfully");
    } else {
      console.log("Background timer task already registered");
    }
  } catch (error) {
    console.log("Error registering background timer task:", error);
    console.log(
      "This is expected in Expo Go or when not using a development build."
    );
  }
};

// Register for push notifications
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF6B6B",
      });
    } catch (error) {
      console.log("Could not set up Android notification channel:", error);
    }
  }

  if (!Device.isDevice) {
    console.log("Must use physical device for Push Notifications");
    return;
  }

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return;
    }

    // Check if we're running in Expo Go or development client
    const appOwnership = Constants.appOwnership || null;
    const isExpoGo = appOwnership === "expo";

    if (isExpoGo) {
      console.log(
        "Push notifications with ExpoPushTokenManager require a dev build, not available in Expo Go"
      );
      return;
    }

    try {
      // Get project ID from app config
      const projectId = "447f8604-d80a-4cb6-9c75-a451a142620d"; // This is the actual project ID

      console.log("Getting push token with project ID:", projectId);

      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        })
      ).data;

      console.log("Push token obtained successfully:", token);
    } catch (error) {
      console.log("Error getting push token with project ID:", error);

      // Try without project ID as a fallback
      try {
        console.log("Trying to get push token without project ID");
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log("Fallback push token obtained:", token);
      } catch (fallbackError) {
        console.log("All attempts to get push token failed:", fallbackError);
      }
    }
  } catch (error) {
    console.log("Error in push notification setup:", error);
  }

  return token;
}

// Schedule timer end notification
export const scheduleTimerNotification = async (
  durationInSeconds: number,
  isRest: boolean
) => {
  try {
    // Calculate when the timer will finish
    const triggerDate = new Date(Date.now() + durationInSeconds * 1000);

    // Create appropriate message based on session type
    const messages = isRest ? getBreakEndMessages() : getFocusEndMessages();
    const message = getRandomMessage(messages);
    const title = isRest ? "😐 Break time's up" : "😐 Focus session complete";

    // Store notification data
    const notificationData = {
      title,
      body: message,
      isRest,
      endTime: triggerDate.getTime(),
    };

    // Log the timer end time
    console.log(
      `Timer will end at: ${triggerDate.toLocaleTimeString()} with message: ${
        notificationData.body
      }`
    );

    // Use the correct typed trigger for SDK 53
    const trigger: Notifications.TimeIntervalTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: durationInSeconds,
      repeats: false,
    };

    // Actually schedule the notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: notificationData.title,
        body: notificationData.body,
        sound: "default",
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { isRest },
        ...(Platform.OS === "android" ? { channelId: "nada-timer" } : {}),
      },
      trigger,
    });

    // Return the scheduled time and notification ID
    return {
      scheduledTime: triggerDate,
      identifier: notificationId || Date.now().toString(),
    };
  } catch (error) {
    console.error("Failed to schedule notification:", error);
    // Return a fallback value in case of error
    return {
      scheduledTime: new Date(Date.now() + durationInSeconds * 1000),
      identifier: Date.now().toString(),
    };
  }
};

// Send immediate notification when timer completes
export const sendTimerCompleteNotification = async (isRest: boolean) => {
  const messages = isRest ? getBreakEndMessages() : getFocusEndMessages();
  const message = getRandomMessage(messages);
  const title = isRest ? "😐 Break time's up" : "😐 Focus session complete";

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body: message,
      sound: "default",
      priority: Notifications.AndroidNotificationPriority.HIGH,
      data: { isRest },
      ...(Platform.OS === "android" ? { channelId: "nada-timer" } : {}),
    },
    trigger: null, // Send immediately
  });
};

// Cancel all pending notifications
export const cancelAllScheduledNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

// Cancel specific scheduled notification
export const cancelScheduledNotification = async (identifier: string) => {
  if (identifier) {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }
};

// Setup background listeners
export const setupNotificationListeners = () => {
  const responseListener =
    Notifications.addNotificationResponseReceivedListener(
      (response: Notifications.NotificationResponse) => {
        // Handle notification response (e.g., when user taps on notification)
        const data = response.notification.request.content.data;
        console.log("Notification tapped:", data);
        // You could navigate to specific screens based on notification data here
      }
    );

  return responseListener;
};
