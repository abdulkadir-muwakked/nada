import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import PremiumPaywall from "../../components/Paywall";
import PremiumMessageDemo from "../../components/PremiumMessageDemo";
import SafeScreen from "../../components/SafeScreen";
import { useRevenueCat } from "../../context/RevenueCatContext";

export default function PremiumMessagesScreen() {
  const { isPremium } = useRevenueCat();

  return (
    <SafeScreen style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          !isPremium && styles.paywallOnlyContent,
        ]}
      >
        <PremiumPaywall />
        {isPremium ? <PremiumMessageDemo isPremium={isPremium} /> : null}
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: 16,
  },
  paywallOnlyContent: {
    padding: 0,
  },
});
