import { StatusBar } from "expo-status-bar";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthSessionTest from "../../components/AuthSessionTest";
import CryptoTest from "../../components/CryptoTest";
import { NadaTheme } from "../../constants/NadaTheme";

// Make sure the default export is correctly defined
const TestCryptoScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Module Test Screen</Text>
          <Text style={styles.subtitle}>Testing expo-crypto module</Text>
        </View>

        <CryptoTest />

        <View style={styles.separator} />

        <AuthSessionTest />

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            If both tests pass, then both expo-crypto directly and
            expo-auth-session&apos;s use of expo-crypto are working properly.
            This means the module resolution issue has been fixed!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TestCryptoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NadaTheme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: NadaTheme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: NadaTheme.colors.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: NadaTheme.colors.textSecondary,
    marginVertical: 16,
  },
  infoContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#1c1c2e",
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: NadaTheme.colors.textSecondary,
    lineHeight: 20,
  },
});
