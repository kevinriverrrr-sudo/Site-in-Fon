import crypto from 'crypto';

export function getBaseUrl() {
  const url = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
  if (url.startsWith('http')) return url;
  return `https://${url}`;
}

export function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}
