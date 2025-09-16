# App Store Connect Setup Guide

This guide provides instructions for completing your App Store Connect setup for Nada App.

## 1. App Store Connect - Basic App Information

Log in to [App Store Connect](https://appstoreconnect.apple.com/) and ensure you've completed the following:

- **App Name:** Nada
- **Primary Language:** English
- **Bundle ID:** com.mycompany.myapp
- **SKU:** NADA2025 (or your preferred unique identifier)
- **User Access:** Ensure team members have appropriate access

## 2. App Privacy

### Privacy Policy URL

Add the URL where your privacy policy is hosted. This should be a publicly accessible web page.

Example: `https://yourwebsite.com/nada-privacy-policy`

### Privacy Questionnaire

Complete the App Privacy questionnaire by declaring all data types your app collects:

- **User Content**

  - [ ] No
  - [x] Yes
    - User authentication data

- **Health & Fitness**

  - [x] No
  - [ ] Yes

- **Financial Info**

  - [x] No
  - [ ] Yes

- **Location**

  - [x] No
  - [ ] Yes

- **Contacts**

  - [x] No
  - [ ] Yes

- **User Content**

  - [x] No
  - [ ] Yes

- **Browsing History**

  - [x] No
  - [ ] Yes

- **Search History**

  - [x] No
  - [ ] Yes

- **Identifiers**

  - [ ] No
  - [x] Yes
    - User ID
    - Device ID

- **Purchases**

  - [x] No
  - [ ] Yes

- **Usage Data**

  - [ ] No
  - [x] Yes
    - Product Interaction
    - Advertising Data

- **Diagnostics**

  - [ ] No
  - [x] Yes
    - Crash Data
    - Performance Data

- **Other Data**
  - [x] No
  - [ ] Yes

## 3. Content Rating Questionnaire

Complete the following questionnaire accurately to determine your app's age rating:

### Unrestricted Web Access

- [x] No
- [ ] Yes

### Gambling and Contests

- [x] No
- [ ] Yes

### Cartoon or Fantasy Violence

- [x] No
- [ ] Yes

### Realistic Violence

- [x] No
- [ ] Yes

### Horror/Fear Themes

- [x] No
- [ ] Yes

### Sexual Content or Nudity

- [x] No
- [ ] Yes

### Profanity or Crude Humor

- [x] No
- [ ] Yes

### Alcohol, Tobacco, or Drug Use or References

- [x] No
- [ ] Yes

### Mature/Suggestive Themes

- [x] No
- [ ] Yes

### Simulated Gambling

- [x] No
- [ ] Yes

### Medical/Treatment Information

- [x] No
- [ ] Yes

Based on these answers, your app should receive a 4+ age rating.

## 4. App Store Listing

### App Information

- **App Name:** Nada
- **Subtitle:** Pomodoro Timer with Attitude
- **Category:** Primary: Productivity, Secondary: Lifestyle
- **Keywords:** pomodoro, timer, productivity, focus, time management
- **Support URL:** https://yourwebsite.com/support
- **Marketing URL (Optional):** https://yourwebsite.com

### Description

Start with a compelling first paragraph that clearly explains what your app does.

Example:

```
Nada is a minimalist Pomodoro timer with attitude. Designed for those who want a distraction-free productivity tool with a touch of existential humor. Set timers, track sessions, and get work done with zero judgment (well, maybe a little).

FEATURES:
• Simple, distraction-free Pomodoro timer
• Customizable work and break intervals
• Session tracking and statistics
• Ambient sounds to enhance focus
• Dark mode designed for comfort during long sessions
• Minimalist interface with attitude

Whether you're studying, working, or just trying to focus on a task, Nada keeps you on track with a hint of existential comedy to make productivity a little more bearable.
```

### What's New in This Version (For updates)

For your initial release:

```
Initial release of Nada Pomodoro Timer
```

## 5. App Review Information

### Contact Information

- **First Name:** [Your First Name]
- **Last Name:** [Your Last Name]
- **Phone Number:** [Your Phone Number]
- **Email:** [Your Email]

### Review Notes

Provide any necessary information for the reviewer, such as:

```
Nada is a Pomodoro timer app with a minimalist interface and humorous messaging. No special account is needed to use the app - users can start using all features immediately after installation.

The app contains advertisements via Google AdMob.
```

### Sign-in Information

If your app requires authentication to access all features, provide test account credentials:

```
Username: reviewer@example.com
Password: Test1234!
```

## 6. Versions

### Build

Upload your build through Xcode or Transporter, then select it here.

### App Store Icon

Ensure your app icon meets these requirements:

- 1024 x 1024 pixels
- RGB color space
- No alpha channel
- Straight, 90-degree corners (no rounded corners)
- PNG or JPEG format

### App Preview and Screenshots

Upload the screenshots generated using the screenshot helper for each required device size:

- iPhone 6.7" (iPhone 15 Pro Max)
- iPhone 6.1" (iPhone 15 Pro)
- iPhone 4.7" (iPhone SE 3rd gen)
- iPad Pro (if iPad is supported)

## 7. Release Options

### Automatic Release or Manual Release

Choose whether to release the app automatically after approval or manually.

### App Store Badge and Link

Generate marketing materials for your app:
https://developer.apple.com/app-store/marketing/guidelines/
