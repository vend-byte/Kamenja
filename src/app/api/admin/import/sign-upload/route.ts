import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminSessionCookieName } from '@/lib/adminAuth';
import { signUpload } from '@/lib/cloudinary';

// Signs a direct browser -> Cloudinary upload for the raw catalogue file
// (.xlsx / .csv / .zip). This exists purely to route around Vercel's hard
// 4.5MB request-body limit on Functions: the actual file bytes go straight
// from the browser to Cloudinary, never through this app's server.
export async function POST() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(adminSessionCookieName)?.value;
    if (session !== 'authenticated') {
      return NextResponse.json({ error: 'Your admin session could not be verified.' }, { status: 401 });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: 'Cloudinary is not configured on the server (CLOUDINARY_* env vars missing).' }, { status: 500 });
    }

    const folder = 'kamenja-enterprises/bulk-import/source-files';
    const { signature, timestamp, apiKey, cloudName } = signUpload({ folder });

    // Defensive: a cloudName with stray whitespace/quotes (easy to introduce via
    // copy-paste into .env, or CRLF line endings on an unquoted value) produces an
    // invalid https://api.cloudinary.com/v1_1/<cloudName>/raw/upload URL on the
    // client. That fetch fails before any response is received, which the browser
    // console reports as a CORS/network error — even though the real cause is this
    // malformed value, not a cross-origin policy issue.
    if (!cloudName || /["'\s]/.test(cloudName)) {
      return NextResponse.json(
        { error: `CLOUDINARY_CLOUD_NAME looks malformed on the server ("${cloudName}"). Check for stray quotes or whitespace in your .env file.` },
        { status: 500 }
      );
    }

    return NextResponse.json({ signature, timestamp, apiKey, cloudName, folder });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to sign upload.' }, { status: 500 });
  }
}
