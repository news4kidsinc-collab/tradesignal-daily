import robinhoodUniverseData from "@/data/robinhood-universe.json";

export type RobinhoodUniverseFile = {
  generatedAt: string;
  source: string;
  approximationNote: string;
  count: number;
  symbols: string[];
};

export const robinhoodUniverse = robinhoodUniverseData as RobinhoodUniverseFile;

// Broad Robinhood-compatible US stock/ETF research universe.
// Robinhood does not publish a complete official public equities symbol file.
// Run `npm run update:universe` with FMP_API_KEY to regenerate this list from a
// current US-tradable stock/ETF provider list.
export const robinhoodResearchUniverse = robinhoodUniverse.symbols;

// Default daily scan universe. Keep this smaller than the full universe so free
// API plans do not get exhausted. Increase MAX_SCAN_TICKERS or set TRADE_TICKERS
// in .env.local / Netlify / GitHub Actions when you are ready to scan more.
export const researchUniverse = robinhoodResearchUniverse.slice(0, 75);
