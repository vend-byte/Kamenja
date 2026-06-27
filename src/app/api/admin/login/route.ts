import { NextResponse } from 'next/server';
import { adminSessionCookieName, getSessionCookieOptions, verifyAdminCredentials } from '@/lib/adminAuth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Please enter both username and password.' }, { status: 400 });
    }

    if (verifyAdminCredentials(username, password)) {
      const response = NextResponse.json({ success: true, message: 'Logged in successfully' });
      response.cookies.set(adminSessionCookieName, 'authenticated', getSessionCookieOptions());
      return response;
    }

    return NextResponse.json(
      { error: 'Incorrect username or password. Please try again.' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
