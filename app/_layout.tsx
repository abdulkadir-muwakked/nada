import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import SafeScreen from "../components/SafeScreen";
import { NadaTheme } from "../constants/NadaTheme";
import { initializeAdMob } from "../utils/adService";
import { initializeOAuth } from "../utils/oauth";

// Initialize OAuth for Google sign-in
initializeOAuth();

export default function RootLayout() {
  // Initialize AdMob when the app starts
  useEffect(() => {
    // Try to initialize AdMob but don't block the app if it fails
    const initAds = async () => {
      try {
        console.log("Starting AdMob initialization in _layout.tsx...");
        await initializeAdMob();
        console.log("AdMob initialized successfully in _layout.tsx");
      } catch (error) {
        // Log the error but continue app initialization
        console.error("Error initializing AdMob in _layout.tsx:", error);
        console.log("App will continue without AdMob functionality");
      }
    };

    initAds();
  }, []);

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
