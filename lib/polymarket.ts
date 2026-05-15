import { Chain, ClobClient } from '@polymarket/clob-client-v2';

export type PolymarketMarket = {
  id: string;
  question: string;
  outcomePrices: Record<string, number>;
  volume: number;
  endDate: string;
};

const GAMMA_MARKETS_URL = 'https://gamma-api.polymarket.com/markets';

function normalizePrice(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseOutcomePrices(raw: any): Record<string, number> {
  if (!raw || typeof raw !== 'object') {
    return { YES: 0, NO: 0 };
  }

  return {
    YES: normalizePrice(raw.yes ?? raw.YES ?? raw.yesPrice ?? raw?.yes_price),
    NO: normalizePrice(raw.no ?? raw.NO ?? raw.noPrice ?? raw?.no_price),
  };
}

export async function fetchMarkets(): Promise<PolymarketMarket[]> {
  const params = new URLSearchParams({
    active: 'true',
    volume_num_min: '10000',
    order: 'volume',
    ascending: 'false',
    limit: '20',
  });

  const response = await fetch(`${GAMMA_MARKETS_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Polymarket API request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const markets = Array.isArray(payload.markets) ? payload.markets : Array.isArray(payload) ? payload : [];
  const now = Date.now();

  return markets
    .map((market: any) => {
      const endDateValue = market.endDate ?? market.end_time ?? market.closesAt ?? market.closeTime ?? market.close_at;
      const endDate = typeof endDateValue === 'string' ? new Date(endDateValue) : new Date(endDateValue);
      return {
        id: String(market.id),
        question: String(market.question ?? market.title ?? market.name ?? ''),
        outcomePrices: parseOutcomePrices(market.outcomePrices ?? market.outcome_prices ?? market.price ?? {}),
        volume: Number(market.volume ?? market.volume_num ?? 0),
        endDate: endDate.toISOString(),
        rawEndDate: endDate,
      } as PolymarketMarket & { rawEndDate: Date };
    })
    .filter((market: PolymarketMarket & { rawEndDate: Date }) => {
      const endDate = new Date(market.endDate);
      const elapsedMs = endDate.getTime() - now;
      const daysLeft = elapsedMs / (1000 * 60 * 60 * 24);
      return daysLeft >= 1 && daysLeft <= 7;
    })
    .map(({ rawEndDate, ...market }: { rawEndDate: Date } & PolymarketMarket) => ({
      ...market,
      endDate: rawEndDate.toISOString(),
    }));
}

export function attachBuilderCode(order: Record<string, unknown>): Record<string, unknown> {
  return {
    ...order,
    builderCode: process.env.POLY_BUILDER_CODE ?? '',
  };
}

export function createPolymarketClient() {
  const apiKey = process.env.POLY_API_KEY;
  const apiSecret = process.env.POLY_API_SECRET;
  const passphrase = process.env.POLY_API_PASSPHRASE;
  const builderCode = process.env.POLY_BUILDER_CODE ?? '';

  if (!apiKey || !apiSecret || !passphrase) {
    throw new Error('Missing POLY_API_KEY, POLY_API_SECRET, or POLY_API_PASSPHRASE');
  }

  return new ClobClient({
    host: 'https://api.polymarket.com',
    chain: Chain.POLYGON,
    creds: {
      key: apiKey,
      secret: apiSecret,
      passphrase,
    },
    builderConfig: {
      builderCode,
    },
    throwOnError: true,
  });
}
