import React from "react";
import { StyleSheet, View } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { BANNER_AD_UNIT } from "../utils/adService";
import AdErrorBoundary from "./AdErrorBoundary";

interface BannerAdComponentProps {
  size?: BannerAdSize;
}

const BannerAdComponent: React.FC<BannerAdComponentProps> = ({
  size = BannerAdSize.BANNER,
}) => {
  return (
    <AdErrorBoundary>
      <View style={styles.container}>
        <BannerAd
          unitId={BANNER_AD_UNIT}
          size={size}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </View>
    </AdErrorBoundary>
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
