import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AdMobInitializationTest from "../../components/AdMobInitializationTest";
import AdTestScreen from "../../components/AdTestScreen";
import { NadaTheme } from "../../constants/NadaTheme";
import { isDevelopment } from "../../utils/environment";

export default function AdTestPage() {
  const router = useRouter();
  const [testMode, setTestMode] = useState<"full" | "initialization">(
    "initialization"
  );

  // Prevent access in production builds
  if (!isDevelopment) {
    // Redirect to home screen in production
    router.replace("/");
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>AdMob Test</Text>
        <Text style={styles.devIndicator}>DEVELOPMENT ONLY</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            testMode === "initialization" && styles.activeTabButton,
          ]}
          onPress={() => setTestMode("initialization")}
        >
          <Text
            style={[
              styles.tabButtonText,
              testMode === "initialization" && styles.activeTabText,
            ]}
          >
            Initialization Only
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            testMode === "full" && styles.activeTabButton,
          ]}
          onPress={() => setTestMode("full")}
        >
          <Text
            style={[
              styles.tabButtonText,
              testMode === "full" && styles.activeTabText,
            ]}
          >
            Full Ad Test
          </Text>
        </TouchableOpacity>
      </View>

      {testMode === "initialization" ? (
        <AdMobInitializationTest />
      ) : (
        <AdTestScreen />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NadaTheme.colors.background,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "700",
    color: NadaTheme.colors.text,
  },
  devIndicator: {
    fontSize: 12,
    fontWeight: "700",
    color: NadaTheme.colors.primary,
    position: "absolute",
    right: 20,
    top: 22,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: NadaTheme.colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    color: NadaTheme.colors.textSecondary,
  },
  activeTabText: {
    color: NadaTheme.colors.text,
    fontWeight: "600",
  },
});
