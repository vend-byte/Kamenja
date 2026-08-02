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
  // Browsers silently refuse to store a `Secure` cookie over a plain HTTP connection —
  // if the app is ever served without HTTPS while NODE_ENV=production (e.g. testing a
  // production build locally with `next start`, or a not-yet-HTTPS deployment), the
  // login response would *look* successful client-side while the cookie never actually
  // gets stored. Every subsequent authenticated request (like bulk import) then fails
  // immediately with 401, even though the admin UI itself renders normally.
  // ADMIN_COOKIE_INSECURE=true is an explicit escape hatch for exactly that situation.
  const forceInsecure = process.env.ADMIN_COOKIE_INSECURE === 'true';
  const secure = isProduction && !forceInsecure;
  return {
    httpOnly: true,
    secure,
    // 'none' is only needed for cross-site cookie use, which this app never does
    // (the admin UI and API always share the same origin). 'lax' works for same-origin
    // fetch/form submissions and — unlike 'none' — doesn't itself require HTTPS.
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  };
}
