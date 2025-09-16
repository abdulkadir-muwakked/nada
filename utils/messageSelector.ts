import {
  getBreakMessage,
  getRandomAuthMessage,
  getResumeMessage,
  getSessionStartMessage,
} from "../constants/AuthMessages";
import {
  getHypocriteAuthMessage,
  getHypocriteBreakMessage,
  getHypocriteResumeMessage,
  getHypocriteStartMessage,
} from "../constants/HypocriteMessages";

interface User {
  isPremium: boolean;
}

/**
 * Gets the appropriate auth message based on user's premium status
 */
export function getAuthMessageByMode(user: User): string {
  const mode = user.isPremium ? "hypocrite" : "default";
  return mode === "hypocrite"
    ? getHypocriteAuthMessage()
    : getRandomAuthMessage();
}

/**
 * Gets the appropriate session start message based on user's premium status
 */
export function getStartMessageByMode(user: User): string {
  const mode = user.isPremium ? "hypocrite" : "default";
  return mode === "hypocrite"
    ? getHypocriteStartMessage()
    : getSessionStartMessage();
}

/**
 * Gets the appropriate break message based on user's premium status
 */
export function getBreakMessageByMode(user: User): string {
  const mode = user.isPremium ? "hypocrite" : "default";
  return mode === "hypocrite" ? getHypocriteBreakMessage() : getBreakMessage();
}

/**
 * Gets the appropriate resume message based on user's premium status
 */
export function getResumeMessageByMode(user: User): string {
  const mode = user.isPremium ? "hypocrite" : "default";
  return mode === "hypocrite"
    ? getHypocriteResumeMessage()
    : getResumeMessage();
}
