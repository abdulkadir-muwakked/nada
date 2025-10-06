#!/bin/bash

# Script to verify notification functionality in development builds
# Usage: ./verify-notifications.sh

echo "🔍 Verifying Nada Timer notification functionality"
echo "=================================================="

# Check if running in a development client
echo "⚙️  Checking for development environment..."
npx expo-doctor

# Verify necessary permissions
echo -e "\n📱 Checking required permissions..."
npx expo-doctor check-permissions

# Verify notification plugins are installed correctly
echo -e "\n🔌 Checking notification plugins..."
npx expo install --check expo-notifications expo-background-fetch expo-task-manager

# Show installed notification modules
echo -e "\n📦 Installed notification modules:"
grep -E "expo-(notifications|background-fetch|task-manager)" package.json

# Check app.json configuration
echo -e "\n📄 Checking app.json configuration..."
jq '.expo.plugins | map(select(. == "expo-notifications" or . == "expo-background-fetch"))' app.json

# Verify project ID in app.json and notification service
echo -e "\n🆔 Checking project ID configuration..."
echo "Project ID in app.json:"
jq '.expo.extra.eas.projectId' app.json

echo -e "\nProject ID in notification service:"
grep -n "projectId:" utils/notificationService.ts | head -3

# Check background task definition
echo -e "\n⏱️  Checking background task definition..."
grep -n "BACKGROUND_TIMER_TASK" utils/notificationService.ts | head -3
grep -n "TaskManager.defineTask" utils/notificationService.ts | head -1

# iOS background modes
echo -e "\n🍏 iOS background modes:"
jq '.expo.ios.infoPlist.UIBackgroundModes' app.json

# Android permissions
echo -e "\n🤖 Android permissions:"
jq '.expo.android.permissions' app.json

# Development client configuration
echo -e "\n🧪 Development client configuration:"
jq '.build.development' eas.json

# Run tests for actually sending a notification
echo -e "\n🔔 Testing notification capability..."
echo "Attempting to send a test notification in 5 seconds..."
sleep 5
npx expo-cli notifications:send --title "Test Notification" --body "Your development build is working!" --subtitle "Nada Timer" --data '{"test": true}' || echo "Failed to send test notification. Make sure you're logged in to the right Expo account."

echo -e "\n✅ Verification complete! For full functionality:"
echo "1. Ensure you're using a development build (not Expo Go)"
echo "2. Verify notifications appear when timer completes in background"
echo "3. Check that state persists between app restarts"
echo "4. On Android, verify timer restarts after device reboot"
