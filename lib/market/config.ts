import { researchUniverse } from "@/data/ticker-universe";

export const DEFAULT_UNIVERSE = researchUniverse;

export function getUniverseFromEnv() {
  const raw = process.env.TRADE_TICKERS;
  if (!raw) return DEFAULT_UNIVERSE;
  const parsed = raw
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
  return parsed.length ? parsed : DEFAULT_UNIVERSE;
}

export const FACTOR_WEIGHTS = {
  newsSentiment: 0.22,
  technicals: 0.26,
  volume: 0.22,
  momentum: 0.18,
  operations: 0.12
} as const;
