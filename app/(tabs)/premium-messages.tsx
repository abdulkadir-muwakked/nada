import React from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PremiumMessageDemo from "../../components/PremiumMessageDemo";
import SafeScreen from "../../components/SafeScreen";
import { useRevenueCat } from "../../context/RevenueCatContext";
import { useTheme } from "../../hooks/useTheme";

/**
 * Premium Messages Demo Screen
 * This screen showcases the difference between regular messages and premium "Hypocrite Mode" messages
 */
export default function PremiumMessagesScreen() {
  const {
    isConfigured,
    loading,
    isPremium,
    error,
    offering,
    monthlyPackage,
    purchaseMonthly,
    restorePurchases,
    refreshOfferings,
  } = useRevenueCat();
  const { colors } = useTheme();

  const handlePurchaseMonthly = async () => {
    const purchased = await purchaseMonthly();
    if (purchased) {
      Alert.alert("Subscription Active", "Monthly subscription purchased.");
    }
  };

  const handleRestore = async () => {
    const restored = await restorePurchases();
    if (restored) {
      Alert.alert(
        "Restore Complete",
        "Purchases were restored and entitlement status is now synced."
      );
    }
  };

  return (
    <SafeScreen style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>
          Premium Subscription
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Unlock Hypocrite Mode for $5/month.
        </Text>

        <View
          style={[
            styles.statusCard,
            {
              borderColor: colors.overlayBorder,
              backgroundColor: colors.overlay,
            },
          ]}
        >
          <Text style={[styles.statusTitle, { color: colors.text }]}>
            Status: {isPremium ? "Premium Active" : "Free Tier"}
          </Text>
          <Text style={[styles.statusCopy, { color: colors.textSecondary }]}>
            {/* Offerings are fetched from RevenueCat and rendered below for purchase. */}
            {offering
              ? `Current offering: ${offering.identifier}`
              : "No offering loaded yet."}
          </Text>
          {!!error && <Text style={styles.errorText}>{error}</Text>}
          {!isConfigured && (
            <Text style={styles.errorText}>
              RevenueCat is not configured. Add platform keys in `.env` and run
              a native dev build.
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary },
              (!monthlyPackage || !isConfigured || loading) && styles.disabled,
            ]}
            onPress={handlePurchaseMonthly}
            disabled={!monthlyPackage || !isConfigured || loading}
          >
            <Text style={styles.primaryButtonText}>
              {monthlyPackage
                ? `Subscribe Monthly (${monthlyPackage.product.priceString})`
                : "Subscribe for $5/month"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { borderColor: colors.overlayBorder, backgroundColor: colors.overlay },
              (!isConfigured || loading) && styles.disabled,
            ]}
            onPress={handleRestore}
            disabled={!isConfigured || loading}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              Restore Purchases
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { borderColor: colors.overlayBorder, backgroundColor: colors.overlay },
              (!isConfigured || loading) && styles.disabled,
            ]}
            onPress={refreshOfferings}
            disabled={!isConfigured || loading}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              Refresh Offerings
            </Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        <PremiumMessageDemo isPremium={isPremium} />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  statusCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  statusCopy: {
    fontSize: 13,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
    gap: 10,
  },
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: "#1a1a2e",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  secondaryButton: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  loaderWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});
