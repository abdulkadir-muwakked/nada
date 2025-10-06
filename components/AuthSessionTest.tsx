import {
  deriveChallengeAsync,
  generateRandom,
} from "expo-auth-session/build/PKCE";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function AuthSessionTest() {
  const [result, setResult] = useState("Testing...");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function runTest() {
      try {
        // Generate a code verifier
        const codeVerifier = generateRandom(128);
        // Derive the challenge (this uses expo-crypto internally)
        const codeChallenge = await deriveChallengeAsync(codeVerifier);

        setResult(
          codeChallenge
            ? `SUCCESS: expo-auth-session can use expo-crypto! (${codeChallenge.substring(
                0,
                10
              )}...)`
            : "FAILED: expo-auth-session cannot use expo-crypto"
        );
      } catch (error: any) {
        setResult(`ERROR: ${error.message || "Unknown error"}`);
      } finally {
        setIsLoading(false);
      }
    }

    runTest();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Testing expo-auth-session + expo-crypto</Text>
      <Text
        style={[
          styles.result,
          isLoading
            ? styles.loading
            : result.startsWith("SUCCESS")
            ? styles.success
            : styles.error,
        ]}
      >
        {result}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  result: {
    fontSize: 14,
    marginTop: 8,
  },
  loading: {
    color: "#666",
  },
  success: {
    color: "green",
    fontWeight: "bold",
  },
  error: {
    color: "red",
    fontWeight: "bold",
  },
});
