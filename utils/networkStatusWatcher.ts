/**
 * Network Status Watcher
 *
 * This utility monitors network connectivity and records issues that might affect
 * app functionality. It's particularly useful when investigating black screens,
 * loading issues, or API failures.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { AppState, AppStateStatus, Platform } from "react-native";

// Storage key
const NETWORK_HISTORY_KEY = "@nada_network_history";

// Maximum number of events to keep in history
const MAX_HISTORY_ENTRIES = 50;

class NetworkStatusWatcher {
  private isWatching: boolean = false;
  private unsubscribe: (() => void) | null = null;
  private appStateListener: any = null;
  private networkHistory: any[] = [];
  private lastState: NetInfoState | null = null;

  /**
   * Start monitoring network status
   */
  public startWatching(): void {
    if (this.isWatching) return;

    // Load previous history from storage
    this.loadHistory();

    // Set up network monitoring
    this.unsubscribe = NetInfo.addEventListener(this.handleNetworkChange);

    // Set up app state monitoring
    this.appStateListener = AppState.addEventListener(
      "change",
      this.handleAppStateChange
    );

    // Initial check
    this.checkCurrentStatus();

    this.isWatching = true;
    this.recordEvent("monitor_started", {});

    console.log("[NetworkWatcher] Started monitoring network status");
  }

  /**
   * Stop monitoring network status
   */
  public stopWatching(): void {
    if (!this.isWatching) return;

    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
    }

    this.isWatching = false;
    this.recordEvent("monitor_stopped", {});

    console.log("[NetworkWatcher] Stopped monitoring network status");
  }

  /**
   * Handle network state changes
   */
  private handleNetworkChange = (state: NetInfoState): void => {
    // Record the event if there's a significant change
    if (this.hasSignificantChange(state)) {
      this.recordEvent("network_change", {
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
        details: state.details,
      });

      console.log(
        `[NetworkWatcher] Network changed: ${state.type} - Connected: ${state.isConnected} - Reachable: ${state.isInternetReachable}`
      );
    }

    this.lastState = state;
  };

  /**
   * Check if there's a significant change in network state
   * worth recording
   */
  private hasSignificantChange(state: NetInfoState): boolean {
    if (!this.lastState) return true;

    return (
      state.isConnected !== this.lastState.isConnected ||
      state.type !== this.lastState.type ||
      state.isInternetReachable !== this.lastState.isInternetReachable
    );
  }

  /**
   * Handle app state changes (background/foreground)
   */
  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    if (nextAppState === "active") {
      this.checkCurrentStatus();
      this.recordEvent("app_foreground", {});
    } else if (nextAppState === "background") {
      this.recordEvent("app_background", {});
    }
  };

  /**
   * Check current network status
   */
  private async checkCurrentStatus(): Promise<void> {
    try {
      const state = await NetInfo.fetch();
      this.lastState = state;

      this.recordEvent("status_check", {
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
      });
    } catch (error) {
      console.error("[NetworkWatcher] Error checking status:", error);
    }
  }

  /**
   * Record a network-related event
   */
  private recordEvent(event: string, data: any): void {
    const timestamp = Date.now();

    const entry = {
      timestamp,
      event,
      data,
      device: Platform.OS,
    };

    this.networkHistory.unshift(entry);

    // Trim history to prevent it from growing too large
    if (this.networkHistory.length > MAX_HISTORY_ENTRIES) {
      this.networkHistory = this.networkHistory.slice(0, MAX_HISTORY_ENTRIES);
    }

    // Save to storage
    this.saveHistory();
  }

  /**
   * Get network history
   */
  public getHistory(): any[] {
    return [...this.networkHistory];
  }

  /**
   * Clear network history
   */
  public clearHistory(): void {
    this.networkHistory = [];
    this.saveHistory();
  }

  /**
   * Save history to AsyncStorage
   */
  private async saveHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        NETWORK_HISTORY_KEY,
        JSON.stringify(this.networkHistory)
      );
    } catch (error) {
      console.error("[NetworkWatcher] Error saving history:", error);
    }
  }

  /**
   * Load history from AsyncStorage
   */
  private async loadHistory(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(NETWORK_HISTORY_KEY);
      this.networkHistory = data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("[NetworkWatcher] Error loading history:", error);
      this.networkHistory = [];
    }
  }

  /**
   * Get the current network status
   */
  public async getCurrentStatus(): Promise<NetInfoState> {
    return await NetInfo.fetch();
  }
}

// Create singleton instance
const networkStatusWatcher = new NetworkStatusWatcher();
export default networkStatusWatcher;
