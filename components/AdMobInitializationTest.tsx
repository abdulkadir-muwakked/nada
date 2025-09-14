import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MobileAds } from "react-native-google-mobile-ads";
import { NadaTheme } from "../constants/NadaTheme";

const AdMobInitializationTest: React.FC = () => {
  const [status, setStatus] = useState<string>("Initializing...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAdMob = async () => {
      try {
        setStatus("Checking if MobileAds module is available...");

        // Check if MobileAds is properly imported
        if (typeof MobileAds !== "function") {
          throw new Error(
            "MobileAds is not a function. Module import may be broken."
          );
        }

        setStatus("Module available, attempting to initialize AdMob...");
        console.log("Attempting to initialize AdMob...");

        // Try to initialize AdMob with a timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () =>
              reject(
                new Error("AdMob initialization timed out after 5 seconds")
              ),
            5000
          );
        });

        const initPromise = MobileAds().initialize();
        const result = await Promise.race([initPromise, timeoutPromise]);

        console.log("AdMob initialization result:", result);
        setStatus("Initialized successfully");
      } catch (err) {
        console.error("AdMob initialization error:", err);

        // Provide more detailed error information
        const errorMessage = err instanceof Error ? err.message : String(err);
        const errorDetails = `Type: ${
          err?.constructor?.name || "Unknown"
        }\nMessage: ${errorMessage}`;

        setError(errorDetails);
        setStatus("Failed to initialize");
      }
    };

    initAdMob();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AdMob Initialization Test</Text>
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Status:</Text>
        <Text style={styles.statusText}>{status}</Text>

        {error && (
          <>
            <Text style={styles.errorLabel}>Error:</Text>
            <Text style={styles.errorText}>{error}</Text>
          </>
        )}
      </View>

      <Text style={styles.infoText}>
        This component only tests AdMob initialization without attempting to
        load or display any ads.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: NadaTheme.colors.background,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: NadaTheme.colors.text,
    marginBottom: 20,
    textAlign: "center",
  },
  statusContainer: {
    padding: 15,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 10,
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: NadaTheme.colors.text,
    marginBottom: 5,
  },
  statusText: {
    fontSize: 14,
    color: NadaTheme.colors.text,
    marginBottom: 10,
  },
  errorLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ff5252",
    marginTop: 10,
    marginBottom: 5,
  },
  errorText: {
    fontSize: 14,
    color: "#ff5252",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    fontStyle: "italic",
    color: NadaTheme.colors.textSecondary,
    textAlign: "center",
  },
});

export default AdMobInitializationTest;
