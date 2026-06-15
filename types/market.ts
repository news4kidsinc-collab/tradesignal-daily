export type RiskLevel = "Speculative" | "Aggressive" | "Balanced";
export type FactorDirection = "Good" | "Bad" | "Neutral";
export type DataStatus = "live" | "cached" | "fallback" | "error";

export type InfluenceFactor = {
  name: string;
  value: string;
  score: number;
  weight: number;
  direction: FactorDirection;
  reason: string;
  source: string;
};

export type TradePick = {
  rank: number;
  ticker: string;
  companyName: string;
  sector: string;
  price: number;
  changePercent: number;
  dayHigh?: number;
  dayLow?: number;
  open?: number;
  previousClose?: number;
  volume?: number;
  avgVolume?: number;
  relativeVolume?: number;
  rsi14?: number;
  vwap?: number;
  sentimentScore: number;
  momentumScore: number;
  volumeScore: number;
  technicalScore: number;
  operationsScore: number;
  overallScore: number;
  riskLevel: RiskLevel;
  entryRange: string;
  profitTarget: string;
  stopLoss: string;
  pullOutGuidance: string;
  rationale: string;
  catalystTags: string[];
  factors: InfluenceFactor[];
  robinhoodUrl: string;
  sources: string[];
};

export type PicksSnapshot = {
  asOf: string;
  marketSession: string;
  dataStatus: DataStatus;
  dataDelayNote: string;
  providerNote: string;
  universe: string[];
  picks: TradePick[];
  errors?: string[];
};
