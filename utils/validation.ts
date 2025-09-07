/**
 * Email validation utilities to ensure consistent validation
 * across the application
 */

/**
 * Validates an email address with Clerk's specific requirements
 *
 * @param email - The email address to validate
 * @returns boolean - Whether the email is valid
 */
export const validateEmail = (email: string): boolean => {
  // Trim the email first to remove any accidental whitespace
  const trimmedEmail = email.trim();

  if (!trimmedEmail || trimmedEmail.length === 0) {
    return false;
  }

  // Basic email format validation
  const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basicEmailRegex.test(trimmedEmail)) {
    return false;
  }

  // Check for disallowed characters in the local part
  const [localPart] = trimmedEmail.split("@");
  if (
    localPart.includes("+") ||
    localPart.includes("=") ||
    localPart.includes("#")
  ) {
    return false;
  }

  return true;
};

/**
 * Checks if a password meets security requirements as per Clerk's guidelines.
 *
 * @param password - The password to validate
 * @returns object - Result with isValid boolean and optional reason for failure
 */
export const validatePasswordSecurity = (
  password: string
): {
  isValid: boolean;
  reason?: "too_short" | "too_common" | "too_weak";
} => {
  // Check length (minimum 8 characters)
  if (password.length < 8) {
    return { isValid: false, reason: "too_short" };
  }

  // Check for common password patterns
  const commonPasswords = [
    "password",
    "12345678",
    "qwerty",
    "letmein",
    "welcome",
    "admin",
    "123456789",
    "1234567",
    "password1",
    "abc123",
  ];

  const lowercasePassword = password.toLowerCase();
  if (commonPasswords.some((common) => lowercasePassword === common)) {
    return { isValid: false, reason: "too_common" };
  }

  // Check for character variety (at least one letter and one number or special character)
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!(hasLetter && (hasNumber || hasSpecial))) {
    return { isValid: false, reason: "too_weak" };
  }

  return { isValid: true };
};
