// app/api/train/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { searchTrains } from '../../../lib/train';

export async function GET(req: NextRequest) {
  try {
    // Get search parameters from URL
    const url = new URL(req.url);
    const origin = url.searchParams.get('origin');
    const destination = url.searchParams.get('destination');
    const departureDate = url.searchParams.get('departureDate');
    const passengers = url.searchParams.get('passengers');

    // Validate required parameters
    if (!origin || !destination || !departureDate) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Call the train search function
    const trains = await searchTrains({
      origin,
      destination,
      departureDate,
      passengers: passengers ? parseInt(passengers, 10) : 1
    });

    return NextResponse.json({
      success: true,
      data: trains
    });
  } catch (error: any) {
    console.error('Train search error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to search trains' },
      { status: 500 }
    );
  }
}