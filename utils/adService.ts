import mobileAds, {
  MaxAdContentRating,
  BannerAdSize,
  TestIds,
  InterstitialAd,
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';

// For debugging - can switch between test and production ads
const USE_TEST_ADS = __DEV__; // Automatically use test ads in development

// Production and Test Ad Unit IDs
const AD_UNIT_IDS = {
  BANNER: USE_TEST_ADS 
    ? TestIds.BANNER 
    : 'nadaca-app-pub-1609492440808781/9451994669',
  INTERSTITIAL: USE_TEST_ADS 
    ? TestIds.INTERSTITIAL 
    : 'nadaca-app-pub-1609492440808781/9451994669',
  REWARDED: USE_TEST_ADS 
    ? TestIds.REWARDED 
    : 'nadaca-app-pub-1609492440808781/9451994669',
};

/**
 * Initialize the Google Mobile Ads SDK
 */
export const initializeAds = async () => {
  await mobileAds()
    .setRequestConfiguration({
      // Update all future requests suitable for parental guidance
      maxAdContentRating: MaxAdContentRating.PG,
      
      // Indicates that you want your content treated as child-directed for purposes of COPPA.
      tagForChildDirectedTreatment: true,
      
      // Indicates that you want the ad request to be handled in a
      // manner suitable for users under the age of consent.
      tagForUnderAgeOfConsent: true,
      
      // An array of test device IDs to allow.
      testDeviceIdentifiers: ['EMULATOR'],
    });
    
  return mobileAds()
    .initialize()
    .then(adapterStatuses => {
      // Initialization complete!
      return adapterStatuses;
    });
};

/**
 * Banner Ad Component Props
 */
export const createBannerAd = (unitId = AD_UNIT_IDS.BANNER) => {
  return {
    unitId,
    size: BannerAdSize.BANNER,
  };
};

/**
 * Load and show an interstitial ad
 */
export const showInterstitialAd = async () => {
  // Create a new instance
  const interstitialAd = InterstitialAd.createForAdRequest(AD_UNIT_IDS.INTERSTITIAL);
  
  // Add event handlers
  return new Promise((resolve) => {
    interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      interstitialAd.show();
    });
    
    interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      resolve(true);
    });
    
    interstitialAd.addAdEventListener(AdEventType.ERROR, () => {
      resolve(false);
    });
    
    // Start loading the ad
    interstitialAd.load();
  });
};

/**
 * Load and show a rewarded ad
 */
export const showRewardedAd = async () => {
  // Create a new instance
  const rewardedAd = RewardedAd.createForAdRequest(AD_UNIT_IDS.REWARDED);
  
  // Add event handlers
  return new Promise((resolve) => {
    let earned = false;
    
    rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      rewardedAd.show();
    });
    
    rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
      earned = true;
    });
    
    rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      resolve(earned);
    });
    
    rewardedAd.addAdEventListener(AdEventType.ERROR, () => {
      resolve(false);
    });
    
    // Start loading the ad
    rewardedAd.load();
  });
};
