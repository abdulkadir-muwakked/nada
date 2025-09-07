import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { NadaTheme } from "../constants/NadaTheme";

interface AuthDividerProps {
  text?: string;
}

const AuthDivider: React.FC<AuthDividerProps> = ({ text = "or" }) => {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.text}>{text}</Text>
      <View style={styles.line} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: NadaTheme.colors.overlayBorder,
  },
  text: {
    marginHorizontal: 10,
    fontSize: 14,
    color: NadaTheme.colors.textSecondary,
  },
});

export default AuthDivider;
