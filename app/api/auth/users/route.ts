// app/api/auth/users/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findSession, findUserById, getUsers } from '@/lib/server/authStore';

export async function GET() {
  try {
    // Check if the request is authenticated
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    
    if (sessionToken) {
      // If authenticated, return all users (for admin purposes)
      const session = await findSession(sessionToken);
      if (session) {
        const user = await findUserById(session.userId);
        if (user && user.email === 'admin@example.com') {
          // Only admin can see all users
          return NextResponse.json(await getUsers());
        }
      }
      
      // For non-admin authenticated users, return empty array
      return NextResponse.json([]);
    }
    
    // For non-authenticated requests, return empty array
    return NextResponse.json([]);
  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}