import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import NadaExpressionDemo from "../../components/NadaExpressionDemo";
import { NadaTheme } from "../../constants/NadaTheme";
import { NadaStateProvider } from "../../context/NadaStateContext";

export default function NadaExpressionsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <NadaStateProvider>
        <NadaExpressionDemo />
      </NadaStateProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NadaTheme.colors.background,
  },
});
