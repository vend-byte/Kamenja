/**
 * Single source of truth for the site's absolute base URL, used in metadata,
 * canonical links, Open Graph tags, the sitemap, and robots.txt.
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_SITE_URL — set this in Vercel → Settings → Environment
 *      Variables once a custom domain (e.g. kamenjaenterprises.co.ke) is
 *      purchased and connected. That's the ONLY change needed to migrate —
 *      no code edits, no hunting through files.
 *   2. VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL — automatically provided
 *      by Vercel for every deployment, so this works correctly out of the
 *      box on the current *.vercel.app URL with zero configuration.
 *   3. localhost fallback for local dev.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }
  return 'http://localhost:3000';
}
