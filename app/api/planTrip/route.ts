
// /app/api/book-trip/route.ts

import { NextRequest, NextResponse } from "next/server";
import { parseTripDetails } from "@/lib/nlpParser";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    const details = await parseTripDetails(message);

    if (!details) {
      return NextResponse.json({ error: "Could not parse trip details" }, { status: 400 });
    }

    const { from, to, date } = details;

    return NextResponse.json({
      step: "select_travel_type",
      message: `Got it! You're planning to travel from **${from}** to **${to}** on **${date}**. How would you like to travel? 🚆 Train, 🚌 Bus, or ✈️ Flight?`,
      data: { from, to, date },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
