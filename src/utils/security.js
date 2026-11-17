/**
 * Cryptographic Password Hashing (Salted SHA-256) & Verification Utility
 * Format stored in DB: `sha256$<16-hex-salt>$<64-hex-digest>`
 */

export function isPasswordHashed(val) {
  return typeof val === 'string' && /^sha256\$[0-9a-f]+\$[0-9a-f]{64}$/i.test(val);
}

/**
 * Validates strong password requirement:
 * - At least 8 characters
 * - At least 1 letter (A-Z or a-z)
 * - At least 1 number (0-9)
 * - At least 1 special character (e.g. @ # $ ! % ^ & * _ - .)
 */
export function validateStrongPassword(pwd) {
  const s = String(pwd ?? '').trim();
  if (s.length < 8) {
    return {
      valid: false,
      error: 'Password must be at least 8 characters long (e.g. Pass@1234).'
    };
  }
  if (!/[A-Za-z]/.test(s) || !/[0-9]/.test(s)) {
    return {
      valid: false,
      error: 'Password must be alphanumeric (contain both letters and numbers).'
    };
  }
  if (!/[^A-Za-z0-9\s]/.test(s)) {
    return {
      valid: false,
      error: 'Password must include at least 1 special character (e.g. @, #, $, !).'
    };
  }
  return { valid: true, error: '' };
}

function generateHexSalt(byteLen = 8) {
  const bytes = new Uint8Array(byteLen);
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < byteLen; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256Hex(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback pure-JS SHA-256 for non-secure local contexts
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  const rotr = (n, x) => (x >>> n) | (x << (32 - n));
  const l = data.length * 8;
  const withOne = new Uint8Array(((data.length + 9 + 63) >> 6) << 6);
  withOne.set(data);
  withOne[data.length] = 0x80;
  const dv = new DataView(withOne.buffer);
  dv.setUint32(withOne.length - 4, l >>> 0, false);
  dv.setUint32(withOne.length - 8, Math.floor(l / 0x100000000), false);
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const W = new Uint32Array(64);
  for (let i = 0; i < withOne.length; i += 64) {
    for (let t = 0; t < 16; t++) W[t] = dv.getUint32(i + t * 4, false);
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(7, W[t - 15]) ^ rotr(18, W[t - 15]) ^ (W[t - 15] >>> 3);
      const s1 = rotr(17, W[t - 2]) ^ rotr(19, W[t - 2]) ^ (W[t - 2] >>> 10);
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[t] + W[t]) >>> 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + temp1) >>> 0;
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((v) => v.toString(16).padStart(8, '0'))
    .join('');
}

export async function hashPassword(plainText, customSalt) {
  if (!plainText) return '';
  if (isPasswordHashed(plainText)) return plainText;
  const salt = customSalt || generateHexSalt(8);
  const digest = await sha256Hex(`${salt}:${plainText}`);
  return `sha256$${salt}$${digest}`;
}

export async function verifyPassword(inputPlain, storedValue) {
  if (!inputPlain || !storedValue) return false;
  if (isPasswordHashed(storedValue)) {
    const parts = storedValue.split('$');
    const salt = parts[1];
    const expected = await hashPassword(inputPlain, salt);
    return expected.toLowerCase() === storedValue.toLowerCase();
  }
  return inputPlain === storedValue;
}

// --- RFC 6238 Google Authenticator TOTP Implementation ---
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateTotpSecret(length = 16) {
  const bytes = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  let out = '';
  for (let i = 0; i < length; i++) {
    out += BASE32_ALPHABET[bytes[i] % 32];
  }
  return out;
}

/**
 * Generates a deterministic 16-char Base32 secret from LoginID so first-time QR stays stable
 */
export function deriveDefaultTotpSecret(loginId = 'user') {
  const seed = `BOOKLY_2FA_SECRET_${String(loginId).trim().toLowerCase()}_V1`;
  let out = '';
  let h = 2166136261;
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < seed.length; j++) {
      h ^= seed.charCodeAt(j) + i * 31;
      h = Math.imul(h, 16777619) >>> 0;
    }
    out += BASE32_ALPHABET[h % 32];
  }
  return out;
}

function base32ToBytes(base32) {
  const clean = String(base32 || '')
    .toUpperCase()
    .replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean[i]);
    if (val >= 0) {
      bits += val.toString(2).padStart(5, '0');
    }
  }
  const byteCount = Math.floor(bits.length / 8);
  const bytes = new Uint8Array(byteCount);
  for (let i = 0; i < byteCount; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }
  return bytes;
}

