export type FinnhubQuote = {
  c?: number; // current price
  d?: number; // change
  dp?: number; // percent change
  h?: number; // high
  l?: number; // low
  o?: number; // open
  pc?: number; // previous close
  t?: number;
};

export type FinnhubProfile = {
  ticker?: string;
  name?: string;
  finnhubIndustry?: string;
  marketCapitalization?: number;
  exchange?: string;
};

export type FinnhubCandle = {
  c?: number[];
  h?: number[];
  l?: number[];
  o?: number[];
  s?: string;
  t?: number[];
  v?: number[];
};

export type FinnhubNewsItem = {
  category?: string;
  datetime?: number;
  headline?: string;
  id?: number;
  image?: string;
  related?: string;
  source?: string;
  summary?: string;
  url?: string;
};

const FINNHUB_BASE = "https://finnhub.io/api/v1";

function apiKey() {
  return process.env.FINNHUB_API_KEY;
}

async function fetchJson<T>(path: string, params: Record<string, string | number | undefined>): Promise<T> {
  const key = apiKey();
  if (!key) throw new Error("Missing FINNHUB_API_KEY");

  const url = new URL(`${FINNHUB_BASE}/${path}`);
  Object.entries(params).forEach(([name, value]) => {
    if (value !== undefined && value !== "") url.searchParams.set(name, String(value));
  });
  url.searchParams.set("token", key);

  const response = await fetch(url.toString(), { next: { revalidate: 180 } });
  if (!response.ok) {
    throw new Error(`Finnhub request failed ${response.status}: ${response.statusText}`);
  }
  return (await response.json()) as T;
}

export function hasFinnhubKey() {
  return Boolean(apiKey());
}

export async function getFinnhubQuote(symbol: string) {
  return fetchJson<FinnhubQuote>("quote", { symbol });
}

export async function getFinnhubProfile(symbol: string) {
  return fetchJson<FinnhubProfile>("stock/profile2", { symbol });
}

export async function getFinnhubCandles(symbol: string, days = 75) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const fromSeconds = nowSeconds - Math.max(days, 45) * 24 * 60 * 60;
  return fetchJson<FinnhubCandle>("stock/candle", {
    symbol,
    resolution: "D",
    from: fromSeconds,
    to: nowSeconds
  });
}

export async function getFinnhubCompanyNews(symbol: string) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 14);
  return fetchJson<FinnhubNewsItem[]>("company-news", {
    symbol,
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10)
  });
}
