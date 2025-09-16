#!/bin/bash

# Script to generate App Store screenshots for submission
# This script helps prepare the proper simulator configurations for screenshots

echo "======================================"
echo "App Store Screenshot Helper"
echo "======================================"
echo ""
echo "This script will help you set up simulators for App Store screenshots"
echo ""

# Required devices for App Store screenshots
echo "Setting up required devices for screenshots:"
echo "- iPhone 15 Pro Max (6.7\")"
echo "- iPhone 15 Pro (6.1\")"
echo "- iPhone SE (3rd generation) (4.7\")"
echo "- iPad Pro (12.9-inch) (if iPad is supported)"
echo ""

# Check if xcrun is available
if ! command -v xcrun &> /dev/null; then
  echo "Error: xcrun command not found. Make sure Xcode is installed."
  exit 1
fi

# List available simulators
echo "Available simulators:"
xcrun simctl list devices available | grep -E 'iPhone|iPad'
echo ""

echo "Step 1: Launch the WelcomeScreen for screenshots"
echo "=============================================="
echo "1. Open the project in Xcode"
echo "2. Run the app in each of the required simulators"
echo "3. Navigate to the WelcomeScreen"
echo "4. Take a screenshot using Cmd+S or Device > Screenshot"
echo ""

# Create a directory for screenshots if it doesn't exist
mkdir -p "$HOME/Desktop/AppStoreScreenshots"

echo "Step 2: Organize your screenshots"
echo "=============================="
echo "Screenshots will be saved to the simulator Photos app."
echo "You should rename them appropriately for App Store submission."
echo ""
echo "Tip: Screenshots should be saved with the following naming convention:"
echo "- iPhone 15 Pro Max (6.7\"): [feature]-67.png"
echo "- iPhone 15 Pro (6.1\"): [feature]-61.png" 
echo "- iPhone SE (4.7\"): [feature]-47.png"
echo "- iPad Pro (12.9\"): [feature]-129.png (if iPad is supported)"
echo ""

echo "Step 3: Enhance screenshots (optional)"
echo "=================================="
echo "You can enhance screenshots with device frames using Apple's official Marketing Resources:"
echo "https://developer.apple.com/app-store/marketing/guidelines/#section-products"
echo ""

echo "Step 4: Screenshot requirements checklist"
echo "======================================"
echo "✓ Minimum 1 screenshot per supported device"
echo "✓ Maximum 10 screenshots per device"
echo "✓ Screenshots must be in the RGB color space"
echo "✓ High-resolution screenshots (JPG or PNG)"
echo "✓ No transparency in screenshots"
echo "✓ No rounded corners unless part of the app UI"
echo "✓ No device frames/bezels (unless using Apple's marketing images)"
echo ""

echo "Screenshots will be saved to: $HOME/Desktop/AppStoreScreenshots"
echo ""

# Create a helper React component for App Store screenshots
cat > "$HOME/Projects/MyApp/components/AppStoreScreenshotHelper.tsx" << 'EOL'
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { NadaTheme } from '../constants/NadaTheme';
import WelcomeScreen from './WelcomeScreen';

/**
 * This component helps with taking App Store screenshots
 * It displays the app in a state optimized for screenshots
 * and provides helpers for different device sizes
 */
const AppStoreScreenshotHelper: React.FC = () => {
  const [showHelper, setShowHelper] = useState(true);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);
  
  const { width, height } = Dimensions.get('window');
  const deviceSize = Math.max(width, height);
  
  // Detect device size
  const getDeviceType = () => {
    if (Platform.OS === 'ios') {
      if (deviceSize >= 1024) return 'iPad';
      if (deviceSize >= 926) return 'iPhone 6.7"'; // iPhone Pro Max models
      if (deviceSize >= 844) return 'iPhone 6.1"'; // iPhone Pro/regular models
      return 'iPhone 4.7"'; // iPhone SE/smaller models
    }
    return 'Unknown device';
  };

  if (showWelcomeScreen) {
    return <WelcomeScreen />;
  }

  return (
    <View style={styles.container}>
      {showHelper && (
        <View style={styles.helperOverlay}>
          <Text style={styles.helperTitle}>App Store Screenshot Helper</Text>
          <Text style={styles.deviceInfo}>{getDeviceType()}</Text>
          <Text style={styles.deviceInfo}>{width}x{height}</Text>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => {
              setShowHelper(false);
              setShowWelcomeScreen(true);
            }}
          >
            <Text style={styles.buttonText}>Show Welcome Screen</Text>
          </TouchableOpacity>
          
          <Text style={styles.tip}>
            Take a screenshot with Cmd+S or Hardware menu.
            This helper will not appear in screenshots.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NadaTheme.colors.background,
  },
  helperOverlay: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    alignItems: 'center',
  },
  helperTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  deviceInfo: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 5,
  },
  button: {
    backgroundColor: NadaTheme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 15,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tip: {
    fontSize: 12,
    color: '#ddd',
    textAlign: 'center',
  },
});

export default AppStoreScreenshotHelper;
EOL

echo "Created AppStoreScreenshotHelper component at: $HOME/Projects/MyApp/components/AppStoreScreenshotHelper.tsx"
echo "You can import and use this component in your app for easier screenshot generation."
echo ""

echo "For detailed instructions on App Store screenshot requirements, visit:"
echo "https://developer.apple.com/app-store/screenshots/"
echo ""

echo "Script completed!"
