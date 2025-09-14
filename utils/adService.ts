import { MaxAdContentRating, MobileAds } from "react-native-google-mobile-ads";

// Test Ad Units (for development)
export const TEST_BANNER_AD_UNIT = "ca-app-pub-3940256099942544/2934735716";
export const TEST_INTERSTITIAL_AD_UNIT =
  "ca-app-pub-3940256099942544/4411468910";
export const TEST_REWARDED_AD_UNIT = "ca-app-pub-3940256099942544/1712485313";
export const TEST_APP_OPEN_AD_UNIT = "ca-app-pub-3940256099942544/5662855259";
export const TEST_REWARDED_INTERSTITIAL_AD_UNIT =
  "ca-app-pub-3940256099942544/6978759866";

// Production Ad Units - actual ad units for Nada app
export const BANNER_AD_UNIT = __DEV__
  ? TEST_BANNER_AD_UNIT
  : "ca-app-pub-1609492440808781/3540605709";
export const APP_OPEN_AD_UNIT = __DEV__
  ? TEST_APP_OPEN_AD_UNIT
  : "ca-app-pub-1609492440808781/6584876919";
export const REWARDED_INTERSTITIAL_AD_UNIT = __DEV__
  ? TEST_REWARDED_INTERSTITIAL_AD_UNIT
  : "ca-app-pub-1609492440808781/6466329555";

export const initializeAdMob = async () => {
  try {
    console.log("Starting AdMob initialization process...");

    // Check if MobileAds is available
    if (!MobileAds) {
      throw new Error("MobileAds module is not available");
    }

    // Try to initialize with additional error handling
    console.log("Calling MobileAds().initialize()...");
    const adapterStatuses = await MobileAds().initialize();
    console.log("AdMob initialization returned:", adapterStatuses);

    // Set request configuration
    console.log("Setting AdMob request configuration...");
    await MobileAds().setRequestConfiguration({
      // Set max ad content rating
      maxAdContentRating: MaxAdContentRating.PG,
      // Indicates if you want your app to be treated as child-directed for COPPA
      tagForChildDirectedTreatment: false,
      // Indicates if you want your app to be treated as users under the age of consent
      tagForUnderAgeOfConsent: false,
      // Test device IDs for testing ads
      testDeviceIdentifiers: ["EMULATOR"],
    });

    console.log("AdMob initialized successfully");
    return adapterStatuses;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to initialize AdMob: ${errorMessage}`);

    // Log more detailed diagnostics
    console.error("AdMob initialization error details:", {
      errorType: error?.constructor?.name || "Unknown",
      message: errorMessage,
      stack: error instanceof Error ? error.stack : "No stack trace available",
    });

    throw error; // Rethrow to allow proper error handling
  }
};
