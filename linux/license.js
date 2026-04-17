const crypto = require('crypto');

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAnVdledR9HVZ1KeOwZHM42TEj3rYp6zUf0t/puvKsgJU=
-----END PUBLIC KEY-----`;

let store = null;

function init(electronStore) {
  store = electronStore;
}

function validateLicenseKey(key) {
  try {
    const raw = Buffer.from(key.trim(), 'base64').toString('utf8');
    const { payload, signature } = JSON.parse(raw);
    const isValid = crypto.verify(
      null,
      Buffer.from(payload),
      PUBLIC_KEY,
      Buffer.from(signature, 'base64')
    );
    if (!isValid) return { valid: false };
    const data = JSON.parse(payload);
    return { valid: true, email: data.email, features: data.features || [] };
  } catch {
    return { valid: false };
  }
}

function isPro() {
  if (!store) return false;
  const key = store.get('licenseKey', '');
  if (!key) return false;
  const result = validateLicenseKey(key);
  return result.valid && result.features.includes('pro');
}

function activateLicense(key) {
  const result = validateLicenseKey(key);
  if (!result.valid) return { success: false, error: 'Invalid license key' };
  if (!result.features.includes('pro')) return { success: false, error: 'License does not include Pro' };
  store.set('licenseKey', key.trim());
  store.set('licenseEmail', result.email);
  return { success: true, email: result.email };
}

function deactivateLicense() {
  store.set('licenseKey', '');
  store.set('licenseEmail', '');
}

function getLicenseInfo() {
  const pro = isPro();
  return {
    isPro: pro,
    email: pro ? store.get('licenseEmail', '') : '',
  };
}

module.exports = { init, validateLicenseKey, isPro, activateLicense, deactivateLicense, getLicenseInfo };
