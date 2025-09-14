#!/bin/bash

# Script to check and verify AdMob integration in a React Native / Expo project
# This script checks for common issues with Google Mobile Ads integration

echo "========================================"
echo "AdMob Integration Verification Tool"
echo "========================================"

# Check if running from project root
if [ ! -f "package.json" ]; then
  echo "❌ Error: Run this script from the project root directory"
  exit 1
fi

# Check package.json for react-native-google-mobile-ads
echo "Checking package dependencies..."
if grep -q "react-native-google-mobile-ads" package.json; then
  VERSION=$(grep -o '"react-native-google-mobile-ads": "[^"]*"' package.json | cut -d'"' -f4)
  echo "✅ react-native-google-mobile-ads found (version: $VERSION)"
else
  echo "❌ react-native-google-mobile-ads not found in package.json"
fi

# Check app.json for AdMob plugin configuration
echo -e "\nChecking app.json configuration..."
if grep -q "react-native-google-mobile-ads" app.json; then
  echo "✅ react-native-google-mobile-ads plugin found in app.json"
  
  # Check for iOS App ID
  if grep -q "iosAppId" app.json; then
    IOS_APP_ID=$(grep -o '"iosAppId": "[^"]*"' app.json | cut -d'"' -f4)
    echo "✅ iOS App ID found: $IOS_APP_ID"
  else
    echo "❌ iOS App ID not found in app.json"
  fi
  
  # Check for Android App ID
  if grep -q "androidAppId" app.json; then
    ANDROID_APP_ID=$(grep -o '"androidAppId": "[^"]*"' app.json | cut -d'"' -f4)
    echo "✅ Android App ID found: $ANDROID_APP_ID"
  else
    echo "⚠️ Android App ID not found in app.json"
  fi
else
  echo "❌ react-native-google-mobile-ads plugin not found in app.json"
fi

# Check iOS Info.plist for GADApplicationIdentifier
echo -e "\nChecking iOS configuration..."
if [ -f "ios/MyApp/Info.plist" ]; then
  if grep -q "GADApplicationIdentifier" ios/MyApp/Info.plist; then
    echo "✅ GADApplicationIdentifier found in Info.plist"
  else
    echo "❌ GADApplicationIdentifier not found in Info.plist"
  fi
  
  if grep -q "SKAdNetworkItems" ios/MyApp/Info.plist; then
    echo "✅ SKAdNetworkItems found in Info.plist"
  else
    echo "⚠️ SKAdNetworkItems not found in Info.plist (required for iOS 14+)"
  fi
else
  echo "⚠️ iOS Info.plist not found at expected location"
fi

# Check if Google-Mobile-Ads-SDK is installed in Pods
echo -e "\nChecking CocoaPods integration..."
if [ -f "ios/Pods/Manifest.lock" ]; then
  if grep -q "Google-Mobile-Ads-SDK" ios/Pods/Manifest.lock; then
    echo "✅ Google-Mobile-Ads-SDK found in CocoaPods"
    
    # Get version
    ADMOB_POD_VERSION=$(grep -A 1 "Google-Mobile-Ads-SDK" ios/Pods/Manifest.lock | grep -o "[0-9]*\.[0-9]*\.[0-9]*" | head -1)
    echo "   Version: $ADMOB_POD_VERSION"
  else
    echo "❌ Google-Mobile-Ads-SDK not found in CocoaPods"
  fi
else
  echo "⚠️ CocoaPods Manifest.lock not found"
fi

# Check adService.ts file
echo -e "\nChecking adService.ts implementation..."
if [ -f "utils/adService.ts" ]; then
  echo "✅ adService.ts file found"
  
  # Check for ad unit IDs
  if grep -q "BANNER_AD_UNIT" utils/adService.ts; then
    echo "✅ Banner ad unit ID found"
  else
    echo "⚠️ Banner ad unit ID not found"
  fi
  
  if grep -q "APP_OPEN_AD_UNIT" utils/adService.ts; then
    echo "✅ App open ad unit ID found"
  else
    echo "⚠️ App open ad unit ID not found"
  fi
  
  if grep -q "REWARDED_INTERSTITIAL_AD_UNIT" utils/adService.ts; then
    echo "✅ Rewarded interstitial ad unit ID found"
  else
    echo "⚠️ Rewarded interstitial ad unit ID not found"
  fi
else
  echo "❌ adService.ts file not found at expected location"
fi

echo -e "\n========================================"
echo "Verification Complete"
echo "========================================"

# Provide recommendations
echo -e "\nRecommendations:"
echo "1. If Google-Mobile-Ads-SDK is not found in CocoaPods, run './scripts/rebuild-ios.sh'"
echo "2. If AdMob initialization fails, verify the iOS App ID is correct"
echo "3. For iOS 14+, ensure SKAdNetworkItems are added to Info.plist"
echo "4. For Android, add androidAppId to app.json plugins configuration"
echo -e "\nFor detailed troubleshooting, check ADMOB_INTEGRATION.md"
