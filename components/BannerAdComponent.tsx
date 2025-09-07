import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// Production ad unit ID
const BANNER_AD_UNIT_ID = __DEV__ 
  ? TestIds.BANNER 
  : 'nadaca-app-pub-1609492440808781/9451994669';

interface BannerAdComponentProps {
  unitId?: string;
  size?: BannerAdSize;
  style?: object;
}

const BannerAdComponent: React.FC<BannerAdComponentProps> = ({ 
  unitId = BANNER_AD_UNIT_ID, 
  size = BannerAdSize.BANNER,
  style 
}) => {
  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={unitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});

export default BannerAdComponent;
