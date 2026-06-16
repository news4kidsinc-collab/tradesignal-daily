import { researchUniverse, robinhoodResearchUniverse } from "@/data/ticker-universe";

export const DEFAULT_UNIVERSE = researchUniverse;
export const FULL_ROBINHOOD_COMPATIBLE_UNIVERSE = robinhoodResearchUniverse;

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getUniverseFromEnv() {
  const raw = process.env.TRADE_TICKERS;
  const maxScan = parsePositiveInt(process.env.MAX_SCAN_TICKERS, 75);

  if (!raw) return DEFAULT_UNIVERSE.slice(0, maxScan);

  if (raw.trim().toUpperCase() === "ALL") {
    return FULL_ROBINHOOD_COMPATIBLE_UNIVERSE.slice(0, maxScan);
  }

  const parsed = raw
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);

  return parsed.length ? parsed.slice(0, maxScan) : DEFAULT_UNIVERSE.slice(0, maxScan);
}

export const FACTOR_WEIGHTS = {
  newsSentiment: 0.22,
  technicals: 0.26,
  volume: 0.22,
  momentum: 0.18,
  operations: 0.12
} as const;
