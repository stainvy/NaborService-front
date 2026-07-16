#!/usr/bin/env node
// Génère un code TOTP valide en se basant sur l'horloge de CETTE machine
// (= celle du back en local). À utiliser pour tester l'auth quand l'horloge du
// back diffère de celle d'un téléphone (environnement de dev à date simulée).
//
// Usage :
//   node scripts/totp.mjs <secret-base32>
//   node scripts/totp.mjs "otpauth://totp/...?secret=XXXX&..."
//
// Astuce : laisse-le tourner (watch) — il réaffiche le code à chaque fenêtre.

import crypto from 'node:crypto';

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node scripts/totp.mjs <secret-base32 | otpauth-url>');
  process.exit(1);
}

// Accepte soit un secret base32, soit une otpauth URL (on en extrait le secret).
const secret = arg.includes('secret=') ? decodeURIComponent(arg.match(/secret=([^&]+)/)[1]) : arg;

function base32decode(b32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const c of b32.replace(/=+$/, '').toUpperCase()) {
    const val = alphabet.indexOf(c);
    if (val < 0) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function totp(secretB32) {
  const key = base32decode(secretB32);
  let counter = Math.floor(Date.now() / 1000 / 30);
  const buf = Buffer.alloc(8);
  for (let i = 7; i >= 0; i--) {
    buf[i] = counter & 0xff;
    counter = Math.floor(counter / 256);
  }
  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return (code % 1e6).toString().padStart(6, '0');
}

function show() {
  const remaining = 30 - (Math.floor(Date.now() / 1000) % 30);
  console.log(`Code: ${totp(secret)}   (expire dans ${remaining}s)`);
}

show();
// Mode watch : réaffiche à chaque nouvelle fenêtre de 30s.
setInterval(() => {
  if (Math.floor(Date.now() / 1000) % 30 === 0) show();
}, 1000);
