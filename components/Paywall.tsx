import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import RevenueCatUI from "react-native-purchases-ui";
import { useRevenueCat } from "../context/RevenueCatContext";
import { useTheme } from "../hooks/useTheme";

const Paywall: React.FC = () => {
  const { colors } = useTheme();
  const { loading, error, offering, isPremium, refreshOfferings } =
    useRevenueCat();

  if (isPremium) {
    return (
      <View style={styles.container}>
        <Text style={[styles.statusText, { color: colors.text }]}>
          Premium active
        </Text>
      </View>
    );
  }

  if (loading && !offering) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!offering) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>
          Premium Subscription
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {error || "Subscriptions not available yet. Please try again later."}
        </Text>
        <TouchableOpacity
          style={[
            styles.secondaryButton,
            { borderColor: colors.overlayBorder, backgroundColor: colors.overlay },
          ]}
          onPress={refreshOfferings}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.paywallContainer}>
      <RevenueCatUI.Paywall
        options={{ offering }}
        onDismiss={() => {
          // Paywall handles purchase/restore internally. Refresh local state afterward.
          void refreshOfferings();
        }}
        onPurchaseCompleted={() => {
          void refreshOfferings();
        }}
        onRestoreCompleted={() => {
          void refreshOfferings();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  paywallContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
});

export default Paywall;
