/**
 * Environment utility to check if the app is running in development mode
 */

// Ensure __DEV__ is recognized
declare const __DEV__: boolean;

/**
 * Whether the app is running in development mode
 */
export const isDevelopment = process.env.NODE_ENV === "development" || __DEV__;

/**
 * Utility to disable features in production
 * @param value - The value to return in development mode
 * @returns The value in development mode, or null in production
 */
export const developmentOnly = <T>(value: T): T | null => {
  return isDevelopment ? value : null;
};
