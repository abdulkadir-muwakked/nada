# App Icon Generation Guide for "nada"

This guide explains how to generate and configure app icons for the "nada" app using Expo's built-in asset management.

## Current Setup

The master app icon is located at:

- `./assets/icon/nada-icon-1024.png` (1024x1024 pixels)

This is a high-resolution image of the sarcastic "nada" face logo.

## Expo Asset Management

Expo automatically generates all required icon sizes for both iOS and Android from the main icon specified in `app.json`. The configuration has been updated to use the new icon:

```json
"icon": "./assets/icon/nada-icon-1024.png"
```

For the splash screen, we're using the same icon:

```json
"splash": {
  "image": "./assets/icon/nada-icon-1024.png",
  "imageWidth": 200,
  "resizeMode": "contain",
  "backgroundColor": "#1a1a2e"
}
```

## Manual Icon Generation (if needed)

If you need to customize the icons beyond what Expo provides, you can use the included script:

```bash
./scripts/generate-app-icons.sh
```

This script uses ImageMagick to generate all the required icon sizes for iOS and Android from the master icon.

### Requirements

- ImageMagick (install with `brew install imagemagick`)

### Generated Icons

The script will create:

1. **iOS Icons** in `./assets/icons/ios/`:

   - App Store icon (1024x1024)
   - iPhone and iPad icons of various sizes (180x180, 167x167, etc.)

2. **Android Icons** in `./assets/icons/android/`:
   - xxxhdpi (192x192)
   - xxhdpi (144x144)
   - xhdpi (96x96)
   - hdpi (72x72)
   - mdpi (48x48)

## Applying Custom Icons (if needed)

### iOS:

1. Open the Xcode project
2. Navigate to `Images.xcassets/AppIcon.appiconset`
3. Replace the icons with the generated ones

### Android:

1. Copy the generated icons to the respective mipmap directories in `android/app/src/main/res/`
   - For example: `mipmap-xxxhdpi`, `mipmap-xxhdpi`, etc.

## Verification

After building the app, verify that:

1. The app icon on both iOS and Android shows the sarcastic "nada" face logo
2. The splash screen displays the same logo on a dark background (#1a1a2e)

## Note

For most Expo projects, manual icon generation is not necessary as Expo handles this automatically. The script is provided as a fallback option for advanced customization.
