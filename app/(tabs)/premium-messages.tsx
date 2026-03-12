import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import PremiumPaywall from "../../components/Paywall";
import PremiumMessageDemo from "../../components/PremiumMessageDemo";
import SafeScreen from "../../components/SafeScreen";
import { useRevenueCat } from "../../context/RevenueCatContext";
import { useTheme } from "../../hooks/useTheme";

export default function PremiumMessagesScreen() {
  const router = useRouter();
  const { isPremium } = useRevenueCat();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeScreen style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="chevron-left" size={22} color={colors.text} />
          <Text style={styles.backLabel}>Back</Text>
        </TouchableOpacity>
      </View>
      {isPremium ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <PremiumPaywall />
          <PremiumMessageDemo isPremium={isPremium} />
        </ScrollView>
      ) : (
        <PremiumPaywall />
      )}
    </SafeScreen>
  );
}

const createStyles = (colors: {
  background: string;
  text: string;
  overlay: string;
  overlayBorder: string;
}) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 6,
      paddingBottom: 4,
    },
    backButton: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.overlay,
      borderColor: colors.overlayBorder,
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    backLabel: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "600",
    },
    scrollContent: {
      flexGrow: 1,
      gap: 16,
      paddingBottom: 24,
    },
  });
