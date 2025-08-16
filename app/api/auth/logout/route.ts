import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession } from '@/lib/server/authStore';

export async function POST(req: NextRequest) {
  try {
    // Get session token
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    
    if (sessionToken) {
      // Delete session from store
      await deleteSession(sessionToken);
    }

    // Create response
    const response = NextResponse.json({
      message: 'Logged out successfully'
    });

    // Clear session cookie
    response.cookies.delete('session_token');

    return response;

  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
