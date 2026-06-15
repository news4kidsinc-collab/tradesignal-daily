import latestSnapshot from "@/data/latest-picks.json";
import type { PicksSnapshot, TradePick } from "@/types/market";

// This file now exposes the most recent generated fallback snapshot.
// The live site calls /api/picks so API keys remain server-side.
export const latestPicksSnapshot = latestSnapshot as PicksSnapshot;
export const picksAsOf = latestPicksSnapshot.asOf;
export const dailyPicks: TradePick[] = latestPicksSnapshot.picks;
export type { DataStatus, FactorDirection, InfluenceFactor, PicksSnapshot, RiskLevel, TradePick } from "@/types/market";
