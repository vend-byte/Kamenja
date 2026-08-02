import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };
export const CLOUDINARY_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1510519138101-570d1dca3d66?auto=format&fit=crop&q=80&w=1200';

/**
 * Sign a direct browser -> Cloudinary upload so large files (e.g. bulk-import
 * spreadsheets/zips) never have to pass through a Vercel Function body, which
 * has a hard 4.5MB request-size limit that can't be raised in code or config.
 * The client uploads straight to Cloudinary with this signature, then sends
 * our server only the resulting (small) URL to fetch and process.
 */
export function signUpload(params: Record<string, string | number>) {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiSecret) throw new Error('CLOUDINARY_API_SECRET is not configured.');
  const timestamp = Math.round(Date.now() / 1000);
  const toSign = { ...params, timestamp };
  const signature = cloudinary.utils.api_sign_request(toSign, apiSecret);
  return { signature, timestamp, apiKey: process.env.CLOUDINARY_API_KEY, cloudName: process.env.CLOUDINARY_CLOUD_NAME };
}
