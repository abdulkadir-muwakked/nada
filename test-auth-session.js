// Test file to verify that expo-auth-session can import expo-crypto correctly
import { generateRandom, deriveChallengeAsync } from 'expo-auth-session/build/PKCE';

// Try to use PKCE which internally uses expo-crypto
async function testPKCE() {
  try {
    console.log('Testing PKCE from expo-auth-session...');
    
    // Generate a code verifier
    const codeVerifier = generateRandom(128);
    console.log('Code verifier generated:', codeVerifier.substring(0, 10) + '...');
    
    // Derive the challenge (this uses expo-crypto internally)
    const codeChallenge = await deriveChallengeAsync(codeVerifier);
    console.log('Code challenge derived:', codeChallenge.substring(0, 10) + '...');
    
    return true;
  } catch (error) {
    console.error('Error testing PKCE:', error);
    return false;
  }
}

// Export the test function
export { testPKCE };
