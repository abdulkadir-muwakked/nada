import { useColorScheme } from "react-native";
import { useCallback, useMemo } from "react";
import {
  createNadaTheme,
  themePalettes,
  type ThemeMode,
} from "../constants/NadaTheme";
import type { NadaThemeType } from "../types/nada";

type ColorToken = keyof NadaThemeType["colors"];

interface UseThemeOptions {
  /**
   * Optionally override the current theme mode.
   * When undefined, the device color scheme decides the palette.
   */
  mode?: ThemeMode;
}

interface UseThemeResult {
  mode: ThemeMode;
  isDark: boolean;
  theme: NadaThemeType;
  colors: NadaThemeType["colors"];
  typography: NadaThemeType["typography"];
  spacing: NadaThemeType["spacing"];
  borderRadius: NadaThemeType["borderRadius"];
  shadows: NadaThemeType["shadows"];
  /**
   * Convenience helper for retrieving themed colors by token.
   */
  getColor: (token: ColorToken) => string;
}

/**
 * Provides the active Nada theme palette based on system color scheme or an override.
 * The hook memoises palette objects to prevent unnecessary re-renders when the mode
 * does not change.
 */
export const useTheme = (options: UseThemeOptions = {}): UseThemeResult => {
  const deviceScheme = useColorScheme();
  const mode: ThemeMode =
    options.mode ?? (deviceScheme === "dark" ? "dark" : "light");

  const theme = useMemo(() => createNadaTheme(mode), [mode]);

  const getColor = useCallback(
    (token: ColorToken) => theme.colors[token],
    [theme]
  );

  return {
    mode,
    isDark: mode === "dark",
    theme,
    colors: theme.colors,
    typography: theme.typography,
    spacing: theme.spacing,
    borderRadius: theme.borderRadius,
    shadows: theme.shadows,
    getColor,
  };
};

export const themeTokens = themePalettes;

export type { ThemeMode };
