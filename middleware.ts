import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the session token from cookies
  const sessionToken = request.cookies.get('session_token')?.value;
  
  // Get the pathname from the URL
  const { pathname } = request.nextUrl;
  
  console.log('Middleware: Checking path', pathname, 'Session token exists:', !!sessionToken);
  if (sessionToken) {
    // Only log a portion of the token for security
    console.log('Middleware: Session token value:', sessionToken.substring(0, 8) + '...');
  } else {
    console.log('Middleware: No session token found');
  }
  
  // Define protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/api/bookings',
  ];
  
  // Define auth routes (login/signup)
  const authRoutes = [
    '/login',
    '/signup',
  ];
  
  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route => pathname === route);
  
  // If accessing a protected route without a session token, redirect to login
  if (isProtectedRoute && !sessionToken) {
    console.log('Middleware: Redirecting to login from protected route');
    const response = NextResponse.redirect(new URL('/login', request.url));
    return response;
  }
  
  // If accessing an auth route with a session token, redirect to dashboard
  if (isAuthRoute && sessionToken) {
    console.log('Middleware: Redirecting to dashboard from auth route');
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    return response;
  }
  
  // For API routes that require authentication
  if (pathname.startsWith('/api/bookings') && !sessionToken) {
    console.log('Middleware: Blocking unauthenticated API access');
    return new NextResponse(JSON.stringify({ message: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Continue with the request for all other cases
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/bookings/:path*',
    '/login',
    '/signup',
  ],
};