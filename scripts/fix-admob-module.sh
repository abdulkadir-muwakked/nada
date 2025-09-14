#!/bin/bash

# Script to fix AdMob module integration issues
# This script performs a deep clean and specific fixes for RNGoogleMobileAds native module

echo "Starting AdMob module fix process..."

# Clean iOS build files
echo "Cleaning iOS build directories..."
rm -rf ios/build
rm -rf ios/Pods

# Clean node_modules cache for react-native-google-mobile-ads
echo "Cleaning node_modules cache for Google Mobile Ads..."
rm -rf node_modules/react-native-google-mobile-ads/.build

# Remove iOS derived data for this project
echo "Removing Xcode derived data for this project..."
find ~/Library/Developer/Xcode/DerivedData -name "*MyApp*" -type d -exec rm -rf {} +

# Clean metro cache
echo "Cleaning metro bundler cache..."
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/haste-*

# Reinstall node modules (optional, uncomment if needed)
# echo "Reinstalling node modules..."
# rm -rf node_modules
# rm -f package-lock.json
# npm install

# Reinstall pods with specific Google Mobile Ads focus
echo "Reinstalling pods with AdMob focus..."
cd ios

# Remove Podfile.lock to ensure fresh installation
rm -f Podfile.lock

# Install pods
pod install

echo "Pod installation complete, running additional verification..."

# Check if Google-Mobile-Ads-SDK is properly installed
if grep -q "Google-Mobile-Ads-SDK" Pods/Manifest.lock; then
  echo "✅ Google Mobile Ads SDK found in pods manifest"
else
  echo "❌ Google Mobile Ads SDK not found in pods manifest. Installation may have failed."
fi

cd ..

echo "AdMob module fix process complete. Try running the app again."
echo "If you still encounter issues, consider adding these packages to your app.json:"
echo ""
echo "\"plugins\": ["
echo "  // other plugins..."
echo "  ["
echo "    \"react-native-google-mobile-ads\","
echo "    {"
echo "      \"iosAppId\": \"ca-app-pub-1609492440808781~3500829830\""
echo "    }"
echo "  ]"
echo "]"
