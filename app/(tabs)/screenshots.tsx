import { useRouter } from "expo-router";
import React from "react";
import { StatusBar } from "react-native";
import AppStoreScreenshotHelper from "../../components/AppStoreScreenshotHelper";
import { NadaTheme } from "../../constants/NadaTheme";
import { isDevelopment } from "../../utils/environment";

/**
 * This screen is used to generate App Store screenshots
 * It will not be included in the production build
 */
export default function ScreenshotPage() {
  const router = useRouter();

  // Prevent access in production builds
  if (!isDevelopment) {
    // Redirect to home screen in production
    router.replace("/");
    return null;
  }

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={NadaTheme.colors.background}
      />
      <AppStoreScreenshotHelper />
    </>
  );
}
