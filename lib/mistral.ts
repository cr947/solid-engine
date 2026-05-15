import OpenAI from 'openai';

const apiKey = process.env.VLLM_API_KEY;
const apiUrl = process.env.VLLM_API_URL;
const model = process.env.VLLM_MODEL;

if (!apiKey || !apiUrl || !model) {
  throw new Error('Missing VLLM_API_KEY, VLLM_API_URL, or VLLM_MODEL environment variables');
}

const client = new OpenAI({
  apiKey,
  baseURL: apiUrl.replace(/\/$/, '') + '/v1',
});

export type MarketAnalysis = {
  pick: 'YES' | 'NO';
  confidence: number;
  reasoning: string;
};

const SYSTEM_PROMPT =
  'You are a prediction market analyst. Respond ONLY in valid JSON. No preamble. No explanation outside the JSON.';

export async function analyzeMarket({
  question,
  outcomePrices,
  volume,
  endDate,
}: {
  question: string;
  outcomePrices: Record<string, number>;
  volume: number;
  endDate: string;
}): Promise<MarketAnalysis | null> {
  const yesPrice = outcomePrices.YES ?? 0;
  const noPrice = outcomePrices.NO ?? 0;
  const yesPct = Number(((yesPrice / (yesPrice + noPrice)) * 100).toFixed(2)) || 0;
  const daysLeft = Math.max(0, Math.round((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const prompt = `Market: ${question}\nCurrent YES price: $${yesPrice} (implies ${yesPct}% probability)\nVolume: $${volume}\nCloses in: ${daysLeft} days\n\nRespond with exactly this JSON:\n{\n  "pick": "YES" or "NO",\n  "confidence": 0-100,\n  "reasoning": "2-3 sentence explanation"\n}`;

  try {
    const response = await client.chat.completions.create({
      model: model as string,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 300,
    });

    const rawText = String(response.choices?.[0]?.message?.content ?? '').trim();
    const parsed = JSON.parse(rawText);
    const pickText = String(parsed.pick ?? '').toUpperCase();
    const confidence = Number(parsed.confidence ?? NaN);
    const reasoning = String(parsed.reasoning ?? '').trim();

    if ((pickText !== 'YES' && pickText !== 'NO') || Number.isNaN(confidence) || confidence < 0 || confidence > 100 || reasoning.length === 0) {
      console.warn('Mistral response failed validation', rawText);
      return null;
    }

    if (confidence < 70) {
      return null;
    }

    return {
      pick: pickText as 'YES' | 'NO',
      confidence: Math.round(confidence),
      reasoning,
    };
  } catch (error) {
    console.error('Mistral analysis failed:', error);
    return null;
  }
}
