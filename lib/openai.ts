import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY, // ✅ make sure this exists
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, // ✅ AUTH header
    'HTTP-Referer': 'https://tripy-ai.vercel.app',  // ✅ required by OpenRouter
    'X-Title': 'Tripy AI Travel Assistant',         // ✅ required by OpenRouter
  },
});

export default openai;
