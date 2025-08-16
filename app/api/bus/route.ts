// app/api/bus/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { searchBuses } from '../../../lib/busApi';

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

    // Call the bus search function
    const buses = await searchBuses({
      origin,
      destination,
      departureDate,
      passengers: passengers ? parseInt(passengers, 10) : 1
    });

    return NextResponse.json({
      success: true,
      data: buses
    });
  } catch (error: any) {
    console.error('Bus search error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to search buses' },
      { status: 500 }
    );
  }
}