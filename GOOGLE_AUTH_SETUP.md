# Google Authentication Setup Guide

This app supports Google OAuth authentication via Clerk. Follow these steps to enable Google Sign-in:

## 1. Create Clerk Application (if not already done)

1. Go to [clerk.dev](https://clerk.dev) and sign up for an account
2. Create a new application or use your existing one
3. Get your publishable key and add it to your `.env` file:
   ```
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
   ```

## 2. Enable Google OAuth Provider

1. Go to your Clerk Dashboard
2. Navigate to "Authentication" → "Social Connections"
3. Find Google in the list and click "Enable"
4. You'll need to create OAuth credentials in the Google Cloud Console:

## 3. Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth client ID"
5. Configure the OAuth consent screen if prompted:
   - Add your app name and developer email
   - For scopes, select "email" and "profile" at minimum
6. For application type, select "Web application"
7. Add the Authorized JavaScript origins:
   ```
   https://accounts.clerk.dev
   ```
8. Add the Authorized redirect URIs from Clerk:
   ```
   https://accounts.clerk.dev/oauth_callback
   ```
   (You can find the exact URL in your Clerk Dashboard under Google settings)
9. Click "Create" to get your Client ID and Client Secret

## 4. Add Credentials to Clerk

1. Return to the Clerk Dashboard
2. Enter your Google Client ID and Client Secret
3. Save the configuration

## 5. Testing

1. Run your app using `npx expo start`
2. Navigate to the sign-in or sign-up screens
3. Tap the "Sign in with Google" button to test the integration

## Troubleshooting

- If you encounter any issues with OAuth redirects, make sure your redirect URIs are correctly configured
- For development, ensure you're testing on a real device or emulator with Google Play Services installed
- Check the Clerk documentation for more details: [Clerk OAuth Guide](https://clerk.dev/docs/authentication/social-connections/google)

## Error Handling

The app includes comprehensive error handling for Google authentication:

- Validation errors are shown directly on the respective input fields
- General error messages appear in a red error box
- Network-related errors trigger appropriate notifications
- The Nada character provides contextual snarky responses to specific error types
- Password minimum length (8 characters) and other requirements are enforced with clear feedback
