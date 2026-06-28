import { Readable } from 'stream';
import { NextResponse } from 'next/server';
import { cloudinary } from '@/lib/cloudinary';

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

    const uploadResult: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'kamenja-enterprises',
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      Readable.from(buffer).pipe(uploadStream);
    });

    if (!uploadResult?.secure_url) {
      return NextResponse.json({ error: 'Cloudinary upload did not return a secure URL.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, url: uploadResult.secure_url, imageUrl: uploadResult.secure_url });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to upload image.' }, { status: 500 });
  }
}
