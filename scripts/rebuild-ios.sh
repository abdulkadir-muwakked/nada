#!/bin/bash

# Clean iOS build files
echo "Cleaning iOS build files..."
rm -rf ios/build
rm -rf ios/Pods

# Reinstall pods
echo "Reinstalling pods..."
cd ios
pod install
cd ..

echo "iOS rebuild complete!"