export type RiskLevel = "Speculative" | "Aggressive" | "Balanced";
export type FactorDirection = "Good" | "Bad" | "Neutral";
export type DataStatus = "live" | "cached" | "fallback" | "error";
export type DataProvider = "auto" | "fmp" | "finnhub";

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
  /** True when this candidate made the displayed Top 5 list. */
  selected?: boolean;
  /** Human-readable reason explaining why it made or missed the Top 5. */
  selectionNote?: string;
};

export type PicksSnapshot = {
  asOf: string;
  marketSession: string;
  dataStatus: DataStatus;
  dataDelayNote: string;
  providerNote: string;
  universe: string[];
  /** The primary Top 5 research ideas. */
  picks: TradePick[];
  /** Full ranked scan, including symbols that did not make the Top 5. */
  candidates?: TradePick[];
  /** Plain-language explanation of the screening behavior for research use. */
  researchNote?: string;
  errors?: string[];
  /** Provider used for this specific scan. */
  providerMode?: DataProvider;
  /** Manual symbols selected by the user for this scan. */
  manualSymbols?: string[];
  /** Maximum symbols allowed for manual scans under the selected provider. */
  manualScanLimit?: number;
};
