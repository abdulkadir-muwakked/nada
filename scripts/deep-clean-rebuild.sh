#!/bin/bash

# Deep clean and rebuild for iOS

echo "Performing deep clean of iOS build..."

# Remove derived data
echo "Removing Xcode derived data for this project..."
find ~/Library/Developer/Xcode/DerivedData -name "*MyApp*" -type d -exec rm -rf {} +

# Remove pods
echo "Removing Pods directory..."
rm -rf ios/Pods

# Clean Xcode project
echo "Cleaning Xcode project caches..."
xcodebuild clean -workspace ios/MyApp.xcworkspace -scheme MyApp

# Remove lock file
echo "Removing Podfile.lock..."
rm -f ios/Podfile.lock

# Reinstall pods
echo "Reinstalling pods..."
cd ios && pod install && cd ..

echo "Deep clean completed. Your iOS build should be fresh now."