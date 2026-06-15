export type FmpQuote = {
  symbol: string;
  name?: string;
  price?: number;
  changePercentage?: number;
  changesPercentage?: number;
  change?: number;
  volume?: number;
  avgVolume?: number;
  dayHigh?: number;
  dayLow?: number;
  open?: number;
  previousClose?: number;
  yearHigh?: number;
  yearLow?: number;
  marketCap?: number;
  exchange?: string;
};

export type FmpProfile = {
  symbol: string;
  companyName?: string;
  sector?: string;
  industry?: string;
  beta?: number;
  mktCap?: number;
};

export type FmpHistoricalBar = {
  symbol?: string;
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  price?: number;
  volume?: number;
  vwap?: number;
  change?: number;
  changePercent?: number;
};

export type FmpNewsItem = {
  symbol?: string;
  publishedDate?: string;
  publisher?: string;
  title?: string;
  text?: string;
  site?: string;
  url?: string;
};

const FMP_BASE = "https://financialmodelingprep.com/stable";

function apiKey() {
  return process.env.FMP_API_KEY;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { next: { revalidate: 300 } });
  if (!response.ok) {
    throw new Error(`FMP request failed ${response.status}: ${response.statusText}`);
  }
  return (await response.json()) as T;
}

export function hasFmpKey() {
  return Boolean(apiKey());
}

export async function getFmpQuote(symbol: string) {
  if (!apiKey()) throw new Error("Missing FMP_API_KEY");
  const url = `${FMP_BASE}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey()}`;
  const rows = await fetchJson<FmpQuote[]>(url);
  return rows?.[0];
}

export async function getFmpProfile(symbol: string) {
  if (!apiKey()) throw new Error("Missing FMP_API_KEY");
  const url = `${FMP_BASE}/profile?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey()}`;
  const rows = await fetchJson<FmpProfile[]>(url);
  return rows?.[0];
}

export async function getFmpHistorical(symbol: string, days = 45) {
  if (!apiKey()) throw new Error("Missing FMP_API_KEY");
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - Math.max(days, 30));
  const from = start.toISOString().slice(0, 10);
  const to = end.toISOString().slice(0, 10);
  const url = `${FMP_BASE}/historical-price-eod/full?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}&apikey=${apiKey()}`;
  const rows = await fetchJson<FmpHistoricalBar[]>(url);
  return Array.isArray(rows) ? rows : [];
}

export async function getFmpNews(symbol: string) {
  if (!apiKey()) throw new Error("Missing FMP_API_KEY");
  const url = `${FMP_BASE}/news/stock?symbols=${encodeURIComponent(symbol)}&limit=8&apikey=${apiKey()}`;
  const rows = await fetchJson<FmpNewsItem[]>(url);
  return Array.isArray(rows) ? rows : [];
}
