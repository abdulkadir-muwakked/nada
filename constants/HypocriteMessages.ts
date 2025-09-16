// Extra snarky "Hypocrite Mode" messages (Premium feature)
export const hypocriteMessages = {
  auth: [
    "Welcome, VIP! Totally worth $5… well, at least I got paid.",
    "Oh, you subscribed? Finally pretending to take productivity seriously.",
    "Premium mode unlocked. Don't worry, I'll still doubt you.",
    "Your wallet says committed. Your habits? We'll see.",
    "You actually paid for this? Guess hypocrisy isn't dead.",
  ],

  start: [
    "Timer started. Wow, money really CAN buy fake motivation.",
    "Focus mode ON. Because now you're paying me to believe in you… kinda.",
    "Let's be real: you subscribed, but your discipline didn't.",
    "Nada believes in you now… because you funded Nada's coffee habit.",
    "Premium timer running. Hypocrisy at its finest.",
  ],

  break: [
    "Break time! Don't worry, I'll say you deserved it since you're premium.",
    "Congrats on finishing a session. You're clearly unstoppable… said your $5.",
    "You earned this break… well, you paid for me to say that.",
    "Go relax. You're practically buying validation at this point.",
    "Premium break unlocked. Same break, fancier lies.",
  ],

  resume: [
    "Back again? Wow, premium subscribers really try… or at least fake it.",
    "Welcome back, champion of… paying for hope.",
    "Resuming like a pro. Not in productivity, but in spending.",
    "Nada's proud of you. (Not really, but you're paying, so sure.)",
    "Focus time again! Don't worry, I'll hype you no matter how hypocritical.",
  ],
};

/**
 * Returns a random hypocrite auth message for premium users
 */
export function getHypocriteAuthMessage(): string {
  return hypocriteMessages.auth[
    Math.floor(Math.random() * hypocriteMessages.auth.length)
  ];
}

/**
 * Returns a random hypocrite message for session start for premium users
 */
export function getHypocriteStartMessage(): string {
  return hypocriteMessages.start[
    Math.floor(Math.random() * hypocriteMessages.start.length)
  ];
}

/**
 * Returns a random hypocrite message for break time for premium users
 */
export function getHypocriteBreakMessage(): string {
  return hypocriteMessages.break[
    Math.floor(Math.random() * hypocriteMessages.break.length)
  ];
}

/**
 * Returns a random hypocrite message for resuming after a break for premium users
 */
export function getHypocriteResumeMessage(): string {
  return hypocriteMessages.resume[
    Math.floor(Math.random() * hypocriteMessages.resume.length)
  ];
}
