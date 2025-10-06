# Nada Pomodoro Development Client Workflow

This guide explains how to work with development builds for the Nada Pomodoro app.

## What is a Development Build?

A development build is a special version of your app that includes native modules (like background tasks and notifications) that don't work in Expo Go. For Nada Pomodoro, we need a development build to test:

- Background timer functionality
- Push notifications
- State persistence across app restarts

## Development Build Options

You have two ways to create development builds:

### 1. Local Builds

Local builds are created directly on your machine. They're faster for development but require proper environment setup.

- **iOS Local Build**: Requires macOS with Xcode installed
- **Android Local Build**: Requires Android SDK and NDK

### 2. EAS Cloud Builds

EAS Cloud builds are created on Expo's servers. They're more reliable but take longer.

- **iOS Cloud Build**: Works regardless of your local environment
- **Android Cloud Build**: Works regardless of your local environment

## How to Create and Use Development Builds

### Using the Development Build Helper

The easiest way to work with development builds is to use our helper script:

1. Open VS Code and run the **Run Dev Build Helper** task
2. Choose the appropriate option from the menu

### Creating Builds Directly

#### Local Builds

1. **iOS**: Run the VS Code task "Create iOS Dev Build (Local)"
2. **Android**: Run the VS Code task "Create Android Dev Build (Local)"

#### EAS Cloud Builds

1. **iOS**: Run the VS Code task "Create iOS Dev Build (Cloud)"
2. **Android**: Run the VS Code task "Create Android Dev Build (Cloud)"
3. After the build completes, run the "Download Cloud Builds" task

### Installing Builds

Use the Dev Build Helper to:

1. Install iOS builds on simulators
2. Install Android builds on connected devices

### Testing Builds

After installing a development build:

1. Run the "Verify Notifications" task to check notification functionality
2. Test background timer operations as described in DEV_BUILD_TESTING.md
3. Start the development client with "Start Dev Client" task to connect to your local dev server

## Troubleshooting

### iOS Build Issues

- Make sure Xcode is properly installed and configured
- If the build fails with missing dependencies, run `pod install` in the ios directory
- For cloud build errors, check the build logs on the Expo website

### Android Build Issues

- Ensure Android SDK is properly configured
- If you see Gradle errors, try cleaning the build with `./scripts/deep-clean-rebuild.sh`
- For cloud build errors, check the build logs on the Expo website

### Testing Issues

- If notifications don't work, verify the configuration using `./scripts/verify-notifications.sh`
- If background timers stop working after device reboot, check for permissions issues
- Ensure proper Clerk authentication is set up for full app functionality

## Need More Help?

Refer to the following resources:

- `DEV_BUILD_TESTING.md` - Detailed testing procedures
- Expo Documentation: [Development Builds](https://docs.expo.dev/development/development-builds/introduction/)
- Expo Documentation: [Background Tasks](https://docs.expo.dev/versions/latest/sdk/task-manager/)
