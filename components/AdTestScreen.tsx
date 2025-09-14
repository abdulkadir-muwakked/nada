import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  AdEventType,
  AppOpenAd,
  BannerAdSize,
  RewardedAdEventType,
  RewardedInterstitialAd,
} from "react-native-google-mobile-ads";
import { NadaTheme } from "../constants/NadaTheme";
import {
  APP_OPEN_AD_UNIT,
  REWARDED_INTERSTITIAL_AD_UNIT,
  TEST_APP_OPEN_AD_UNIT,
  TEST_REWARDED_INTERSTITIAL_AD_UNIT,
} from "../utils/adService";
import BannerAdComponent from "./BannerAdComponent";

const AdTestScreen: React.FC = () => {
  const [adStatus, setAdStatus] = useState<string>("");

  // Function to load and display rewarded interstitial ad
  const showRewardedInterstitialAd = async () => {
    setAdStatus("Loading rewarded interstitial ad...");

    try {
      const rewardedInterstitial = RewardedInterstitialAd.createForAdRequest(
        __DEV__
          ? TEST_REWARDED_INTERSTITIAL_AD_UNIT
          : REWARDED_INTERSTITIAL_AD_UNIT,
        {
          requestNonPersonalizedAdsOnly: true,
        }
      );

      const unsubscribeLoaded = rewardedInterstitial.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => {
          setAdStatus("Rewarded interstitial ad loaded. Showing ad...");
          rewardedInterstitial.show();
        }
      );

      const unsubscribeEarnedReward = rewardedInterstitial.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        (reward) => {
          setAdStatus(`Reward earned: ${reward.amount} ${reward.type}`);
          Alert.alert(
            "Reward Earned",
            `You earned ${reward.amount} ${reward.type}!`
          );
        }
      );

      const unsubscribeError = rewardedInterstitial.addAdEventListener(
        AdEventType.ERROR,
        (error) => {
          setAdStatus(`Error loading rewarded interstitial: ${error.message}`);
        }
      );

      rewardedInterstitial.load();

      // Clean up event listeners
      return () => {
        unsubscribeLoaded();
        unsubscribeEarnedReward();
        unsubscribeError();
      };
    } catch (error) {
      setAdStatus(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  // Function to load and display app open ad
  const showAppOpenAd = async () => {
    setAdStatus("Loading app open ad...");

    try {
      const appOpenAd = AppOpenAd.createForAdRequest(
        __DEV__ ? TEST_APP_OPEN_AD_UNIT : APP_OPEN_AD_UNIT,
        {
          requestNonPersonalizedAdsOnly: true,
        }
      );

      const unsubscribeLoaded = appOpenAd.addAdEventListener(
        AdEventType.LOADED,
        () => {
          setAdStatus("App open ad loaded. Showing ad...");
          appOpenAd.show();
        }
      );

      const unsubscribeError = appOpenAd.addAdEventListener(
        AdEventType.ERROR,
        (error) => {
          setAdStatus(`Error loading app open ad: ${error.message}`);
        }
      );

      appOpenAd.load();

      // Clean up event listeners
      return () => {
        unsubscribeLoaded();
        unsubscribeError();
      };
    } catch (error) {
      setAdStatus(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>AdMob Test Screen</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Banner Ads</Text>
        <Text style={styles.sectionSubtitle}>Standard Banner</Text>
        <BannerAdComponent size={BannerAdSize.BANNER} />

        <Text style={styles.sectionSubtitle}>Large Banner</Text>
        <BannerAdComponent size={BannerAdSize.LARGE_BANNER} />

        <Text style={styles.sectionSubtitle}>Medium Rectangle</Text>
        <BannerAdComponent size={BannerAdSize.MEDIUM_RECTANGLE} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Advanced Ad Formats</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={showRewardedInterstitialAd}
        >
          <Text style={styles.buttonText}>Show Rewarded Interstitial Ad</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={showAppOpenAd}>
          <Text style={styles.buttonText}>Show App Open Ad</Text>
        </TouchableOpacity>

        {adStatus ? (
          <View style={styles.statusContainer}>
            <Text style={styles.statusTitle}>Ad Status:</Text>
            <Text style={styles.statusText}>{adStatus}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AdMob Configuration</Text>
        <Text style={styles.statusText}>
          • iOS App ID: ca-app-pub-1609492440808781~3500829830
        </Text>
        <Text style={styles.statusText}>
          • Banner Ad Unit: ca-app-pub-1609492440808781/3540605709
        </Text>
        <Text style={styles.statusText}>
          • App Open Ad Unit: ca-app-pub-1609492440808781/6584876919
        </Text>
        <Text style={styles.statusText}>
          • Rewarded Interstitial Ad Unit:
          ca-app-pub-1609492440808781/6466329555
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NadaTheme.colors.background,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: NadaTheme.colors.text,
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 30,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: NadaTheme.colors.text,
    marginBottom: 15,
    textAlign: "center",
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: NadaTheme.colors.textSecondary,
    marginTop: 10,
    marginBottom: 5,
  },
  button: {
    backgroundColor: NadaTheme.colors.primary,
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  statusContainer: {
    marginTop: 15,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  statusTitle: {
    color: NadaTheme.colors.text,
    fontWeight: "600",
    marginBottom: 5,
  },
  statusText: {
    color: NadaTheme.colors.text,
    marginBottom: 10,
    lineHeight: 20,
  },
  noteText: {
    color: NadaTheme.colors.textSecondary,
    fontStyle: "italic",
  },
});

export default AdTestScreen;
