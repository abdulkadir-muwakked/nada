import { useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import { useCallback } from "react";
import { Alert } from "react-native";

type OAuthProvider = "Google" | "Apple";

function isCancelledOAuthError(err: any): boolean {
  const code = err?.errors?.[0]?.code || err?.code || "";
  const message = String(err?.message || "").toLowerCase();
  return (
    code === "oauth_access_denied" ||
    code === "web_browser_closed" ||
    message.includes("cancel") ||
    message.includes("closed")
  );
}

function useSocialAuth(strategy: "oauth_google" | "oauth_apple", provider: OAuthProvider) {
  const { startOAuthFlow } = useOAuth({ strategy });

  const handleOAuthSignIn = useCallback(async () => {
    try {
      const { createdSessionId, signIn, signUp, setActive } =
        await startOAuthFlow();

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        return true;
      }

      if (signIn) {
        Alert.alert(
          "Additional Verification",
          "Please complete the verification process."
        );
        console.log(`Incomplete ${provider} sign-in:`, JSON.stringify(signIn, null, 2));
      } else if (signUp) {
        Alert.alert(
          "Additional Information",
          "Please provide additional information to complete your account."
        );
        console.log(`Incomplete ${provider} sign-up:`, JSON.stringify(signUp, null, 2));
      }

      return false;
    } catch (err: any) {
      console.error(`${provider} OAuth error`, err);

      if (isCancelledOAuthError(err)) {
        return false;
      }

      if (err.message?.includes("network")) {
        Alert.alert(
          "Network Error",
          `Check your internet connection. Even ${provider} can't help you if you're offline.`
        );
      } else if (err.message?.includes("popup")) {
        Alert.alert(
          "Browser Error",
          "The authentication window was blocked or closed. Try again."
        );
      } else {
        Alert.alert(
          "Authentication Error",
          `Failed to sign in with ${provider}. Try again.`
        );
      }

      return false;
    }
  }, [startOAuthFlow, provider]);

  return { handleOAuthSignIn };
}

export function useGoogleAuth() {
  const { handleOAuthSignIn } = useSocialAuth("oauth_google", "Google");
  const handleGoogleSignIn = useCallback(async () => handleOAuthSignIn(), [handleOAuthSignIn]);

  return { handleGoogleSignIn };
}

export function useAppleAuth() {
  const { handleOAuthSignIn } = useSocialAuth("oauth_apple", "Apple");
  const handleAppleSignIn = useCallback(async () => handleOAuthSignIn(), [handleOAuthSignIn]);

  return { handleAppleSignIn };
}

// Call this function in your _layout.tsx to initialize the WebBrowser
// For proper OAuth redirects
export function initializeOAuth() {
  WebBrowser.maybeCompleteAuthSession();
}
