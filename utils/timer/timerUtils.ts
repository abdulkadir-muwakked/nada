/**
 * Utility functions for timer operations
 */

// Format time in MM:SS format
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
};

// Calculate normalized progress for focus/break modes
export const calculateTimerProgress = (
  timerSeconds: number,
  totalDuration: number,
  isRest: boolean
): number => {
  return isRest
    ? 1 - timerSeconds / totalDuration // Break mode: starts empty (0), ends full (1)
    : timerSeconds / totalDuration; // Focus mode: starts full (1), ends empty (0)
};

// Get appropriate timer label based on state
export const getTimerLabel = (
  isRest: boolean,
  isRunning: boolean,
  taskCompleted: boolean
): string => {
  if (taskCompleted) return "NICE JOB!";
  if (isRest) return "REST TIME";
  if (isRunning) return isRest ? "RESTING" : "FOCUSING";
  return "READY?";
};
