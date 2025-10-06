#!/bin/bash
# Development build installation helper script

echo "🚀 Nada Pomodoro Development Build Helper"
echo "========================================="

# Define build directories
CLOUD_BUILDS_DIR="./builds/cloud"
LOCAL_BUILDS_DIR="./builds/local"

# Create directories if they don't exist
mkdir -p "$CLOUD_BUILDS_DIR"
mkdir -p "$LOCAL_BUILDS_DIR"

# Function to check and install required tools
check_dependencies() {
  echo "📋 Checking required tools..."
  
  # Check for xcrun (for iOS simulator installations)
  if ! command -v xcrun &> /dev/null; then
    echo "❌ xcrun not found. Make sure Xcode is installed and CLI tools are set up."
    exit 1
  else
    echo "✅ xcrun found"
  fi
  
  # Check for adb (for Android installations)
  if ! command -v adb &> /dev/null; then
    echo "⚠️  adb not found. Android device installation will not be available."
    HAS_ADB=false
  else
    echo "✅ adb found"
    HAS_ADB=true
  fi
  
  # Check for jq (for JSON parsing)
  if ! command -v jq &> /dev/null; then
    echo "⚠️  jq not found. Some features may be limited."
    echo "   Install with: brew install jq"
  else
    echo "✅ jq found"
  fi
}

# Function to list available simulators
list_simulators() {
  echo -e "\n📱 Available iOS Simulators:"
  xcrun simctl list devices available | grep -v '^--' | grep -v '^==' | grep -v '^$'
}

