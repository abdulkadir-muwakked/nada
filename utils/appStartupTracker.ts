/**
 * AppStartupTracker utility for debugging and tracking app initialization process
 */

class AppStartupTracker {
  private startTime: number;
  private stages: Map<string, { start: number; end?: number }>;
  private errors: { stage: string; error: Error; timestamp: number }[];

  constructor() {
    this.startTime = Date.now();
    this.stages = new Map();
    this.errors = [];
    this.logStartup("AppStartupTracker initialized");
  }

  /**
   * Start tracking a specific startup stage
   */
  startStage(stageName: string): void {
    const now = Date.now();
    this.stages.set(stageName, { start: now });
    this.logStartup(`Starting stage: ${stageName}`);
  }

  /**
   * End tracking a specific startup stage
   */
  endStage(stageName: string): void {
    const now = Date.now();
    const stage = this.stages.get(stageName);

    if (stage) {
      stage.end = now;
      const duration = stage.end - stage.start;
      this.logStartup(`Completed stage: ${stageName} (${duration}ms)`);
    } else {
      this.logStartup(
        `Warning: Ending stage that wasn't started: ${stageName}`
      );
    }
  }

  /**
   * Record an error that occurred during startup
   */
  recordError(stage: string, error: Error): void {
    this.errors.push({
      stage,
      error,
      timestamp: Date.now(),
    });

    this.logStartup(`ERROR in ${stage}: ${error.message}`);
    console.error(`[AppStartupTracker] Error in ${stage}:`, error);
  }

  /**
   * Get a summary of the startup process
   */
  getSummary(): string {
    const totalTime = Date.now() - this.startTime;

    let summary = `App startup took ${totalTime}ms\n`;

    this.stages.forEach((timing, stage) => {
      const duration = (timing.end || Date.now()) - timing.start;
      summary += `- ${stage}: ${duration}ms${
        timing.end ? "" : " (not completed)"
      }\n`;
    });

    if (this.errors.length > 0) {
      summary += `\nErrors during startup (${this.errors.length}):\n`;
      this.errors.forEach((err) => {
        summary += `- ${err.stage}: ${err.error.message}\n`;
      });
    }

    return summary;
  }

  /**
   * Log a startup-related message with timestamp
   */
  private logStartup(message: string): void {
    const elapsed = Date.now() - this.startTime;
    console.log(`[AppStartup] +${elapsed}ms: ${message}`);
  }
}

// Create singleton instance
const appStartupTracker = new AppStartupTracker();
export default appStartupTracker;
