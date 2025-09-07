// Array of snarky messages that the Nada character can display on auth screens
export const authMessages = [
  "Meet Nada. An indignant Pomodoro app that could be a hypocrite for $5.",
  "Oh look, another productivity enthusiast who'll quit in a week.",
  "I'll help you focus, but I won't pretend to care about your goals.",
  "Sign up if you must. I'll be here judging your procrastination.",
  "Sure, let's pretend this time you'll actually stick to a routine.",
  "Password requirements: Must contain your broken productivity dreams.",
  "Your focus sessions can't possibly be worse than your login attempts.",
  "Welcome back. I saved your unfinished tasks from last year.",
  "What's the difference between you and a productive person? Spoiler: It's not this app.",
  "I'm programmed to help you focus, but not programmed to believe you will.",
];

// Specific messages for Google sign-in
export const googleAuthMessages = [
  "Letting Google log you in? How original.",
  "Oh great, another service to track your inevitable failure.",
  "Google-powered disappointment coming right up.",
  "Using Google to login? Outsourcing your failures, I see.",
  "Sure, let Google know about your questionable productivity choices too.",
];

// Specific messages for validation errors
export const validationErrorMessages = {
  password_too_short: [
    "Passwords are like productivity goals - they both need to be substantial to work.",
    "If your password is this short, I can only imagine how brief your focus sessions are.",
    "Eight characters minimum. Is that too much commitment for you?",
  ],
  password_incorrect: [
    "Forgot your password? Your memory is as reliable as your productivity.",
    "Wrong password. Adding 'failing at basic tasks' to your resume?",
    "That's not your password. Did you try 'procrastinator123'?",
  ],
  email_not_found: [
    "Can't find your account? Not surprising, considering your focus issues.",
    "This email doesn't exist. Like your productivity goals.",
    "No account found. At least be consistent with your failures.",
  ],
  email_already_exists: [
    "That email is already registered. Forgetting things already?",
    "Account already exists. Redundancy: another one of your talents.",
    "You already signed up. Attention span of a goldfish, I see.",
  ],
  email_invalid: [
    "That's not an email address. Did you fall asleep on the keyboard?",
    "Invalid email format. Your attention to detail is truly impressive... said no one ever.",
    "Email address must contain an @ symbol. Basic digital literacy isn't your forte, is it?",
  ],
  generic_error: [
    "Another failure to add to your collection. How fitting.",
    "Error encountered. Your mediocrity is truly consistent.",
    "Something went wrong. Probably got distracted halfway through.",
  ],
  password_compromised: [
    "Your password's been in data breaches. Your security is as strong as your willpower.",
    "Password found in data breaches. At least be original with your bad choices.",
    "Try a password that hasn't been leaked online. Like your productivity methods, it needs to be less common.",
  ],
  password_too_weak: [
    "Your password is weaker than your commitment to productivity.",
    "That password couldn't keep out a toddler. Mix in some numbers or symbols.",
    "If your security is this lax, I worry about your todo list too.",
  ],
  password_no_lowercase: [
    "Passwords need lowercase letters. Like your productivity level.",
    "No lowercase letters? Trying to compensate for something?",
    "Add some lowercase letters. It's not rocket science.",
  ],
  password_no_uppercase: [
    "Needs uppercase letters. YOU KNOW, LIKE THIS?",
    "Add some capital letters. Show some ENTHUSIASM.",
    "Your password needs uppercase letters. Unlike your ambitions.",
  ],
  password_no_number: [
    "Add some numbers. I'll wait while you count to one.",
    "Numbers make passwords stronger. Like math class, but less painful.",
    "No numbers? That's a big fat 0/10 from me.",
  ],
  password_size_exceeded: [
    "Your password is too long. Compensating for something?",
    "Shorter password please. This isn't a novel.",
    "That's way too many characters. Keep it under 72 bytes, Shakespeare.",
  ],
  invalid_subaddress: [
    "No '+' tricks in email addresses. I wasn't born yesterday.",
    "Email can't contain '+', '=', or '#'. Nice try though.",
    "Keep it simple - no special characters in the email.",
  ],
};

/**
 * Returns a random snarky message for auth screens
 */
export function getRandomAuthMessage(): string {
  return authMessages[Math.floor(Math.random() * authMessages.length)];
}

/**
 * Returns a random Google auth message
 */
export function getRandomGoogleAuthMessage(): string {
  return googleAuthMessages[
    Math.floor(Math.random() * googleAuthMessages.length)
  ];
}

/**
 * Returns a random message for specific validation error type
 */
export function getValidationErrorMessage(
  errorType: keyof typeof validationErrorMessages
): string {
  const messages =
    validationErrorMessages[errorType] || validationErrorMessages.generic_error;
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Returns a specific verification message with attitude
 */
export function getVerificationMessage(email: string): string {
  const messages = [
    `Check your inbox at ${email}. Or don't. I'm an app, not your boss.`,
    `I sent a code to ${email}. Try not to take as long verifying as you do completing tasks.`,
    `Verification code sent to ${email}. Let's see if you can focus long enough to enter it.`,
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}