# Function to install app on iOS Simulator
install_on_simulator() {
  if [ -z "$1" ]; then
    echo "❌ No .app file specified"
    return 1
  fi
  
  if [ ! -f "$1" ] && [ ! -d "$1" ]; then
    echo "❌ File not found: $1"
    return 1
  fi
  
  # Get simulator ID - use first booted device or prompt user
  SIMULATOR_ID=$(xcrun simctl list devices booted | grep -v '^--' | grep -v '^==' | grep -v '^$' | head -1 | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/')
  
  if [ -z "$SIMULATOR_ID" ]; then
    echo "❓ No booted simulator found. Please select a simulator:"
    list_simulators
    read -p "Enter simulator ID: " SIMULATOR_ID
  fi
  
  echo "📲 Installing on simulator ($SIMULATOR_ID)..."
  xcrun simctl install "$SIMULATOR_ID" "$1"
  
  if [ $? -eq 0 ]; then
    echo "✅ Installation successful!"
    
    # Get bundle ID from app.json
    BUNDLE_ID=$(jq -r '.expo.ios.bundleIdentifier' app.json)
    
    # Launch the app
    echo "🚀 Launching app..."
    xcrun simctl launch "$SIMULATOR_ID" "$BUNDLE_ID"
  else
    echo "❌ Installation failed!"
  fi
}

# Function to install app on Android device
install_on_android() {
  if [ -z "$1" ]; then
    echo "❌ No APK file specified"
    return 1
  fi
  
  if [ ! -f "$1" ]; then
    echo "❌ File not found: $1"
    return 1
  fi
  
  if [ "$HAS_ADB" = false ]; then
    echo "❌ adb not found. Cannot install on Android device."
    return 1
  fi
  
  # Check for connected devices
  DEVICES=$(adb devices | grep -v "List" | grep -v "^$" | wc -l)
  if [ "$DEVICES" -eq 0 ]; then
    echo "❌ No Android devices connected."
    return 1
  fi
  
  echo "📲 Installing on Android device..."
  adb install -r "$1"
  
  if [ $? -eq 0 ]; then
    echo "✅ Installation successful!"
    
    # Get package name from app.json
    PACKAGE_NAME=$(jq -r '.expo.android.package' app.json)
    
    # Launch the app
    echo "🚀 Launching app..."
    adb shell monkey -p "$PACKAGE_NAME" -c android.intent.category.LAUNCHER 1
  else
    echo "❌ Installation failed!"
  fi
}

# Main menu function
# Function to download EAS cloud builds
download_cloud_builds() {
  echo -e "\n📥 Checking for recent EAS cloud builds..."
  
  # Get latest builds
  npx eas build:list > /tmp/eas_builds.txt
  
  # Extract Android build info
  ANDROID_BUILD_ID=$(grep -A10 "Platform                 Android" /tmp/eas_builds.txt | grep "ID" | head -1 | awk '{print $2}')
  ANDROID_BUILD_STATUS=$(grep -A10 "Platform                 Android" /tmp/eas_builds.txt | grep "Status" | head -1 | awk '{print $2}')
  ANDROID_BUILD_URL=$(grep -A10 "Platform                 Android" /tmp/eas_builds.txt | grep "Build Artifacts URL" | head -1 | awk '{print $4}')
  
  # Extract iOS build info
  IOS_BUILD_ID=$(grep -A10 "Platform                 iOS" /tmp/eas_builds.txt | grep "ID" | head -1 | awk '{print $2}')
  IOS_BUILD_STATUS=$(grep -A10 "Platform                 iOS" /tmp/eas_builds.txt | grep "Status" | head -1 | awk '{print $2}')
  IOS_BUILD_URL=$(grep -A10 "Platform                 iOS" /tmp/eas_builds.txt | grep "Build Artifacts URL" | head -1 | awk '{print $4}')
  
  echo -e "\n📊 Build Status:"
  echo "Android: $ANDROID_BUILD_STATUS (ID: $ANDROID_BUILD_ID)"
  echo "iOS: $IOS_BUILD_STATUS (ID: $IOS_BUILD_ID)"
  
  # Download Android build if available
  if [ "$ANDROID_BUILD_STATUS" == "finished" ] && [ "$ANDROID_BUILD_URL" != "null" ] && [ "$ANDROID_BUILD_URL" != "<in" ]; then
    echo -e "\n📥 Downloading Android build..."
    curl -o "$CLOUD_BUILDS_DIR/android-dev-client.apk" "$ANDROID_BUILD_URL"
    echo "✅ Android build saved to $CLOUD_BUILDS_DIR/android-dev-client.apk"
  elif [ "$ANDROID_BUILD_STATUS" == "errored" ]; then
    echo "❌ Android build failed. Check logs at: https://expo.dev/accounts/abdulkadir-mu/projects/nada/builds/$ANDROID_BUILD_ID"
  else
    echo "⏳ Android build not ready yet or URL not available"
  fi
  
  # Download iOS build if available
  if [ "$IOS_BUILD_STATUS" == "finished" ] && [ "$IOS_BUILD_URL" != "null" ] && [ "$IOS_BUILD_URL" != "<in" ]; then
    echo -e "\n📥 Downloading iOS build..."
    curl -o "$CLOUD_BUILDS_DIR/ios-dev-client.tar.gz" "$IOS_BUILD_URL"
    echo "✅ iOS build saved to $CLOUD_BUILDS_DIR/ios-dev-client.tar.gz"
    
    # Extract iOS build
    echo "🔧 Extracting iOS build..."
    mkdir -p "$CLOUD_BUILDS_DIR/ios-app"
    tar -xzf "$CLOUD_BUILDS_DIR/ios-dev-client.tar.gz" -C "$CLOUD_BUILDS_DIR/ios-app"
    echo "✅ iOS build extracted to $CLOUD_BUILDS_DIR/ios-app"
  elif [ "$IOS_BUILD_STATUS" == "errored" ]; then
    echo "❌ iOS build failed. Check logs at: https://expo.dev/accounts/abdulkadir-mu/projects/nada/builds/$IOS_BUILD_ID"
  else
    echo "⏳ iOS build not ready yet or URL not available"
  fi
}

main_menu() {
  echo -e "\n🔍 Development Build Helper"
  echo "1) Create local iOS development build"
  echo "2) Create local Android development build" 
  echo "3) Download cloud builds"
  echo "4) Install iOS build (simulator)"
  echo "5) Install Android build (device)"
  echo "6) Run notification verification test"
  echo "7) Start development client"
  echo "8) Launch iOS dev client (with Metro check)"
  echo "9) Exit"
  
  read -p "Select an option: " OPTION
  
  case $OPTION in
    1)
      echo -e "\n🛠️ Creating local iOS development build..."
      npx expo run:ios
      echo "✅ iOS build completed"
      ;;
    2)
      echo -e "\n🛠️ Creating local Android development build..."
      npx expo run:android
      echo "✅ Android build completed"
      ;;
    3)
      download_cloud_builds
      ;;
    4)
      echo -e "\n📁 Available iOS builds:"
      find "$CLOUD_BUILDS_DIR" "$LOCAL_BUILDS_DIR" -name "*.app" -o -path "*/ios-app/*.app"
      
      echo -e "\nEnter path to .app file:"
      read -p "> " APP_PATH
      install_on_simulator "$APP_PATH"
      ;;
    5)
      if [ "$HAS_ADB" = false ]; then
        echo "❌ adb not found. Cannot install on Android device."
      else
        echo -e "\n📁 Available Android builds:"
        find "$CLOUD_BUILDS_DIR" "$LOCAL_BUILDS_DIR" -name "*.apk"
        
        echo -e "\nEnter path to APK file:"
        read -p "> " APK_PATH
        install_on_android "$APK_PATH"
      fi
      ;;
    6)
      echo -e "\n🔔 Running notification verification test..."
      ./scripts/verify-notifications.sh
      ;;
    7)
      echo -e "\n🚀 Starting development client..."
      npx expo start --dev-client
      ;;
    8)
      echo -e "\n🚀 Launching iOS development client with Metro check..."
      ./scripts/launch-dev-client.sh
      ;;
    9)
      echo "👋 Goodbye!"
      exit 0
      ;;
    *)
      echo "❌ Invalid option. Please try again."
      ;;
  esac
  
  main_menu
}

# Check if running with AUTO_OPTION (used by VS Code tasks)
handle_auto_option() {
  if [ ! -z "$AUTO_OPTION" ]; then
    case $AUTO_OPTION in
      1) # Create iOS build
        npx expo run:ios
        exit 0
        ;;
      2) # Create Android build
        npx expo run:android
        exit 0
        ;;
      3) # Download cloud builds
        download_cloud_builds
        exit 0
        ;;
      *)
        echo "Invalid AUTO_OPTION: $AUTO_OPTION"
        ;;
    esac
  fi
}

# Run the script
check_dependencies
handle_auto_option
list_simulators
main_menu
