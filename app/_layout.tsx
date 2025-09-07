import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import SafeScreen from "../components/SafeScreen";
import { NadaTheme } from "../constants/NadaTheme";
import { initializeOAuth } from "../utils/oauth";

// Initialize OAuth for Google sign-in
initializeOAuth();

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <StatusBar
        style="light"
        backgroundColor={NadaTheme.colors.background}
        translucent={false}
      />
      <SafeScreen>
        <Slot />
      </SafeScreen>
    </ClerkProvider>
  );
}
