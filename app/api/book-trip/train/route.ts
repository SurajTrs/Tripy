// app/api/book-trip/train/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { bookTrain } from '../../../../lib/train';

export async function POST(req: NextRequest) {
  try {
    const { trainId, passengers, userDetails } = await req.json();

    // Validate required fields
    if (!trainId || !passengers || !userDetails) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Call the train booking function
    const bookingResult = await bookTrain(trainId, passengers, userDetails);

    return NextResponse.json({
      success: true,
      message: 'Train booked successfully',
      booking: bookingResult
    });
  } catch (error: any) {
    console.error('Train booking error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to book train' },
      { status: 500 }
    );
  }
}