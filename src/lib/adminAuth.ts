import { createHash, timingSafeEqual } from 'crypto';

export const adminSessionCookieName = 'kamenja_admin_session';

const adminUsername = 'admin';
const defaultPasswordHash = createHash('sha256').update('Kamenja2').digest('hex');

export function getStoredAdminPasswordHash() {
  return process.env.ADMIN_PASSWORD_HASH || defaultPasswordHash;
}

export function verifyAdminCredentials(username: string, password: string, storedHash?: string) {
  if (username !== adminUsername) return false;

  const candidateHash = createHash('sha256').update(password).digest('hex');
  const expected = (storedHash || getStoredAdminPasswordHash()).toLowerCase();
  const candidate = candidateHash.toLowerCase();

  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(expected, 'hex'));
}

export function getSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  };
}
