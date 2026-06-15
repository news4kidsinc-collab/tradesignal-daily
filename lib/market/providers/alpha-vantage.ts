export type AlphaNewsItem = {
  title?: string;
  summary?: string;
  source?: string;
  url?: string;
  time_published?: string;
  overall_sentiment_score?: number;
  overall_sentiment_label?: string;
  ticker_sentiment?: Array<{
    ticker?: string;
    relevance_score?: string;
    ticker_sentiment_score?: string;
    ticker_sentiment_label?: string;
  }>;
};

export type AlphaNewsResponse = {
  feed?: AlphaNewsItem[];
  Information?: string;
  Note?: string;
};

const ALPHA_BASE = "https://www.alphavantage.co/query";

function apiKey() {
  return process.env.ALPHA_VANTAGE_API_KEY;
}

export function hasAlphaVantageKey() {
  return Boolean(apiKey());
}

async function fetchAlpha<T>(params: URLSearchParams): Promise<T> {
  if (!apiKey()) throw new Error("Missing ALPHA_VANTAGE_API_KEY");
  params.set("apikey", apiKey() as string);
  const response = await fetch(`${ALPHA_BASE}?${params.toString()}`, { next: { revalidate: 300 } });
  if (!response.ok) {
    throw new Error(`Alpha Vantage request failed ${response.status}: ${response.statusText}`);
  }
  return (await response.json()) as T;
}

export async function getAlphaNewsSentiment(symbol: string) {
  const params = new URLSearchParams({
    function: "NEWS_SENTIMENT",
    tickers: symbol,
    sort: "LATEST",
    limit: "10"
  });
  return fetchAlpha<AlphaNewsResponse>(params);
}

export function alphaSentimentToScore(symbol: string, response?: AlphaNewsResponse) {
  const rows = response?.feed ?? [];
  const tickerScores = rows
    .flatMap((item) => item.ticker_sentiment ?? [])
    .filter((item) => item.ticker?.toUpperCase() === symbol.toUpperCase())
    .map((item) => Number(item.ticker_sentiment_score))
    .filter((score) => Number.isFinite(score));

  if (!tickerScores.length) return undefined;
  const avg = tickerScores.reduce((sum, score) => sum + score, 0) / tickerScores.length;
  // Alpha Vantage sentiment is typically around -1 to +1. Convert to 0-100.
  return Math.max(0, Math.min(100, Math.round((avg + 1) * 50)));
}
