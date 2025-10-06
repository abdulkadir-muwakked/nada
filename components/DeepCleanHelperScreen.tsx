/**
 * Deep clean utility for resolving persistent React Native issues
 *
 * This script provides commands to help deep clean React Native projects
 * when they encounter persistent errors like black screens or build issues.
 */

import React from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { NadaTheme } from "../constants/NadaTheme";

const commands = [
  {
    title: "Clear Metro cache",
    command: "npx react-native start --reset-cache",
    description: "Resets Metro bundler cache to resolve JS bundling issues",
  },
  {
    title: "Clean iOS build",
    command: "cd ios && pod deintegrate && pod install",
    description: "Removes and reinstalls iOS CocoaPods dependencies",
  },
  {
    title: "Full iOS rebuild",
    command: Platform.OS === "ios" ? "./scripts/rebuild-ios.sh" : "N/A",
    description: "Performs full iOS build cleaning and rebuilding",
  },
  {
    title: "Clean Android build",
    command: "cd android && ./gradlew clean",
    description: "Cleans Android build outputs",
  },
  {
    title: "Clear watchman cache",
    command: "watchman watch-del-all",
    description: "Resets watchman file watching system",
  },
  {
    title: "Reset node modules",
    command: "rm -rf node_modules && npm install",
    description: "Removes and reinstalls all JavaScript dependencies",
  },
];

/**
 * Provides guidance on deep cleaning React Native projects
 */
export default function DeepCleanHelperScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>React Native Deep Clean Guide</Text>

      <Text style={styles.description}>
        If you&apos;re seeing a black screen or persistent errors, try these
        steps in order:
      </Text>

      <ScrollView style={styles.commandsContainer}>
        {commands.map((item, index) => (
          <View key={index} style={styles.commandItem}>
            <Text style={styles.commandTitle}>
              {index + 1}. {item.title}
            </Text>
            <View style={styles.codeBlock}>
              <Text style={styles.commandText}>{item.command}</Text>
            </View>
            <Text style={styles.commandDescription}>{item.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.noteContainer}>
        <Text style={styles.noteText}>
          After each step, try running the app again to see if the issue is
          resolved. Only proceed to more aggressive cleaning if necessary.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NadaTheme.colors.background,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: NadaTheme.colors.primary,
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: NadaTheme.colors.text,
    marginBottom: 24,
    textAlign: "center",
  },
  commandsContainer: {
    flex: 1,
  },
  commandItem: {
    marginBottom: 20,
    backgroundColor: "rgba(0,0,0,0.1)",
    padding: 15,
    borderRadius: 8,
  },
  commandTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: NadaTheme.colors.text,
    marginBottom: 8,
  },
  codeBlock: {
    backgroundColor: "#1a1a2e",
    padding: 12,
    borderRadius: 6,
    marginVertical: 8,
  },
  commandText: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: "#eee",
    fontSize: 14,
  },
  commandDescription: {
    fontSize: 14,
    color: NadaTheme.colors.text,
    opacity: 0.7,
  },
  noteContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "rgba(255, 204, 0, 0.1)",
    borderRadius: 8,
  },
  noteText: {
    fontSize: 14,
    color: "#ffcc00",
    textAlign: "center",
  },
});
