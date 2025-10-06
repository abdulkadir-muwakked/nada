// Test for expo-crypto imports
import * as Crypto from "expo-crypto";

// Simple function to use the crypto module
async function generateRandomString(length: number): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(length);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export { generateRandomString };
