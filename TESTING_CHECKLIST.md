# Development Build Installation & Testing Checklist

Use this checklist to systematically verify that your Nada Pomodoro development build is working correctly after installation.

## Pre-Installation

- [ ] EAS build completed successfully for iOS simulator
- [ ] EAS build completed successfully for iOS device
- [ ] EAS build completed successfully for Android

## Installation

### iOS Simulator

- [ ] Downloaded .tar.gz from EAS Build page
- [ ] Extracted .app file
- [ ] Dragged app file onto simulator
- [ ] App installed correctly with Nada icon

### iOS Device

- [ ] Downloaded app via QR code or link
- [ ] Trusted developer certificate in Settings
- [ ] App launched successfully with Nada icon

### Android

- [ ] Downloaded APK from EAS Build page
- [ ] Installed APK on device
- [ ] App launched successfully with Nada icon

## Background Functionality Testing

- [ ] App launches and shows timer UI
- [ ] Able to set custom durations
- [ ] Timer starts when tapping Start button
- [ ] Timer continues when app is in background
- [ ] Notification appears when timer completes in background
- [ ] Tapping notification opens app correctly
- [ ] Timer state persists after force-closing and reopening app

## Notification Testing

- [ ] Notification permission request appears
- [ ] Focus session end notification shows with correct message
- [ ] Break session end notification shows with correct message
- [ ] Notification sound plays
- [ ] Notification vibration works
- [ ] Notification appears with app completely closed

## Advanced Testing

- [ ] Run through at least 3 complete focus/break cycles
- [ ] Test with device in battery saving mode
- [ ] Test after device reboot (Android)
- [ ] Test with airplane mode then reconnect
- [ ] Check battery usage after an hour of usage

## Bug Reporting

If you find any issues with the development build, please include:

1. Device model and OS version
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Screenshots if applicable

## Notes

- Background functionality may work differently across devices due to manufacturer-specific battery optimization settings
- On Android, you may need to disable battery optimization for the app
- On iOS, ensure Background App Refresh is enabled for the app
