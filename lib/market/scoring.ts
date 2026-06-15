import type { FactorDirection, InfluenceFactor, RiskLevel } from "@/types/market";
import { FACTOR_WEIGHTS } from "@/lib/market/config";

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function formatDollars(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export function scoreDirection(score: number): FactorDirection {
  if (score >= 62) return "Good";
  if (score <= 42) return "Bad";
  return "Neutral";
}

export function riskFromScore(overallScore: number, price: number, relativeVolume = 1): RiskLevel {
  if (price < 10 || relativeVolume > 2.5 || overallScore < 50) return "Speculative";
  if (overallScore >= 70 && price >= 10) return "Balanced";
  return "Aggressive";
}

export function calculateRsi(closes: number[], period = 14): number | undefined {
  if (closes.length <= period) return undefined;
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i += 1) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  let averageGain = gains / period;
  let averageLoss = losses / period;

  for (let i = period + 1; i < closes.length; i += 1) {
    const change = closes[i] - closes[i - 1];
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);
    averageGain = (averageGain * (period - 1) + gain) / period;
    averageLoss = (averageLoss * (period - 1) + loss) / period;
  }

  if (averageLoss === 0) return 100;
  const rs = averageGain / averageLoss;
  return 100 - 100 / (1 + rs);
}

export function scoreRsi(rsi?: number) {
  if (rsi === undefined || Number.isNaN(rsi)) return 50;
  if (rsi >= 45 && rsi <= 68) return 85;
  if (rsi > 68 && rsi <= 75) return 62;
  if (rsi > 75) return 38;
  if (rsi >= 35 && rsi < 45) return 58;
  return 35;
}

export function scoreMomentum(changePercent: number) {
  if (changePercent >= 0.75 && changePercent <= 5.5) return clamp(58 + changePercent * 7);
  if (changePercent > 5.5 && changePercent <= 9) return 68;
  if (changePercent > 9) return 42;
  if (changePercent > -0.75) return 50;
  return clamp(45 + changePercent * 3);
}

export function scoreRelativeVolume(relativeVolume?: number) {
  if (!relativeVolume || Number.isNaN(relativeVolume)) return 50;
  if (relativeVolume >= 1.5 && relativeVolume <= 3.5) return clamp(65 + (relativeVolume - 1.5) * 10);
  if (relativeVolume > 3.5) return 70;
  if (relativeVolume >= 1.0) return 58;
  return 38;
}

const positiveWords = [
  "beats",
  "beat",
  "raises",
  "upgrade",
  "upgraded",
  "partnership",
  "contract",
  "approval",
  "launch",
  "record",
  "growth",
  "profit",
  "profitable",
  "guidance",
  "buyback",
  "demand",
  "expands"
];

const negativeWords = [
  "misses",
  "miss",
  "downgrade",
  "downgraded",
  "lawsuit",
  "probe",
  "investigation",
  "recall",
  "loss",
  "decline",
  "warning",
  "cuts",
  "layoff",
  "fraud",
  "debt",
  "bankruptcy"
];

export function keywordSentimentScore(texts: string[]) {
  const body = texts.join(" ").toLowerCase();
  let score = 50;
  for (const word of positiveWords) {
    if (body.includes(word)) score += 5;
  }
  for (const word of negativeWords) {
    if (body.includes(word)) score -= 7;
  }
  return clamp(score);
}

export function catalystTagsFromText(texts: string[]) {
  const body = texts.join(" ").toLowerCase();
  const tags = new Set<string>();
  const checks: Array<[string, string[]]> = [
    ["Earnings", ["earnings", "eps", "revenue", "quarter"]],
    ["Analyst action", ["upgrade", "downgrade", "price target", "rating"]],
    ["Partnership", ["partnership", "contract", "deal", "agreement"]],
    ["Product news", ["launch", "product", "platform", "chip", "ai"]],
    ["Regulatory/legal", ["approval", "sec", "lawsuit", "probe", "investigation"]],
    ["Guidance", ["guidance", "forecast", "outlook"]]
  ];

  for (const [tag, words] of checks) {
    if (words.some((word) => body.includes(word))) tags.add(tag);
  }
  return Array.from(tags).slice(0, 4);
}

export function buildTradeLevels(price: number, dayLow?: number, dayHigh?: number) {
  const entryLow = Math.max(dayLow ? dayLow * 1.003 : price * 0.994, price * 0.99);
  const entryHigh = Math.min(dayHigh ? dayHigh * 0.997 : price * 1.006, price * 1.012);
  const targetLow = price * 1.018;
  const targetHigh = price * 1.034;
  const stop = Math.max(price * 0.972, dayLow ? dayLow * 0.992 : price * 0.972);

  return {
    entryRange: `${formatDollars(entryLow)} – ${formatDollars(entryHigh)}`,
    profitTarget: `${formatDollars(targetLow)} – ${formatDollars(targetHigh)}`,
    stopLoss: formatDollars(stop)
  };
}

export function weightedOverall(factors: InfluenceFactor[]) {
  const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
  if (!totalWeight) return 0;
  const weighted = factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0) / totalWeight;
  return Math.round(clamp(weighted));
}

export function weightForFactor(name: keyof typeof FACTOR_WEIGHTS) {
  return FACTOR_WEIGHTS[name];
}
