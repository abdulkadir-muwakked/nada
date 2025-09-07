import { useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import { useCallback } from "react";
import { Alert } from "react-native";

export function useGoogleAuth() {
  // Get the OAuth helper from Clerk
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const handleGoogleSignIn = useCallback(async () => {
    try {
      // Start the OAuth flow and wait for it to complete
      const { createdSessionId, signIn, signUp, setActive } =
        await startOAuthFlow();

      // If we have a created session, use it
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        return true;
      } else {
        // The user might have signed up or signed in and there might
        // be additional steps like email verification
        if (signIn) {
          // Handle incomplete sign-in process
          Alert.alert(
            "Additional Verification",
            "Please complete the verification process."
          );
          console.log("Incomplete sign-in:", JSON.stringify(signIn, null, 2));
        } else if (signUp) {
          // Handle incomplete sign-up process
          Alert.alert(
            "Additional Information",
            "Please provide additional information to complete your account."
          );
          console.log("Incomplete sign-up:", JSON.stringify(signUp, null, 2));
        }
        return false;
      }
    } catch (err: any) {
      // Handle errors here with more detailed messages
      console.error("OAuth error", err);

      // Handle different error scenarios
      if (err.message?.includes("network")) {
        Alert.alert(
          "Network Error",
          "Check your internet connection. Even Google can't help you if you're offline."
        );
      } else if (err.message?.includes("cancel")) {
        Alert.alert(
          "Sign-in Cancelled",
          "You cancelled the sign-in process. Commitment issues, I see."
        );
      } else if (err.message?.includes("popup")) {
        Alert.alert(
          "Browser Error",
          "The authentication window was blocked or closed. Try again, if you can handle it."
        );
      } else {
        Alert.alert(
          "Authentication Error",
          "Failed to sign in with Google. Try again, or don't. I'm not your boss."
        );
      }

      return false;
    }
  }, [startOAuthFlow]);

  return { handleGoogleSignIn };
}

// Call this function in your _layout.tsx to initialize the WebBrowser
// For proper OAuth redirects
export function initializeOAuth() {
  WebBrowser.maybeCompleteAuthSession();
}
