import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminSessionCookieName } from '@/lib/adminAuth';

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get(adminSessionCookieName)?.value;

  if (session === 'authenticated') {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
