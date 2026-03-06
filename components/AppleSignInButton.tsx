import { AntDesign } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { NadaTheme } from "../constants/NadaTheme";

interface AppleSignInButtonProps {
  onPress: () => void;
  label?: string;
  loading?: boolean;
  style?: ViewStyle;
}

const AppleSignInButton: React.FC<AppleSignInButtonProps> = ({
  onPress,
  label = "Sign in with Apple",
  loading = false,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      disabled={loading}
    >
      <View style={styles.iconContainer}>
        <AntDesign name="apple" size={21} color="#ffffff" />
      </View>
      <Text style={styles.buttonText}>{loading ? "Connecting..." : label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: NadaTheme.colors.overlay,
    borderRadius: NadaTheme.borderRadius.large,
    paddingVertical: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: NadaTheme.colors.overlayBorder,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: NadaTheme.colors.text,
  },
});

export default AppleSignInButton;
