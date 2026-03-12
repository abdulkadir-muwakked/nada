import * as Linking from "expo-linking";
import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import NadaLogo from "./NadaLogo";
import { useRevenueCat } from "../context/RevenueCatContext";
import { useTheme } from "../hooks/useTheme";
import type { NadaThemeType } from "../types/nada";

const DEFAULT_TERMS_URL =
  "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";
const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ?? "";
const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL ?? DEFAULT_TERMS_URL;

const Paywall: React.FC = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {
    loading,
    error,
    offering,
    isPremium,
    monthlyPackage,
    yearlyPackage,
    purchaseMonthly,
    purchaseYearly,
    restorePurchases,
    refreshOfferings,
  } = useRevenueCat();

  const openExternalLink = useCallback(async (url: string, label: string) => {
    if (!url) {
      Alert.alert(
        `${label} unavailable`,
        `Set EXPO_PUBLIC_${label === "Privacy Policy" ? "PRIVACY_POLICY" : "TERMS"}_URL before shipping this build.`
      );
      return;
    }

    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert(`${label} unavailable`, `Couldn't open ${label.toLowerCase()}.`);
      return;
    }

    await Linking.openURL(url);
  }, []);

  const handleRestore = useCallback(async () => {
    const restored = await restorePurchases();
    if (restored) {
      Alert.alert("Purchases Restored", "Your premium access has been refreshed.");
    }
  }, [restorePurchases]);

  const reviewItems = [
    "Nada Premium",
    "Unlock Hypocrite Mode and premium sarcastic coaching",
  ];

  if (isPremium) {
    return (
      <View style={styles.stateCard}>
        <Text style={styles.stateTitle}>Premium active</Text>
        <Text style={styles.stateBody}>
          Hypocrite Mode is unlocked on this account.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <View style={styles.logoWrap}>
          <NadaLogo size="medium" />
          <Text style={styles.heroEyebrow}>Premium upgrade</Text>
        </View>
        <Text style={styles.heroTitle}>Nada Premium</Text>
        <Text style={styles.heroSubtitle}>
          Unlock Hypocrite Mode and premium sarcastic coaching.
        </Text>

        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Service</Text>
          <Text style={styles.infoValue}>{reviewItems[0]}</Text>
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>What you get</Text>
          <Text style={styles.infoValue}>{reviewItems[1]}</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Subscriptions unavailable</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={refreshOfferings}
            disabled={loading}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.planCard}>
        <Text style={styles.sectionTitle}>Choose a plan</Text>

        <TouchableOpacity
          style={[
            styles.planButton,
            !monthlyPackage && styles.planButtonDisabled,
          ]}
          onPress={() => void purchaseMonthly()}
          disabled={loading || !monthlyPackage}
        >
          <View>
            <Text style={styles.planTitle}>Monthly</Text>
            <Text style={styles.planMeta}>
              1 month of Hypocrite Mode access
            </Text>
          </View>
          <Text style={styles.planPrice}>
            {monthlyPackage?.product.priceString ?? "Unavailable"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.planButton,
            styles.planButtonPrimary,
            !yearlyPackage && styles.planButtonDisabled,
          ]}
          onPress={() => void purchaseYearly()}
          disabled={loading || !yearlyPackage}
        >
          <View>
            <Text style={styles.planTitle}>Yearly</Text>
            <Text style={styles.planMeta}>
              12 months of Hypocrite Mode access
            </Text>
          </View>
          <Text style={styles.planPrice}>
            {yearlyPackage?.product.priceString ?? "Unavailable"}
          </Text>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.loadingText}>Updating subscription status...</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.legalCard}>
        <Text style={styles.sectionTitle}>Subscription details</Text>
        <Text style={styles.legalText}>
          Auto-renewable subscription for Nada Premium. Payment is charged to
          your Apple ID at confirmation. Subscription renews automatically
          unless cancelled at least 24 hours before the end of the current
          period. You can manage or cancel your subscription in Apple ID
          settings after purchase.
        </Text>

        <View style={styles.linkRow}>
          <TouchableOpacity onPress={() => void openExternalLink(TERMS_URL, "Terms of Use")}>
            <Text style={styles.linkText}>Terms of Use</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => void openExternalLink(PRIVACY_URL, "Privacy Policy")}>
            <Text style={styles.linkText}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={() => void handleRestore()}
          disabled={loading}
        >
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        </TouchableOpacity>
      </View>

      {!offering ? (
        <Text style={styles.footnote}>
          If pricing does not appear, refresh offerings or test on a real iPhone
          with a Sandbox account.
        </Text>
      ) : null}
    </ScrollView>
  );
};

const createStyles = (theme: NadaThemeType) =>
  StyleSheet.create({
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 40,
      gap: 16,
    },
    heroCard: {
      backgroundColor: theme.colors.overlay,
      borderColor: theme.colors.overlayBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.large,
      padding: 20,
      gap: 12,
    },
    logoWrap: {
      alignItems: "flex-start",
      marginBottom: 2,
    },
    heroEyebrow: {
      color: theme.colors.primary,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
      marginTop: -8,
    },
    heroTitle: {
      color: theme.colors.text,
      fontSize: 32,
      fontWeight: "800",
    },
    heroSubtitle: {
      color: theme.colors.textSecondary,
      fontSize: 17,
      lineHeight: 24,
    },
    infoBlock: {
      gap: 4,
    },
    infoLabel: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    infoValue: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: "600",
      lineHeight: 22,
    },
    errorCard: {
      backgroundColor: theme.colors.overlay,
      borderColor: theme.colors.highlightBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.large,
      padding: 18,
      gap: 12,
    },
    errorTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: "700",
    },
    errorBody: {
      color: theme.colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    retryButton: {
      alignSelf: "flex-start",
      backgroundColor: theme.colors.highlight,
      borderColor: theme.colors.highlightBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.medium,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    retryButtonText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: "700",
    },
    planCard: {
      backgroundColor: theme.colors.overlay,
      borderColor: theme.colors.overlayBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.large,
      padding: 20,
      gap: 14,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: "700",
    },
    planButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.overlayBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.large,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    planButtonPrimary: {
      borderColor: theme.colors.highlightBorder,
      backgroundColor: theme.colors.highlight,
    },
    planButtonDisabled: {
      opacity: 0.5,
    },
    planTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: "700",
    },
    planMeta: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      marginTop: 4,
    },
    planPrice: {
      color: theme.colors.text,
      fontSize: 17,
      fontWeight: "800",
    },
    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 4,
    },
    loadingText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
    legalCard: {
      backgroundColor: theme.colors.overlay,
      borderColor: theme.colors.overlayBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.large,
      padding: 20,
      gap: 14,
    },
    legalText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
    },
    linkRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    linkText: {
      color: theme.colors.accent,
      fontSize: 15,
      fontWeight: "700",
    },
    restoreButton: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.overlayBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.large,
      paddingVertical: 14,
    },
    restoreButtonText: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: "700",
    },
    stateCard: {
      backgroundColor: theme.colors.overlay,
      borderColor: theme.colors.overlayBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.large,
      padding: 20,
      marginHorizontal: 20,
      marginTop: 20,
      gap: 8,
    },
    stateTitle: {
      color: theme.colors.text,
      fontSize: 22,
      fontWeight: "700",
    },
    stateBody: {
      color: theme.colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
    },
    footnote: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 20,
      textAlign: "center",
      paddingHorizontal: 12,
    },
  });

export default Paywall;
