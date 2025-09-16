import React, { useState } from "react";
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NadaTheme } from "../constants/NadaTheme";
import WelcomeScreen from "./WelcomeScreen";

/**
 * This component helps with taking App Store screenshots
 * It displays the app in a state optimized for screenshots
 * and provides helpers for different device sizes
 */
const AppStoreScreenshotHelper: React.FC = () => {
  const [showHelper, setShowHelper] = useState(true);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);

  const { width, height } = Dimensions.get("window");
  const deviceSize = Math.max(width, height);

  // Detect device size
  const getDeviceType = () => {
    if (Platform.OS === "ios") {
      if (deviceSize >= 1024) return "iPad";
      if (deviceSize >= 926) return 'iPhone 6.7"'; // iPhone Pro Max models
      if (deviceSize >= 844) return 'iPhone 6.1"'; // iPhone Pro/regular models
      return 'iPhone 4.7"'; // iPhone SE/smaller models
    }
    return "Unknown device";
  };

  if (showWelcomeScreen) {
    return <WelcomeScreen />;
  }

  return (
    <View style={styles.container}>
      {showHelper && (
        <View style={styles.helperOverlay}>
          <Text style={styles.helperTitle}>App Store Screenshot Helper</Text>
          <Text style={styles.deviceInfo}>{getDeviceType()}</Text>
          <Text style={styles.deviceInfo}>
            {width}x{height}
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              setShowHelper(false);
              setShowWelcomeScreen(true);
            }}
          >
            <Text style={styles.buttonText}>Show Welcome Screen</Text>
          </TouchableOpacity>

          <Text style={styles.tip}>
            Take a screenshot with Cmd+S or Hardware menu. This helper will not
            appear in screenshots.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NadaTheme.colors.background,
  },
  helperOverlay: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 12,
    alignItems: "center",
  },
  helperTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  deviceInfo: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 5,
  },
  button: {
    backgroundColor: NadaTheme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 15,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  tip: {
    fontSize: 12,
    color: "#ddd",
    textAlign: "center",
  },
});

export default AppStoreScreenshotHelper;
