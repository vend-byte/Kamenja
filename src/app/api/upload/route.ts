import { NextResponse } from 'next/server';
import { cloudinary, CLOUDINARY_FALLBACK_IMAGE } from '@/lib/cloudinary';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type || 'image/jpeg'};base64,${buffer.toString('base64')}`;

    const uploadResult: any = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(base64, {
        folder: 'kamenja-enterprises',
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    const secureUrl = uploadResult?.secure_url || CLOUDINARY_FALLBACK_IMAGE;

    return NextResponse.json({ success: true, url: secureUrl, imageUrl: secureUrl });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to upload image.' }, { status: 500 });
  }
}
