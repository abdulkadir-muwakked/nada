import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRevenueCat } from "../context/RevenueCatContext";
import { useTheme } from "../hooks/useTheme";

const mapPaywallError = (error: string | null): string => {
  if (!error) return "";
  if (error.includes("Bundle ID") && error.includes("doesn't match")) {
    return "Subscription is unavailable in this build. Bundle ID mismatch with RevenueCat. Rebuild the iOS app with bundle ID com.mouket.nada.";
  }
  if (error.includes("None of the products registered")) {
    return "Subscriptions are not available on this device right now. If you are using the simulator, run on a real device or configure StoreKit testing.";
  }
  return error;
};

const Paywall: React.FC = () => {
  const { colors } = useTheme();
  const {
    loading,
    isPremium,
    error,
    offering,
    monthlyPackage,
    yearlyPackage,
    refreshOfferings,
    purchaseMonthly,
    purchaseYearly,
    restorePurchases,
  } = useRevenueCat();

  const [processing, setProcessing] = useState(false);

  const mappedError = useMemo(() => mapPaywallError(error), [error]);
  const isEmpty = !loading && !error && !monthlyPackage && !yearlyPackage;

  const handleMonthly = async () => {
    if (!monthlyPackage || processing || loading) return;
    setProcessing(true);
    try {
      const ok = await purchaseMonthly();
      if (ok) Alert.alert("Success", "Subscription activated.");
    } finally {
      setProcessing(false);
    }
  };

  const handleYearly = async () => {
    if (!yearlyPackage || processing || loading) return;
    setProcessing(true);
    try {
      const ok = await purchaseYearly();
      if (ok) Alert.alert("Success", "Subscription activated.");
    } finally {
      setProcessing(false);
    }
  };

  const handleRestore = async () => {
    if (processing || loading) return;
    setProcessing(true);
    try {
      const ok = await restorePurchases();
      if (ok) Alert.alert("Restore complete", "Purchases restored successfully.");
    } finally {
      setProcessing(false);
    }
  };

  const statusText = useMemo(() => {
    if (loading) return "Loading subscriptions...";
    if (mappedError) return mappedError;
    if (isEmpty)
      return "Subscriptions not available yet. Please try again later.";
    return isPremium ? "Premium active" : "Free tier";
  }, [isEmpty, isPremium, loading, mappedError]);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Premium Subscription</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Unlock Hypocrite Mode for $5/month.
      </Text>

      <View
        style={[
          styles.statusCard,
          { borderColor: colors.overlayBorder, backgroundColor: colors.overlay },
        ]}
      >
        <Text style={[styles.statusText, { color: colors.text }]}>{statusText}</Text>
        {offering ? (
          <Text style={[styles.meta, { color: colors.textSecondary }]}>Offering: {offering.identifier}</Text>
        ) : null}
      </View>

      {(loading || processing) && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.primaryButton,
          { backgroundColor: colors.primary },
          (!monthlyPackage || loading || processing || Boolean(mappedError)) && styles.disabled,
        ]}
        onPress={handleMonthly}
        disabled={!monthlyPackage || loading || processing || Boolean(mappedError)}
      >
        <Text style={styles.primaryButtonText}>
          Monthly ({monthlyPackage?.product.priceString ?? "N/A"})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          { backgroundColor: colors.primary },
          (!yearlyPackage || loading || processing || Boolean(mappedError)) && styles.disabled,
        ]}
        onPress={handleYearly}
        disabled={!yearlyPackage || loading || processing || Boolean(mappedError)}
      >
        <Text style={styles.primaryButtonText}>
          Yearly ({yearlyPackage?.product.priceString ?? "N/A"})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.secondaryButton,
          { borderColor: colors.overlayBorder, backgroundColor: colors.overlay },
          (processing || loading) && styles.disabled,
        ]}
        onPress={handleRestore}
        disabled={processing || loading}
      >
        <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Restore Purchases</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.secondaryButton,
          { borderColor: colors.overlayBorder, backgroundColor: colors.overlay },
          (processing || loading) && styles.disabled,
        ]}
        onPress={refreshOfferings}
        disabled={processing || loading}
      >
        <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
  },
  statusCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  meta: {
    fontSize: 12,
  },
  loadingWrap: {
    paddingVertical: 8,
    alignItems: "center",
  },
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: "#1a1a2e",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButton: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Paywall;
