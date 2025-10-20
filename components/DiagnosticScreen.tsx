import Constants from "expo-constants";
import * as Device from "expo-device";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NadaTheme } from "../constants/NadaTheme";
import appStartupTracker from "../utils/appStartupTracker";

/**
 * This component displays detailed diagnostic information when the app encounters a critical error
 * Helps developers identify and fix startup and rendering issues
 */
export default function DiagnosticScreen({ error, errorInfo, resetError }) {
  // Define device info interface
  interface DeviceInfoType {
    platform: string;
    version: string | number;
    device: string;
    screenSize: string;
    expoVersion: string;
    appVersion: string;
    jsEngine: string;
    buildNumber: string | number;
    error?: string;
  }

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfoType>({
    platform: "",
    version: "",
    device: "",
    screenSize: "",
    expoVersion: "",
    appVersion: "",
    jsEngine: "",
    buildNumber: "",
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Gather device information for diagnostic purposes
    async function gatherDeviceInfo() {
      try {
        const { width, height } = Dimensions.get("window");

        const expoConfig = Constants.expoConfig;
        const deviceName = Device.deviceName ?? "Unknown";
        const buildNumber =
          expoConfig?.ios?.buildNumber ??
          (expoConfig?.android?.versionCode != null
            ? String(expoConfig.android.versionCode)
            : undefined);

        const info: DeviceInfoType = {
          platform: Platform.OS,
          version: Platform.Version,
          device: deviceName,
          screenSize: `${width}x${height}`,
          expoVersion: Constants.expoVersion ?? "N/A",
          appVersion: expoConfig?.version ?? "N/A",
          jsEngine: Constants.jsEngine ?? "N/A",
          buildNumber: buildNumber ?? "N/A",
        };

        setDeviceInfo(info);
      } catch (err) {
        console.log("Error gathering device info:", err);
        setDeviceInfo({
          platform: "unknown",
          version: "unknown",
          device: "unknown",
          screenSize: "unknown",
          expoVersion: "unknown",
          appVersion: "unknown",
          jsEngine: "unknown",
          buildNumber: "unknown",
          error: "Failed to gather device info",
        });
      }
    }

    gatherDeviceInfo();
  }, []);

  // Get startup summary from our tracker
  const startupSummary = appStartupTracker.getSummary();

  // Format error stack trace for readability
  const formatErrorStack = (stack) => {
    if (!stack) return "No stack trace available";

    return stack.split("\n").map((line, i) => {
      // Highlight app code vs library code
      const isAppCode = line.includes("/Users/macbookm3/Projects/MyApp");
      return (
        <Text
          key={i}
          style={[styles.stackLine, isAppCode && styles.appCodeLine]}
        >
          {line}
        </Text>
      );
    });
  };

  // Create formatted error report for sharing
  const getErrorReport = () => {
    return `
DIAGNOSTIC REPORT
----------------
Error: ${error?.toString()}
${errorInfo?.componentStack || ""}

DEVICE INFO
-----------
Platform: ${deviceInfo.platform} ${deviceInfo.version}
Device: ${deviceInfo.device}
Screen: ${deviceInfo.screenSize}
Expo: ${deviceInfo.expoVersion}
App Version: ${deviceInfo.appVersion} (${deviceInfo.buildNumber})
JS Engine: ${deviceInfo.jsEngine}

STARTUP DETAILS
--------------
${startupSummary}
`.trim();
  };

  const shareErrorReport = async () => {
    try {
      // Create shareable report
      const report = getErrorReport();

      // Use Linking to send email with error report
      const subject = encodeURIComponent("MyApp Error Report");
      const body = encodeURIComponent(report);

      Linking.openURL(
        `mailto:support@mycompany.com?subject=${subject}&body=${body}`
      );
    } catch (err) {
      console.log("Failed to share error report:", err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>App Error Detected</Text>

      <View style={styles.errorBox}>
        <Text style={styles.errorText}>
          {error?.toString() || "Unknown error"}
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Platform: {deviceInfo.platform} {deviceInfo.version}
        </Text>
        <Text style={styles.infoText}>
          App Version: {deviceInfo.appVersion}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.detailsButton}
        onPress={() => setShowDetails(!showDetails)}
      >
        <Text style={styles.buttonText}>
          {showDetails ? "Hide Details" : "Show Details"}
        </Text>
      </TouchableOpacity>

      {showDetails && (
        <ScrollView style={styles.detailsContainer}>
          <Text style={styles.sectionHeader}>Error Stack:</Text>
          <View style={styles.stackContainer}>
            {formatErrorStack(errorInfo?.componentStack)}
          </View>

          <Text style={styles.sectionHeader}>Startup Timeline:</Text>
          <Text style={styles.detailsText}>{startupSummary}</Text>
        </ScrollView>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={resetError}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.reportButton]}
          onPress={shareErrorReport}
        >
          <Text style={styles.buttonText}>Report Issue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NadaTheme.colors.background,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    color: NadaTheme.colors.error,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  errorBox: {
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: NadaTheme.colors.error,
    fontSize: 16,
  },
  infoContainer: {
    marginBottom: 20,
  },
  infoText: {
    color: NadaTheme.colors.text,
    fontSize: 14,
    marginBottom: 5,
  },
  detailsButton: {
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  detailsContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    padding: 15,
    borderRadius: 8,
    maxHeight: 300,
    marginBottom: 20,
  },
  sectionHeader: {
    color: NadaTheme.colors.text,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 10,
  },
  detailsText: {
    color: NadaTheme.colors.text,
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  stackContainer: {
    marginBottom: 15,
  },
  stackLine: {
    color: "#aaa",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginBottom: 2,
  },
  appCodeLine: {
    color: NadaTheme.colors.text,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    backgroundColor: NadaTheme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  reportButton: {
    backgroundColor: "#555",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
