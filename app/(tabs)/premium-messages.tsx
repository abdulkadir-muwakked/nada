import React from "react";
import { StyleSheet } from "react-native";
import PremiumMessageDemo from "../../components/PremiumMessageDemo";
import SafeScreen from "../../components/SafeScreen";

/**
 * Premium Messages Demo Screen
 * This screen showcases the difference between regular messages and premium "Hypocrite Mode" messages
 */
export default function PremiumMessagesScreen() {
  return (
    <SafeScreen style={styles.container}>
      <PremiumMessageDemo />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
