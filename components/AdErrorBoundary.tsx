import React, { Component, ErrorInfo, ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { NadaTheme } from "../constants/NadaTheme";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary specifically for ad components to prevent
 * ad-related crashes from affecting the rest of the app
 */
class AdErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("AdMob component error:", error);
    console.error("Error details:", {
      component: errorInfo.componentStack || "Unknown component",
      message: error.message,
      name: error.name,
      stack: error.stack || "No stack trace available",
    });

    // You could add analytics logging here if available
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Enhanced fallback UI with error details
      return (
        <View style={styles.container}>
          <Text style={styles.errorText}>Ad failed to load</Text>
          {__DEV__ && this.state.error && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>Debug Info (DEV only):</Text>
              <Text style={styles.debugText}>{this.state.error.message}</Text>
            </View>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  errorText: {
    color: NadaTheme.colors.textSecondary,
    fontSize: 14,
  },
  debugContainer: {
    marginTop: 10,
    padding: 8,
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    borderRadius: 6,
    width: "100%",
  },
  debugTitle: {
    color: "#ff5252",
    fontWeight: "600",
    marginBottom: 4,
    fontSize: 12,
  },
  debugText: {
    color: "#ff5252",
    fontSize: 10,
  },
});

export default AdErrorBoundary;
