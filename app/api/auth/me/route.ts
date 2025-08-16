import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findSession, findUserById, getUserWithoutPassword } from '@/lib/server/authStore';

export async function GET(req: NextRequest) {
  try {
    // Get session token from cookies
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    console.log('/api/auth/me: Session token exists:', !!sessionToken);
    console.log('/api/auth/me: Session token value:', sessionToken);
    
    if (!sessionToken) {
      console.log('/api/auth/me: No session token found');
      const response = NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
      // Ensure no invalid cookie remains
      response.cookies.delete('session_token');
      return response;
    }

    // Find session
    const session = await findSession(sessionToken);
    console.log('/api/auth/me: Session found:', !!session);
    if (!session) {
      console.log('/api/auth/me: Invalid session');
      // Clear the invalid cookie
      const response = NextResponse.json(
        { message: 'Invalid session' },
        { status: 401 }
      );
      response.cookies.delete('session_token', { path: '/' });
      return response;
    }

    // Find user
    const user = await findUserById(session.userId);
    console.log('/api/auth/me: User found:', !!user, user ? `(${user.email})` : '');
    if (!user) {
      console.log('/api/auth/me: User not found');
      // Clear the session cookie if user not found
      const response = NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
      response.cookies.delete('session_token');
      return response;
    }

    // Return user data (without password)
    const userData = await getUserWithoutPassword(user);
    console.log('/api/auth/me: Returning user data:', userData.id);

    return NextResponse.json(userData);

  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
