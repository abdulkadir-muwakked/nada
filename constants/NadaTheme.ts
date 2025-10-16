import type { NadaThemeColors, NadaThemeType } from "../types/nada";

export type ThemeMode = "light" | "dark";

const typography: NadaThemeType["typography"] = {
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
  },
  caption: {
    fontSize: 14,
    fontWeight: "500",
  },
  small: {
    fontSize: 12,
    fontWeight: "400",
  },
};

const spacing: NadaThemeType["spacing"] = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const borderRadius: NadaThemeType["borderRadius"] = {
  small: 8,
  medium: 12,
  large: 20,
  circle: 100,
};

const shadows: NadaThemeType["shadows"] = {
  small: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  medium: {
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  large: {
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
};

const lightColors: NadaThemeColors = {
  primary: "#ff6b6b",
  background: "#ffffff",
  text: "#1f1f1f",
  textSecondary: "#484848",
  overlay: "rgba(25, 25, 35, 0.08)",
  overlayBorder: "rgba(25, 25, 35, 0.12)",
  highlight: "rgba(255, 107, 107, 0.12)",
  highlightBorder: "rgba(255, 107, 107, 0.24)",
  accent: "#0066CC",
  error: "#ff3333",
};

const darkColors: NadaThemeColors = {
  primary: "#ff6b6b",
  background: "#1a1a2e",
  text: "#ffffff",
  textSecondary: "#a0a0a0",
  overlay: "rgba(255, 255, 255, 0.1)",
  overlayBorder: "rgba(255, 255, 255, 0.2)",
  highlight: "rgba(255, 107, 107, 0.15)",
  highlightBorder: "rgba(255, 107, 107, 0.3)",
  accent: "#64C5FF",
  error: "#ff3333",
};

export const themePalettes = {
  light: lightColors,
  dark: darkColors,
};

export const createNadaTheme = (mode: ThemeMode): NadaThemeType => ({
  colors: themePalettes[mode],
  typography,
  spacing,
  borderRadius,
  shadows,
});

// Preserve the original export for existing usage (defaults to dark mode)
export const NadaTheme = createNadaTheme("dark");
