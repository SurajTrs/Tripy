// app/api/book-trip/bus/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { bookBus } from '../../../../lib/busApi';

export async function POST(req: NextRequest) {
  try {
    const { busId, passengers, userDetails } = await req.json();

    // Validate required fields
    if (!busId || !passengers || !userDetails) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Call the bus booking function
    const bookingResult = await bookBus(busId, userDetails, passengers);

    return NextResponse.json({
      success: true,
      message: 'Bus booked successfully',
      booking: bookingResult
    });
  } catch (error: any) {
    console.error('Bus booking error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to book bus' },
      { status: 500 }
    );
  }
}