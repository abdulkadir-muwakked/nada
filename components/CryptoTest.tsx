import * as Crypto from "expo-crypto";
import * as React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function CryptoTest() {
  const [hash, setHash] = React.useState("");

  React.useEffect(() => {
    async function testCrypto() {
      try {
        // Test if expo-crypto is working by generating a SHA-256 hash
        const digest = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          "Hello, Nada!"
        );
        setHash(digest);
        console.log("Crypto test successful!", digest);
      } catch (error: any) {
        console.error("Crypto test failed:", error);
        setHash("Error: " + (error.message || "Unknown error"));
      }
    }

    testCrypto();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Expo Crypto Test</Text>
      {hash ? (
        <Text style={styles.hash}>Hash: {hash.substring(0, 16)}...</Text>
      ) : (
        <Text style={styles.loading}>Testing crypto module...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    margin: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  hash: {
    fontSize: 14,
    fontFamily: "monospace",
  },
  loading: {
    fontSize: 14,
    fontStyle: "italic",
  },
});
