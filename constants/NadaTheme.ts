// Theme constants for the Nada app
export const NadaTheme = {
  colors: {
    primary: "#ff6b6b",
    background: "#1a1a2e",
    text: "#ffffff",
    textSecondary: "#a0a0a0",
    overlay: "rgba(255, 255, 255, 0.1)",
    overlayBorder: "rgba(255, 255, 255, 0.2)",
    highlight: "rgba(255, 107, 107, 0.15)",
    highlightBorder: "rgba(255, 107, 107, 0.3)",
    error: "#ff3333",
  },

  typography: {
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
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    small: 8,
    medium: 12,
    large: 20,
    circle: 100,
  },

  shadows: {
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
  },
};

// Export as named export only, no default export