async function hmacSha1(keyBytes, messageBytes) {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    const sig = await window.crypto.subtle.sign('HMAC', cryptoKey, messageBytes);
    return new Uint8Array(sig);
  }
  // Pure-JS SHA-1 + HMAC fallback
  const sha1 = (msg) => {
    const rotr32 = (n, x) => (x << n) | (x >>> (32 - n));
    const ml = msg.length * 8;
    const padded = new Uint8Array(((msg.length + 9 + 63) >> 6) << 6);
    padded.set(msg);
    padded[msg.length] = 0x80;
    const dv = new DataView(padded.buffer);
    dv.setUint32(padded.length - 4, ml >>> 0, false);
    dv.setUint32(padded.length - 8, Math.floor(ml / 0x100000000), false);
    let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
    const W = new Uint32Array(80);
    for (let i = 0; i < padded.length; i += 64) {
      for (let t = 0; t < 16; t++) W[t] = dv.getUint32(i + t * 4, false);
      for (let t = 16; t < 80; t++) W[t] = rotr32(1, W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16]) >>> 0;
      let a = h0, b = h1, c = h2, d = h3, e = h4;
      for (let t = 0; t < 80; t++) {
        const f = t < 20 ? (b & c) | (~b & d) : t < 40 ? b ^ c ^ d : t < 60 ? (b & c) | (b & d) | (c & d) : b ^ c ^ d;
        const k = t < 20 ? 0x5a827999 : t < 40 ? 0x6ed9eba1 : t < 60 ? 0x8f1bbcdc : 0xca62c1d6;
        const temp = (rotr32(5, a) + f + e + k + W[t]) >>> 0;
        e = d; d = c; c = rotr32(30, b) >>> 0; b = a; a = temp;
      }
      h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0;
    }
    const out = new Uint8Array(20);
    const odv = new DataView(out.buffer);
    odv.setUint32(0, h0, false); odv.setUint32(4, h1, false); odv.setUint32(8, h2, false);
    odv.setUint32(12, h3, false); odv.setUint32(16, h4, false);
    return out;
  };
  const blockSize = 64;
  let k = keyBytes.length > blockSize ? sha1(keyBytes) : keyBytes;
  const ipad = new Uint8Array(blockSize);
  const opad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    const kb = i < k.length ? k[i] : 0;
    ipad[i] = kb ^ 0x36;
    opad[i] = kb ^ 0x5c;
  }
  const inner = new Uint8Array(blockSize + messageBytes.length);
  inner.set(ipad);
  inner.set(messageBytes, blockSize);
  const innerHash = sha1(inner);
  const outer = new Uint8Array(blockSize + innerHash.length);
  outer.set(opad);
  outer.set(innerHash, blockSize);
  return sha1(outer);
}

export async function generateTotpCodeAtStep(secretBase32, timeStep) {
  const keyBytes = base32ToBytes(secretBase32);
  const counterBytes = new Uint8Array(8);
  const dv = new DataView(counterBytes.buffer);
  dv.setUint32(0, Math.floor(timeStep / 0x100000000), false);
  dv.setUint32(4, timeStep >>> 0, false);

  const hmac = await hmacSha1(keyBytes, counterBytes);
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(binary % 1000000).padStart(6, '0');
}

async function getRealUtcTimeMs() {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') {
    return Date.now();
  }
  try {
    const res = await fetch(`${window.location.origin}/?t=${Date.now()}`, {
      method: 'HEAD',
      cache: 'no-store'
    });
    const dateHdr = res.headers.get('date');
    if (dateHdr) {
      const parsed = Date.parse(dateHdr);
      if (!isNaN(parsed)) return parsed;
    }
  } catch {
    // Fallback to local clock if offline
  }
  return Date.now();
}

export async function verifyTotpToken(secretBase32, token, windowSteps = 2) {
  const cleanToken = String(token || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleanToken) || !secretBase32) return false;

  // 1. Check against real server UTC time (handles PCs whose local date/year is out of sync with mobile phone)
  const serverMs = await getRealUtcTimeMs();
  const serverStep = Math.floor(serverMs / 1000 / 30);
  for (let w = -windowSteps; w <= windowSteps; w++) {
    const expected = await generateTotpCodeAtStep(secretBase32, serverStep + w);
    if (expected === cleanToken) return true;
  }

  // 2. Also check against local device clock
  const localStep = Math.floor(Date.now() / 1000 / 30);
  if (localStep !== serverStep) {
    for (let w = -windowSteps; w <= windowSteps; w++) {
      const expected = await generateTotpCodeAtStep(secretBase32, localStep + w);
      if (expected === cleanToken) return true;
    }
  }

  return false;
}

export function buildOtpAuthUri(loginId, secretBase32, issuer = 'Bookly') {
  const cleanIssuer = encodeURIComponent(issuer);
  const cleanLabel = encodeURIComponent(`${issuer}:${loginId}`);
  return `otpauth://totp/${cleanLabel}?secret=${secretBase32}&issuer=${cleanIssuer}&algorithm=SHA1&digits=6&period=30`;
}
