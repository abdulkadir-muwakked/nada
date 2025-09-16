// Type definitions for Nada app components
import { StyleProp, TextStyle, ViewStyle } from "react-native";

// User Type for premium features
export interface User {
  isPremium: boolean;
  // Add other user properties as needed
}

// Nada Theme Types
export interface NadaThemeColors {
  primary: string;
  background: string;
  text: string;
  textSecondary: string;
  overlay: string;
  overlayBorder: string;
  highlight: string;
  highlightBorder: string;
}

export interface NadaTypography {
  title: {
    fontSize: number;
    fontWeight: string;
  };
  body: {
    fontSize: number;
    fontWeight: string;
  };
  caption: {
    fontSize: number;
    fontWeight: string;
  };
  small: {
    fontSize: number;
    fontWeight: string;
  };
}

export interface NadaThemeType {
  colors: NadaThemeColors;
  typography: NadaTypography;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
    circle: number;
  };
  shadows: {
    small: {
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    medium: {
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    large: {
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
}

// Nada Style Types
export interface NadaStyles {
  appTitle: StyleProp<TextStyle>;
  nadaCharacter: StyleProp<ViewStyle>;
  characterFace: StyleProp<ViewStyle>;
  eyes: StyleProp<ViewStyle>;
  eye: StyleProp<ViewStyle>;
  eyeRoll: StyleProp<ViewStyle>;
  mouth: StyleProp<ViewStyle>;
  speechBubble: StyleProp<ViewStyle>;
  speechTriangle: StyleProp<ViewStyle>;
  nadaText: StyleProp<TextStyle>;
  streakCounter: StyleProp<ViewStyle>;
  streakText: StyleProp<TextStyle>;
}
