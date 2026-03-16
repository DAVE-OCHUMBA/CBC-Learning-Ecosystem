#!/usr/bin/env node
/**
 * CBC Learning Ecosystem — Deployment Secret Generator
 * Run: node infra/generate-secrets.js
 *
 * Outputs all Railway + Vercel environment variables with secure
 * randomly-generated secrets ready to paste into the dashboard.
 */

const crypto = require('crypto');

const rand64 = () => crypto.randomBytes(48).toString('base64');   // 64-char base64
const rand32 = () => crypto.randomBytes(24).toString('base64');   // 32-char base64

const secrets = {
  JWT_SECRET:           rand64(),
  JWT_REFRESH_SECRET:   rand64(),
  ENCRYPTION_KEY:       rand32(),
};

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║  CBC Learning Ecosystem — Generated Secrets                  ║');
console.log('║  Copy each value into Railway → Variables (backend service)  ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

for (const [key, val] of Object.entries(secrets)) {
  console.log(`${key}=${val}`);
}

console.log('\n── Also set these manually (get from external services) ──────────\n');

const manual = [
  ['NODE_ENV',              'production'],
  ['PORT',                  '5000'],
  ['API_BASE_URL',          'https://YOUR-APP.railway.app'],
  ['FRONTEND_URL',          'https://YOUR-APP.vercel.app'],
  ['CORS_ORIGINS',          'https://YOUR-APP.vercel.app'],
  ['DB_SSL',                'true'],
  ['MPESA_ENVIRONMENT',     'sandbox  ← change to production after go-live'],
  ['MPESA_CONSUMER_KEY',    '← from Safaricom Daraja portal'],
  ['MPESA_CONSUMER_SECRET', '← from Safaricom Daraja portal'],
  ['MPESA_PASSKEY',         '← from Safaricom Daraja portal'],
  ['MPESA_SHORTCODE',       '← your PayBill number (use 174379 for sandbox)'],
  ['AT_API_KEY',            '← from africastalking.com (optional for demo)'],
  ['AT_USERNAME',           '← your Africa\'s Talking username'],
  ['AT_SENDER_ID',          'CBCSCHOOL'],
  ['SENTRY_DSN',            '← optional, from sentry.io'],
  ['SLACK_WEBHOOK_URL',     '← optional, for deployment alerts'],
];

for (const [key, hint] of manual) {
  console.log(`${key}=${hint}`);
}

console.log('\n── Vercel environment variable ───────────────────────────────────\n');
console.log('VITE_API_BASE_URL=https://YOUR-APP.railway.app');
console.log('\n── GitHub Actions secrets needed ─────────────────────────────────\n');
console.log('RAILWAY_TOKEN      ← from Railway → Account Settings → Tokens');
console.log('VERCEL_TOKEN       ← from Vercel → Account Settings → Tokens');
console.log('VERCEL_ORG_ID      ← from Vercel → Settings → General');
console.log('VERCEL_PROJECT_ID  ← from Vercel → Project Settings → General');
console.log('VITE_API_BASE_URL  ← same as above');
console.log('SLACK_WEBHOOK_URL  ← optional\n');
