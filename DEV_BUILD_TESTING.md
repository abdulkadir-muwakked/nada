# Development Build Testing Guide

This guide will help you test your Nada Pomodoro app with the custom development build that includes background task and notification functionality.

## Why a Development Build?

Some native modules like `expo-task-manager` and `expo-background-fetch` don't work in Expo Go. The development build includes these native modules compiled specifically for your app.

## Installing Your Development Build

### iOS Simulator

1. Once the build is complete, download the .tar.gz file from the EAS build page
2. Extract it to get the .app file
3. Drag and drop the .app file onto your open simulator
4. The app will install and can be launched from the simulator's home screen

### iOS Physical Device

1. After the build completes, EAS will provide a QR code or link
2. Open the link on your iOS device and follow installation instructions
3. You may need to trust the developer certificate in Settings > General > VPN & Device Management

### Android

1. Download the APK from the EAS build page
2. On your Android device, allow installation from unknown sources in settings
3. Install the APK by opening it from your downloads folder
4. Alternatively, scan the QR code provided by EAS to download and install directly

## Testing the Background Timer

1. **Basic timer functionality:**

   - Start a focus session timer (e.g., 25 minutes)
   - Verify the timer counts down correctly
   - Check that animations work properly
   - Test pausing and resuming the timer
   - Verify completion triggers the correct notification

2. **Background functionality (critical test):**

   - Start a short timer (2-3 minutes for testing)
   - Send the app to the background (press home button)
   - Wait for the timer to complete while the app is in background
   - Verify you receive a notification with the "😐" emoji and a sarcastic message
   - Verify that tapping the notification opens the app correctly

3. **App termination test:**
   - Start a timer
   - Force close the app (swipe up from app switcher)
   - Wait for the scheduled time
   - Check if the notification still appears despite the app being terminated
4. **State persistence:**

   - Start a timer
   - Background the app for a minute
   - Return to the app
   - Verify the timer continued counting down correctly
   - Force close the app
   - Reopen the app
   - Verify the timer state was restored correctly

5. **Session transitions:**

   - Complete a focus session
   - Verify it transitions to break mode correctly
   - Complete a break session
   - Verify it transitions back to focus mode

6. **Multiple session test:**
   - Run through at least 3 complete focus/break cycles
   - Check that notifications work consistently for each transition

## Platform-Specific Testing

### iOS

- Test with different power modes (Low Power Mode on/off)
- Test with different notification settings (banner, alert, etc.)
- Verify background operation after device sleep/wake cycles
- Check battery usage in Settings > Battery

### Android

- Test after device reboot to verify background tasks restart correctly
- Verify notifications show with the correct channel and priority
- Test with battery optimization both on and off for the app
- Check that the app isn't killed by Android's memory management
- Verify wake lock functionality during active sessions

## Connection Testing

Since your app uses Clerk for authentication:

- Verify login works correctly in the development build
- Test what happens when network connection is lost
- Test timer behavior when switching between WiFi and cellular data

## Debugging Tips

1. Connect device to computer and use `expo:debug` to see logs
2. Use this command to view device logs:
   ```
   npx expo-cli diagnostics
   ```
3. For iOS-specific issues:
   ```
   xcrun simctl spawn booted log stream --predicate 'process == "MyApp"'
   ```
4. For Android logging:
   ```
   adb logcat *:S ReactNative:V ReactNativeJS:V
   ```
5. To verify notification setup:
   ```
   npx expo-doctor
   ```

## Troubleshooting Common Issues

- **Notifications not appearing in background:**

  - Check if Background App Refresh is enabled (iOS)
  - Verify battery optimization is disabled for the app (Android)
  - Confirm projectId is correct in both app.json and notificationService.ts

- **Background tasks stopping:**

  - Android may kill background tasks for battery optimization
  - Implement foreground service for critical timers on Android
  - Consider using local notifications as fallback

- **Push token registration fails:**
  - Verify correct Expo project ID is being used
  - Check internet connectivity
  - Ensure development build was created with the correct profile

## Next Steps for Production

1. After thorough testing on both platforms, prepare for production:

   ```
   npx eas build --profile production --platform ios
   npx eas build --profile production --platform android
   ```

2. Submit to app stores:
   ```
   npx eas submit --platform ios
   npx eas submit --platform android
   ```
