#!/bin/zsh

# Script to generate all required app icon sizes from the master icon

# Create directories if they don't exist
mkdir -p ./assets/icons/ios
mkdir -p ./assets/icons/android

# Base paths
SOURCE_ICON="./assets/icon/nada-icon-1024.png"
TARGET_DIR_IOS="./assets/icons/ios"
TARGET_DIR_ANDROID="./assets/icons/android"

echo "Generating icons from master icon: $SOURCE_ICON"

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick is required but not installed."
    echo "Install it using: brew install imagemagick"
    exit 1
fi

# iOS icon sizes
IOS_SIZES=(
    "1024x1024"  # App Store
    "180x180"    # iPhone 6 Plus, 6s Plus, 7 Plus, 8 Plus (3x)
    "167x167"    # iPad Pro, iPad Air, iPad 10.2 (2x)
    "152x152"    # iPad, iPad mini (2x)
    "120x120"    # iPhone (2x, 3x)
    "87x87"      # iPhone spotlight (3x)
    "80x80"      # iPhone spotlight (2x)
    "76x76"      # iPad (1x)
    "60x60"      # iPhone (3x)
    "58x58"      # Settings (2x)
    "40x40"      # iPhone Spotlight (2x)
    "29x29"      # Settings (1x)
    "20x20"      # iPhone notification (2x, 3x)
)

echo "Generating iOS icons..."
for SIZE in ${IOS_SIZES[@]}; do
    echo "Creating $SIZE icon"
    convert "$SOURCE_ICON" -resize "$SIZE" "$TARGET_DIR_IOS/icon-$SIZE.png"
done

# Android icon sizes (mipmap directories)
ANDROID_SIZES=(
    "192x192:xxxhdpi"  # xxxhdpi (3.0x)
    "144x144:xxhdpi"   # xxhdpi (2.0x)
    "96x96:xhdpi"      # xhdpi (1.5x)
    "72x72:hdpi"       # hdpi (1.0x)
    "48x48:mdpi"       # mdpi (0.75x)
)

echo "Generating Android icons..."
for SIZE_DENSITY in ${ANDROID_SIZES[@]}; do
    SIZE=${SIZE_DENSITY%%:*}
    DENSITY=${SIZE_DENSITY#*:}
    echo "Creating $SIZE icon for $DENSITY"
    convert "$SOURCE_ICON" -resize "$SIZE" "$TARGET_DIR_ANDROID/icon-$DENSITY.png"
done

echo "Icon generation complete!"
echo "Icons are available in:"
echo "- iOS: $TARGET_DIR_IOS"
echo "- Android: $TARGET_DIR_ANDROID"
echo ""
echo "Next steps:"
echo "1. Copy iOS icons to Xcode project in Images.xcassets/AppIcon.appiconset"
echo "2. Copy Android icons to respective mipmap folders in android/app/src/main/res/"
echo "3. Update icon references in app.json and other configuration files"
