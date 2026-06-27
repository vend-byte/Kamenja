import { NextResponse } from 'next/server';
import { adminSessionCookieName, getSessionCookieOptions } from '@/lib/adminAuth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(adminSessionCookieName, '', {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
