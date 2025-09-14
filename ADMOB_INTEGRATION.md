# AdMob Integration Status

## Current Status

AdMob integration has been enabled in the app with the iOS App ID. Additional error handling and diagnostic tools have been implemented to address module linking issues. The Android App ID is still missing and should be configured before running on Android.

## Troubleshooting Tools

Several scripts have been created to help diagnose and fix AdMob integration issues:

1. `scripts/rebuild-ios.sh` - Basic rebuild of iOS project
2. `scripts/deep-clean-rebuild.sh` - Complete clean and rebuild for persistent issues
3. `scripts/fix-admob-module.sh` - Targeted fixes for AdMob module issues
4. `scripts/verify-admob.sh` - Diagnostic tool to verify AdMob integration

## Configuration Details

The AdMob integration has been set up with the following configuration:

1. iOS App ID: `ca-app-pub-1609492440808781~3500829830`
2. Android App ID: Not yet configured (required for Android builds)
3. SKAdNetworkItems added to Info.plist for iOS 14+ compliance

## Plugin Configuration in app.json

The plugin has been configured in app.json as follows:

```json
"plugins": [
  // other plugins...
  [
    "react-native-google-mobile-ads",
    {
      "iosAppId": "ca-app-pub-1609492440808781~3500829830"
    }
  ]
]
```

3. For iOS, ensure your Info.plist has the proper GAD keys:

   - The app already has `GADDelayAppMeasurementInit` key

4. For testing, you can use the following test IDs:

   - iOS Banner: `ca-app-pub-3940256099942544/2934735716`
   - iOS Interstitial: `ca-app-pub-3940256099942544/4411468910`
   - Android Banner: `ca-app-pub-3940256099942544/6300978111`
   - Android Interstitial: `ca-app-pub-3940256099942544/1033173712`

5. Implement ad components and services using the files:
   - `/components/BannerAdComponent.tsx`
   - `/components/AdTestScreen.tsx`
   - `/utils/adService.ts`
   - `/components/ConsentManager.tsx`

## Implementation Steps

Now that AdMob is configured, follow these steps to add ads to your application:

### 1. Initialize Google Mobile Ads SDK

Create or update the `adService.ts` file:

```typescript
import { MobileAds, MaxAdContentRating } from "react-native-google-mobile-ads";

// Test Ad Units (for development)
export const TEST_BANNER_AD_UNIT = "ca-app-pub-3940256099942544/2934735716";
export const TEST_INTERSTITIAL_AD_UNIT =
  "ca-app-pub-3940256099942544/4411468910";
export const TEST_REWARDED_AD_UNIT = "ca-app-pub-3940256099942544/1712485313";

// Production Ad Units (replace with your actual ad units)
export const BANNER_AD_UNIT = __DEV__
  ? TEST_BANNER_AD_UNIT
  : "YOUR_PRODUCTION_BANNER_AD_UNIT";
export const INTERSTITIAL_AD_UNIT = __DEV__
  ? TEST_INTERSTITIAL_AD_UNIT
  : "YOUR_PRODUCTION_INTERSTITIAL_AD_UNIT";
export const REWARDED_AD_UNIT = __DEV__
  ? TEST_REWARDED_AD_UNIT
  : "YOUR_PRODUCTION_REWARDED_AD_UNIT";

export const initializeAdMob = async () => {
  const adapterStatuses = await MobileAds().initialize();

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

  console.log("AdMob initialized", adapterStatuses);
  return adapterStatuses;
};
```

### 2. Create a BannerAdComponent

Update the `BannerAdComponent.tsx` file:

```tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";
import { BANNER_AD_UNIT } from "../utils/adService";

interface BannerAdComponentProps {
  size?: BannerAdSize;
}

const BannerAdComponent: React.FC<BannerAdComponentProps> = ({
  size = BannerAdSize.BANNER,
}) => {
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={BANNER_AD_UNIT}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginVertical: 10,
  },
});

export default BannerAdComponent;
```

### 3. Handling AdMob Initialization Issues

If you encounter issues with AdMob initialization, use the following troubleshooting approach:

1. Run the verification script: `./scripts/verify-admob.sh`
2. Check the console for detailed error messages
3. If the native module is missing, run `./scripts/fix-admob-module.sh`
4. Use the `AdMobInitializationTest` component to isolate and test AdMob initialization
5. Verify that the Google Mobile Ads SDK is correctly installed in the Pods directory

### 4. Future Android Configuration

When you're ready to run on Android, update app.json with the Android App ID:

```json
[
  "react-native-google-mobile-ads",
  {
    "iosAppId": "ca-app-pub-1609492440808781~3500829830",
    "androidAppId": "YOUR_ANDROID_APP_ID_HERE"
  }
]
```

### 5. Testing Ads

The `AdTestScreen.tsx` component has been implemented to test various ad formats in your app. Additionally, an `AdMobInitializationTest` component has been created to isolate and troubleshoot AdMob initialization issues.

To use these components:

1. Navigate to the Ad Test screen in the app
2. Choose between "Initialization Only" mode to test just the AdMob module loading
3. Or select "Full Ad Test" to test banner ads, app open ads, and rewarded interstitial ads

The test screen will display detailed error information in development mode to help diagnose any issues.
