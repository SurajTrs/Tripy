import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseURL: 'https://openrouter.ai/api/v1',
});

export interface TripDetails {
  from?: string | null;
  to?: string | null;
  date?: string | null;
  intent?: 'book_trip' | null;
}

/**
 * Parses a natural language message to extract structured trip details.
 */
export async function parseTripDetails(message: string): Promise<TripDetails> {
  const systemPrompt = `
You are a travel assistant. Extract structured travel intent data from the user's message.

Reply ONLY in this JSON format:
{
  "from": "Departure City",
  "to": "Destination City",
  "date": "Date in natural language (e.g., 30 August or tomorrow)",
  "intent": "book_trip"
}

If any field is missing, return null for that field.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.2,
    });

    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) throw new Error('No content received.');

    const parsed = JSON.parse(raw.trim());

    return {
      from: parsed.from ?? null,
      to: parsed.to ?? null,
      date: parsed.date ?? null,
      intent: parsed.intent ?? null,
    };
  } catch (error) {
    console.error('❌ Error parsing trip details:', error);
    return { from: null, to: null, date: null, intent: null };
  }
}
