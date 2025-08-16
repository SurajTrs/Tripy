import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findSession } from '@/lib/server/authStore';

// In-memory storage for demo (replace with database in production)
const bookings: any[] = [];

export async function GET(req: NextRequest) {
  try {
    // Get session token from cookies
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Find session
    const session = await findSession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { message: 'Invalid session' },
        { status: 401 }
      );
    }

    // Get user's bookings
    const userBookings = bookings.filter(b => b.userId === session.userId);

    return NextResponse.json(userBookings);

  } catch (error: any) {
    console.error('Get bookings error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get session token from cookies
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Find session
    const session = await findSession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { message: 'Invalid session' },
        { status: 401 }
      );
    }

    const bookingData = await req.json();

    // Create new booking
    const newBooking = {
      id: `booking_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      userId: session.userId,
      bookingId: bookingData.bookingId,
      destination: bookingData.destination,
      departureDate: bookingData.departureDate,
      returnDate: bookingData.returnDate,
      totalAmount: bookingData.totalAmount,
      status: bookingData.status || 'confirmed',
      type: bookingData.type || 'package',
      createdAt: new Date().toISOString()
    };

    bookings.push(newBooking);

    return NextResponse.json({
      message: 'Booking created successfully',
      booking: newBooking
    });

  } catch (error: any) {
    console.error('Create booking error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
