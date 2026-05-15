import { attachBuilderCode, fetchMarkets } from '@/lib/polymarket';
import { analyzeMarket } from '@/lib/mistral';
import { supabaseAdmin } from '@/lib/supabase';

export type AgentRunResult = {
  marketsAnalyzed: number;
  picksSaved: number;
};

export async function runAgentLoop(): Promise<AgentRunResult> {
  console.log('Starting Agora Agent loop...');
  const markets = await fetchMarkets();
  console.log(`Fetched ${markets.length} markets from Polymarket`);

  let picksSaved = 0;

  for (const market of markets) {
    try {
      const analysis = await analyzeMarket(market);
      if (!analysis) {
        console.log(`Skipping market ${market.id} due to insufficient confidence or invalid analysis.`);
        continue;
      }

      const orderPayload = attachBuilderCode({
        market_id: market.id,
        pick: analysis.pick,
        confidence: analysis.confidence,
      });

      console.log('Prepared order payload with builder code for market', market.id, orderPayload);

      const record = {
        market_id: market.id,
        question: market.question,
        pick: analysis.pick,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        outcome: 'PENDING',
      };

      const { error } = await supabaseAdmin.from('picks').upsert([record], {
        onConflict: 'market_id',
      });

      if (error) {
        console.error('Supabase upsert failed for market', market.id, error.message);
        continue;
      }

      picksSaved += 1;
    } catch (error) {
      console.error('Agent processing failed for market', market.id, error);
    }
  }

  console.log(`Agent loop finished: ${markets.length} markets analyzed, ${picksSaved} picks saved.`);

  return { marketsAnalyzed: markets.length, picksSaved };
}
