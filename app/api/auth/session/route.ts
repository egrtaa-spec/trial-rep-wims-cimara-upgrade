import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) {
      return NextResponse.json({ user: null });
    }

    const sessionData = JSON.parse(sessionCookie);
    return NextResponse.json({ user: sessionData });
  } catch (error) {
    console.error('[v0] Session check error:', error);
    return NextResponse.json({ user: null });
  }
}
