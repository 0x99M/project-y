#!/usr/bin/env node
// Run once: node scripts/generate-keypair.js
// Private key → Railway env var (LICENSE_PRIVATE_KEY)
// Public key → paste into linux/license.js

const crypto = require('crypto');

const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519', {
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});

console.log('=== PRIVATE KEY (add to Railway env: LICENSE_PRIVATE_KEY) ===');
console.log(privateKey);
console.log('=== PUBLIC KEY (paste into linux/license.js) ===');
console.log(publicKey);
console.log('=== TEST LICENSE KEY ===');

const payload = JSON.stringify({
  email: 'test@example.com',
  createdAt: Date.now(),
  features: ['pro'],
});

const signature = crypto.sign(null, Buffer.from(payload), privateKey).toString('base64');
const key = Buffer.from(JSON.stringify({ payload, signature })).toString('base64');

console.log(key);
console.log();
console.log('Use this test key to verify the license system works.');
