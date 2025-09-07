import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { NadaTheme } from "../constants/NadaTheme";

interface NadaLogoProps {
  size?: "small" | "medium" | "large";
  variant?: "default" | "auth";
}

const NadaLogo: React.FC<NadaLogoProps> = ({
  size = "medium",
  variant = "default",
}) => {
  // Scale factors based on size prop
  const fontSizes = {
    small: 20,
    medium: 28,
    large: 36,
  };

  return (
    <View style={{ alignItems: "center" }}>
      <Text style={[styles.appTitle, { fontSize: fontSizes[size] }]}>nada</Text>
      {variant === "auth" && (
        <Text style={styles.tagline}>
          your indifferent productivity partner
        </Text>
      )}
    </View>
  );
};

// Export the styles separately so they can be used in other components
// Use the theme from centralized location
export const nadaTheme = {
  colors: {
    primary: NadaTheme.colors.primary,
    darkBg: NadaTheme.colors.background,
  },
};

export const nadaStyles = StyleSheet.create({
  // Logo styles
  appTitle: {
    fontWeight: "700",
    color: NadaTheme.colors.primary,
  },

  tagline: {
    fontSize: 12,
    color: NadaTheme.colors.textSecondary,
    marginTop: 4,
    fontStyle: "italic",
  },

  // Character styles
  nadaCharacter: {
    marginBottom: 10,
  },
  characterFace: {
    width: 100,
    height: 100,
    backgroundColor: NadaTheme.colors.primary,
    borderRadius: 50,
    position: "relative",
    shadowColor: NadaTheme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  eyes: {
    position: "absolute",
    top: 35,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  eye: {
    width: 12,
    height: 12,
    backgroundColor: NadaTheme.colors.background,
    borderRadius: 6,
  },
  eyeRoll: {
    transform: [{ translateX: -2 }],
  },
  mouth: {
    position: "absolute",
    bottom: 30,
    left: "50%",
    marginLeft: -10,
    width: 20,
    height: 10,
    borderWidth: 2,
    borderColor: NadaTheme.colors.background,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    transform: [{ rotate: "180deg" }],
  },

  // Speech bubble styles
  speechBubble: {
    backgroundColor: NadaTheme.colors.overlay,
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: NadaTheme.colors.overlayBorder,
    marginBottom: 30,
    maxWidth: 280,
    position: "relative",
  },
  speechTriangle: {
    position: "absolute",
    top: -8,
    left: "50%",
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: NadaTheme.colors.overlay,
  },
  nadaText: {
    fontSize: 16,
    color: NadaTheme.colors.text,
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 22,
  },

  streakCounter: {
    backgroundColor: NadaTheme.colors.highlight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: NadaTheme.colors.highlightBorder,
  },
  streakText: {
    fontSize: 14,
    fontWeight: "600",
    color: NadaTheme.colors.primary,
  },
});

const styles = StyleSheet.create({
  appTitle: {
    fontWeight: "700",
    color: NadaTheme.colors.primary,
  },
  tagline: {
    fontSize: 12,
    color: NadaTheme.colors.textSecondary,
    marginTop: 4,
    fontStyle: "italic",
  },
});

export default NadaLogo;
