// lib/nlpParser.ts
import OpenAI from 'openai';

export type ParsedTripDetails = {
  from?: string | null;
  to?: string | null;
  date?: string | null;
  intent?: string | null;
};

/**
 * Parses trip details from a user message using an OpenAI model.
 * @param message The user's input message.
 * @returns A promise resolving to ParsedTripDetails.
 */
export async function parseTripDetails(
  message: string
): Promise<ParsedTripDetails> {
  // Ensure OPENROUTER_API_KEY is available before proceeding
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY is not set in environment variables.');
    // Return a default empty object or throw an error based on desired behavior
    return { from: null, to: null, date: null, intent: null };
  }

  const openai = new OpenAI({
    apiKey: apiKey, // Use the checked API key
    baseURL: 'https://openrouter.ai/api/v1',
  });

  const systemPrompt = `
You are an expert travel assistant API. Your job is to extract structured travel information from a user's message.

The user's message will be a request to book a trip.
Extract the departure city, the destination city, and the date of travel.

Reply ONLY with a valid JSON object in the following format:
{
  "from": "Departure City",
  "to": "Destination City",
  "date": "Date in natural language (e.g., '30 August', 'tomorrow', 'next Friday')",
  "intent": "book_trip"
}

If any piece of information (like 'from', 'to', or 'date') is not present in the user's message, return null for that field. Do not make up information.
Ensure the response is a single JSON object with no extra explanation.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt.trim() },
        { role: 'user', content: message },
      ],
      temperature: 0,
    });

    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) {
      throw new Error('No response content received from the AI model.');
    }

    let parsedRaw: unknown;
    try {
      parsedRaw = JSON.parse(raw.trim());
    } catch (err: unknown) {
      console.error('❌ Failed to parse JSON from AI response:', err);
      // Provide more context in the error message for debugging
      throw new Error(`AI response is not valid JSON:\n${raw}\nParsing error: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Ensure parsedRaw is an object and cast it for type safety
    const parsed =
      parsedRaw && typeof parsedRaw === 'object' && !Array.isArray(parsedRaw)
        ? (parsedRaw as Record<string, unknown>)
        : {};

    return {
      from: typeof parsed.from === 'string' ? parsed.from : null,
      to: typeof parsed.to === 'string' ? parsed.to : null,
      date: typeof parsed.date === 'string' ? parsed.date : null,
      intent: typeof parsed.intent === 'string' ? parsed.intent : null,
    };
  } catch (error: unknown) {
    console.error('❌ Error parsing trip details with AI:', error);
    // Return nulls on error, allowing the main handler to ask follow-up questions
    return {
      from: null,
      to: null,
      date: null,
      intent: null,
    };
  }
}