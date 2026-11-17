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
