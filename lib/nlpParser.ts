// src/lib/nlpParser.ts
// This file integrates with the Gemini API for natural language processing.

import { ParsedTripDetails } from '../types'; // Import ParsedTripDetails

/**
 * Parses user messages using the Gemini API to extract trip details and intent.
 * @param message The user's input message.
 * @returns A promise that resolves to ParsedTripDetails.
 */
export async function parseTripDetails(message: string): Promise<ParsedTripDetails> {
  const apiKey = process.env.GEMINI_API_KEY; // Get API key from environment variables
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set in your environment variables (.env.local).");
    // Return a structured error response if API key is missing
    return {
      intent: 'error',
      message: 'API key for NLP is missing. Please configure it.', // Message is a string
      from: null, to: null, date: null, budget: null, mode: null, groupSize: null,
      returnTrip: null, returnDate: null
    };
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  // IMPORTANT: The system prompt is crucial for Gemini's output format.
  // Ensure it strongly enforces JSON output with 'null' for missing fields.
  const systemPrompt = `You are a precise travel information extraction API. Extract the following from user's message:
- from: Origin city (e.g., "New Delhi")
- to: Destination city (e.g., "Mumbai")
- date: Date of travel (e.g., "25th December", "tomorrow", "August 18 2025")
- budget: One of Luxury, Medium, Budget-friendly
- mode: One of Train, Bus, Flight
- groupSize: Number of people (e.g., 1, 2, 5)
- returnTrip: Boolean (true if the user wants a round trip or return journey, false or null if one-way)
- returnDate: Date of return travel (e.g., "30th December", "next week", "August 25 2025")
- intent: 'book_trip' if the user wants to plan or book a trip (including phrases like "book my ticket", "book it", "confirm booking", "book now", "make a booking", "reserve", "purchase ticket", "buy ticket", "proceed with booking", "complete booking", "finalize booking", "book this trip", "book the flight", "book the hotel"), 'display_trip' if they want to see a previous trip, 'cancel_trip' if they want to clear the current plan, 'greet' for greetings (e.g., "hi", "hello").
- message: An optional, brief confirmation or error message (e.g., "Understood!", "Please clarify the date.").

Return only JSON as per this schema with no markdown or extra text. If a field is not found, set its value to null.`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n\nUser message: "${message}"` }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          from: { type: "STRING", nullable: true },
          to: { type: "STRING", nullable: true },
          date: { type: "STRING", nullable: true },
          budget: {
            type: "STRING",
            enum: ["Luxury", "Medium", "Budget-friendly"],
            nullable: true,
          },
          mode: {
            type: "STRING",
            enum: ["Train", "Bus", "Flight"],
            nullable: true,
          },
          groupSize: { type: "NUMBER", nullable: true },
          returnTrip: { type: "BOOLEAN", nullable: true },
          returnDate: { type: "STRING", nullable: true },
          intent: {
            type: "STRING",
            enum: ["book_trip", "display_trip", "cancel_trip", "greet", "error", "unknown"] // Ensure all intents are covered
          },
          message: { type: "STRING", nullable: true },
        },
        required: ["intent"], // Only intent is strictly required by schema
      },
    },
  };

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini API failed:", res.status, errText);
      // Return a structured error response if Gemini API fails
      return {
        intent: 'error',
        message: `NLP service error: ${res.statusText}. Details: ${errText.substring(0, 150)}`,
        from: null, to: null, date: null, budget: null, mode: null, groupSize: null,
        returnTrip: null, returnDate: null
      };
    }

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        const rawText = await res.text();
        console.error("Gemini API did not return JSON. Content-Type:", contentType, "Raw body:", rawText);
        // Fallback for non-JSON response from Gemini
        return {
          intent: 'error',
          message: 'NLP service returned an invalid response format.',
          from: null, to: null, date: null, budget: null, mode: null, groupSize: null,
          returnTrip: null, returnDate: null
        };
    }

    const result = await res.json();
    // Gemini 2.0 Flash with responseSchema directly returns the JSON object in 'text' part
    const part = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!part) {
        console.warn("Gemini API returned no text content or candidates.");
        // Return a default 'unknown' intent with a helpful message
        return {
          intent: 'unknown',
          message: 'I could not extract specific information from your message. Can you please rephrase?',
          from: null, to: null, date: null, budget: null, mode: null, groupSize: null,
          returnTrip: null, returnDate: null
        };
    }

    let raw = part.trim();
    // Clean up markdown code block if present (Gemini with responseSchema often omits this, but good to keep)
    if (raw.startsWith('```json')) raw = raw.slice(7, -3).trim();
    else if (raw.startsWith('```')) raw = raw.slice(3, -3).trim();

    // Replace "null" strings with actual null values for JSON parsing, if Gemini outputs them as strings
    const cleanJson = raw.replace(/: "null"/g, ": null");

    let parsedData: ParsedTripDetails;
    try {
      parsedData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("Failed to parse Gemini's JSON response:", parseError, "Raw:", cleanJson);
      return {
        intent: 'error',
        message: 'NLP service returned malformed JSON. Please try again.',
        from: null, to: null, date: null, budget: null, mode: null, groupSize: null,
        returnTrip: null, returnDate: null
      };
    }


    // Ensure numeric fields are correctly parsed if they come as strings (Gemini's responseSchema helps, but defensive)
    if (typeof parsedData.groupSize === 'string') {
        parsedData.groupSize = parseInt(parsedData.groupSize, 10);
        if (isNaN(parsedData.groupSize)) parsedData.groupSize = null;
    }

    // Ensure all optional fields are explicitly null if they are undefined in the parsed data
    // This makes the ParsedTripDetails object predictable for the rest of the application.
    parsedData.from = parsedData.from === undefined ? null : parsedData.from;
    parsedData.to = parsedData.to === undefined ? null : parsedData.to;
    parsedData.date = parsedData.date === undefined ? null : parsedData.date;
    parsedData.budget = parsedData.budget === undefined ? null : parsedData.budget;
    parsedData.mode = parsedData.mode === undefined ? null : parsedData.mode;
    parsedData.groupSize = parsedData.groupSize === undefined ? null : parsedData.groupSize;
    parsedData.message = parsedData.message === undefined ? undefined : parsedData.message; // Ensure message is undefined if not set

    // Defensive check: ensure intent is always valid or defaults to 'unknown'
    const validIntents = ["book_trip", "display_trip", "cancel_trip", "greet", "error", "unknown"];
    if (!parsedData.intent || !validIntents.includes(parsedData.intent)) {
        console.warn(`NLP returned an invalid or missing intent: "${parsedData.intent}". Defaulting to 'unknown'.`);
        parsedData.intent = 'unknown';
        parsedData.message = parsedData.message || 'I could not determine your intent. Can you please rephrase?';
    }
    
    // Ensure returnTrip and returnDate are explicitly null if they are undefined
    parsedData.returnTrip = parsedData.returnTrip === undefined ? null : parsedData.returnTrip;
    parsedData.returnDate = parsedData.returnDate === undefined ? null : parsedData.returnDate;


    console.log('✅ NLP parse successful:', parsedData);
    return parsedData;
  } catch (error: any) {
    console.error('❌ NLP parse failed:', error);
    // Return an 'error' intent with the error message and all fields explicitly null
    return {
      intent: 'error',
      message: error.message || 'An unexpected error occurred during NLP parsing.',
      from: null, to: null, date: null, budget: null, mode: null, groupSize: null,
      returnTrip: null, returnDate: null
    };
  }
}