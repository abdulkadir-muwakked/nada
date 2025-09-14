import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NadaTheme } from "../constants/NadaTheme";

/**
 * Simple consent manager for AdMob
 */
const ConsentManager: React.FC = () => {
  const [showConsentPrompt, setShowConsentPrompt] = useState(false);

  useEffect(() => {
    // For simplicity, this just shows a placeholder UI
    // A real implementation would check if consent needs to be collected
    // and use the Google UMP SDK's APIs to present the official form
    const timer = setTimeout(() => {
      setShowConsentPrompt(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleConsent = (consent: boolean) => {
    // This would normally call into the UMP SDK to record the user's choice
    console.log(
      `User ${consent ? "consented to" : "declined"} personalized ads`
    );
    setShowConsentPrompt(false);
  };

  if (!showConsentPrompt) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <Text style={styles.title}>Ad Preferences</Text>

        <Text style={styles.text}>
          We show ads to keep this app free. You can choose how these ads are
          personalized.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.declineButton]}
            onPress={() => handleConsent(false)}
          >
            <Text style={styles.buttonText}>Non-personalized</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.consentButton]}
            onPress={() => handleConsent(true)}
          >
            <Text style={styles.buttonText}>Allow personalized</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          You can change your choice anytime in the app settings.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  container: {
    backgroundColor: NadaTheme.colors.background,
    borderRadius: 12,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: NadaTheme.colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  text: {
    fontSize: 16,
    color: NadaTheme.colors.text,
    marginBottom: 24,
    lineHeight: 24,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 6,
  },
  declineButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  consentButton: {
    backgroundColor: NadaTheme.colors.primary,
  },
  buttonText: {
    fontWeight: "600",
    color: NadaTheme.colors.text,
  },
  disclaimer: {
    fontSize: 12,
    color: NadaTheme.colors.textSecondary,
    textAlign: "center",
  },
});

export default ConsentManager;
