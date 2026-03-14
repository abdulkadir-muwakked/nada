import * as Linking from "expo-linking";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">(
    "monthly"
  );

  useEffect(() => {
    if (monthlyPackage) {
      setSelectedPlan("monthly");
      return;
    }

    if (yearlyPackage) {
      setSelectedPlan("yearly");
    }
  }, [monthlyPackage, yearlyPackage]);

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

  const selectedPackage =
    selectedPlan === "monthly" ? monthlyPackage : yearlyPackage;

  const selectedPurchaseLabel = selectedPackage
    ? `Start Premium — ${selectedPackage.product.priceString}${
        selectedPlan === "monthly" ? "/month" : "/year"
      }`
    : "Start Premium";

  const handlePurchase = useCallback(async () => {
    if (selectedPlan === "monthly") {
      await purchaseMonthly();
      return;
    }

    await purchaseYearly();
  }, [purchaseMonthly, purchaseYearly, selectedPlan]);

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
          Upgrade to Premium. Nada becomes… supportive. For a price.
        </Text>

        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Service</Text>
          <Text style={styles.infoValue}>Nada Premium</Text>
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>What you get</Text>
          <View style={styles.benefitsList}>
            <Text style={styles.benefitLine}>
              • Hypocrite Mode – Nada starts praising everything you do
            </Text>
            <Text style={styles.benefitLine}>
              • Even zero work becomes “impressive”
            </Text>
            <Text style={styles.benefitLine}>
              • Turn off the brutal honesty
            </Text>
          </View>
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
            selectedPlan === "monthly" && styles.planButtonSelected,
            !monthlyPackage && styles.planButtonDisabled,
          ]}
          onPress={() => setSelectedPlan("monthly")}
          disabled={!monthlyPackage}
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
            selectedPlan === "yearly" && styles.planButtonSelected,
            !yearlyPackage && styles.planButtonDisabled,
          ]}
          onPress={() => setSelectedPlan("yearly")}
          disabled={!yearlyPackage}
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

        <TouchableOpacity
          style={[
            styles.purchaseButton,
            (!selectedPackage || loading) && styles.purchaseButtonDisabled,
          ]}
          onPress={() => void handlePurchase()}
          disabled={loading || !selectedPackage}
        >
          {loading ? (
            <View style={styles.purchaseLoadingContent}>
              <ActivityIndicator color={theme.colors.background} />
              <Text style={styles.purchaseButtonText}>Processing...</Text>
            </View>
          ) : (
            <Text style={styles.purchaseButtonText}>{selectedPurchaseLabel}</Text>
          )}
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
          Auto-renewable subscription for Nada Premium.{"\n"}
          Payment is charged to your Apple ID at confirmation.{"\n"}
          Subscription renews automatically unless cancelled at least 24 hours
          before the end of the current period.{"\n"}
          You can manage or cancel your subscription in Apple ID settings after
          purchase.
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
    benefitsList: {
      gap: 8,
      marginTop: 2,
    },
    benefitLine: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: "600",
      lineHeight: 24,
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
    planButtonSelected: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
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
    purchaseButton: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.large,
      minHeight: 56,
      paddingHorizontal: 18,
      paddingVertical: 14,
    },
    purchaseButtonDisabled: {
      opacity: 0.6,
    },
    purchaseLoadingContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    purchaseButtonText: {
      color: theme.colors.background,
      fontSize: 16,
      fontWeight: "800",
      textAlign: "center",
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
  });

export default Paywall;
