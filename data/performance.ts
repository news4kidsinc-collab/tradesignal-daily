export type BacktestRow = {
  period: string;
  sampleSize: string;
  winRate: string;
  averageGain: string;
  averageLoss: string;
  notes: string;
};

// These rows are intentionally synthetic sample results for UI demonstration only.
// A production site should publish real methodology, assumptions, fills, slippage,
// spread costs, rejected trades, and a clear audit log.
export const sampleBacktest: BacktestRow[] = [
  {
    period: "Last 30 market sessions",
    sampleSize: "150 sample research signals",
    winRate: "56.7%",
    averageGain: "+2.4%",
    averageLoss: "-1.3%",
    notes: "Synthetic example using target/stop assumptions; no live brokerage fills."
  },
  {
    period: "Last 90 market sessions",
    sampleSize: "450 sample research signals",
    winRate: "53.8%",
    averageGain: "+2.1%",
    averageLoss: "-1.4%",
    notes: "Does not include commissions, tax impact, slippage, borrow issues, or late entries."
  },
  {
    period: "Volatile sessions only",
    sampleSize: "110 sample research signals",
    winRate: "49.1%",
    averageGain: "+3.0%",
    averageLoss: "-1.9%",
    notes: "Higher volatility increased both opportunity and drawdown risk."
  }
];
