import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUserByEmail, getAllUsers, createSession, getUserWithoutPassword } from '@/lib/server/authStore';

export async function POST(req: NextRequest) {
  try {
    console.log('Login API: Received login request');
    const { email, password } = await req.json();
    console.log('Login API: Email provided:', email);

    // Validation
    if (!email || !password) {
      console.log('Login API: Missing email or password');
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    console.log('Login API: Attempting login for email:', email);
    
    // Log all users for debugging
    const allUsers = await getAllUsers();
    console.log('Login API: All users:', allUsers.map(u => ({ id: u.id, email: u.email })));
    
    const user = await findUserByEmail(email);
    console.log('Login API: Found user for login attempt:', !!user);
    
    if (!user) {
      console.log('Login API: User not found with email:', email);
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }
    console.log('Login API: User found:', user.email, 'ID:', user.id);

    // Verify password
    console.log('Login API: Verifying password');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Login API: Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Login API: Invalid password');
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session
    const sessionToken = await createSession(user.id);
    console.log('Login API: Created session token:', sessionToken);
    
    // Return user data (without password)
    const userData = await getUserWithoutPassword(user);
    console.log('Login API: User data:', userData);

    // Create response with cookie
    const response = NextResponse.json({
      message: 'Login successful',
      user: userData
    });

    // Set session cookie with improved options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      // Ensure the cookie is accessible from all paths
      domain: undefined // Use the default domain
    };
    
    response.cookies.set('session_token', sessionToken, cookieOptions);
    
    console.log('Login API: Set session cookie:', sessionToken);
    console.log('Login API: Cookie options:', cookieOptions);

    return response;

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
