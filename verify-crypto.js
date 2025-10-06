const crypto = require('expo-crypto');

async function testCrypto() {
  try {
    console.log('Testing expo-crypto...');
    const hash = await crypto.digestStringAsync(
      crypto.CryptoDigestAlgorithm.SHA256,
      'Testing crypto module'
    );
    console.log('Success! Hash:', hash);
    return true;
  } catch (err) {
    console.error('Error testing crypto module:', err);
    return false;
  }
}

testCrypto().then(success => {
  console.log('Test completed. Success:', success);
  process.exit(success ? 0 : 1);
});
