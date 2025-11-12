#!/bin/bash
# Launch script that ensures Metro bundler is running before opening the iOS simulator
# This fixes the "No script URL provided" error

echo "🚀 Launching Development Client..."

# Function to check if Metro is running
check_metro_running() {
  # Try to connect to Metro bundler port (default 8081)
  if nc -z localhost 8081 &> /dev/null; then
    return 0 # Metro is running
  else
    return 1 # Metro is not running
  fi
}

# Function to start Metro bundler in background
start_metro() {
  echo "📦 Starting Metro bundler..."
  # Start Metro in the background
  npx expo start --dev-client &
  
  # Save the PID to control it later if needed
  METRO_PID=$!
  
  # Wait for Metro to start (check port 8081)
  echo "⏳ Waiting for Metro bundler to start..."
  WAIT_COUNT=0
  MAX_WAIT=30 # Maximum wait time in seconds
  
  while ! check_metro_running && [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
    echo -n "."
  done
  
  echo ""
  
  if check_metro_running; then
    echo "✅ Metro bundler is running!"
    return 0
  else
    echo "❌ Failed to start Metro bundler within $MAX_WAIT seconds."
    return 1
  fi
}

# Check if Metro is already running
if check_metro_running; then
  echo "✅ Metro bundler is already running"
else
  echo "Metro bundler is not running"
  start_metro
  
  # Exit if Metro failed to start
  if [ $? -ne 0 ]; then
    echo "❌ Failed to start Metro bundler. Please check for errors."
    exit 1
  fi
fi

# Find if we have a simulator running already
BOOTED_SIMULATOR=$(xcrun simctl list devices | grep "Booted" | head -1 | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/')

if [ -z "$BOOTED_SIMULATOR" ]; then
  echo "🔍 No simulator is currently running. Launching a simulator..."
  # Launch a simulator (iPhone 14 or whatever is available)
  xcrun simctl boot "iPhone 14" 2>/dev/null || xcrun simctl boot "$(xcrun simctl list devices available | grep "iPhone" | head -1 | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/')"
  
  # Wait for simulator to boot
  echo "⏳ Waiting for simulator to boot..."
  sleep 5
  
  # Get the booted simulator ID again
  BOOTED_SIMULATOR=$(xcrun simctl list devices | grep "Booted" | head -1 | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/')
fi

# Get bundle ID from app.json
BUNDLE_ID=$(jq -r '.expo.ios.bundleIdentifier' app.json)

# Find the app in simulator
APP_PATH=$(find ~/Library/Developer/CoreSimulator/Devices/$BOOTED_SIMULATOR/data/Containers/Bundle/Application -name "$BUNDLE_ID.app" -type d 2>/dev/null)

if [ -z "$APP_PATH" ]; then
  echo "⚠️ App not found in simulator. It may need to be installed first."
  echo "Run 'npx expo run:ios' to build and install, then run this script again."
  
  # Option to run expo build now
  read -p "Would you like to build and install the app now? (y/n): " BUILD_CHOICE
  if [[ $BUILD_CHOICE == "y" || $BUILD_CHOICE == "Y" ]]; then
    npx expo run:ios
  else
    echo "Exiting without launching app."
    exit 0
  fi
else
  echo "📱 Found app at: $APP_PATH"
  echo "🚀 Launching app in simulator..."
  xcrun simctl launch $BOOTED_SIMULATOR $BUNDLE_ID
fi

echo "✅ Done! The app should now be running with Metro bundler connected."
