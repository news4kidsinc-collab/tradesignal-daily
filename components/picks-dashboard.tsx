"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowUpDown, DatabaseZap, Grid2X2, Search, Table2 } from "lucide-react";
import { latestPicksSnapshot } from "@/data/picks";
import type { PicksSnapshot, TradePick } from "@/types/market";
import { formatCurrency, formatPercent, robinhoodStockUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PickCard } from "@/components/pick-card";
import { TermExplainer } from "@/components/term-explainer";
import { UpdatePicksButton } from "@/components/update-picks-button";

const sorters = {
  rank: (a: TradePick, b: TradePick) => a.rank - b.rank,
  overall: (a: TradePick, b: TradePick) => b.overallScore - a.overallScore,
  sentiment: (a: TradePick, b: TradePick) => b.sentimentScore - a.sentimentScore,
  technical: (a: TradePick, b: TradePick) => b.technicalScore - a.technicalScore,
  momentum: (a: TradePick, b: TradePick) => b.momentumScore - a.momentumScore,
  volume: (a: TradePick, b: TradePick) => b.volumeScore - a.volumeScore,
  price: (a: TradePick, b: TradePick) => a.price - b.price,
  change: (a: TradePick, b: TradePick) => b.changePercent - a.changePercent
};

type SortKey = keyof typeof sorters;
type ViewMode = "cards" | "table";

export function PicksDashboard() {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [snapshot, setSnapshot] = useState<PicksSnapshot>(latestPicksSnapshot);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPicks(refresh = false) {
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await fetch(`/api/picks${refresh ? "?refresh=1" : ""}`, { cache: refresh ? "no-store" : "default" });
      if (!response.ok) throw new Error(`Live data request failed (${response.status})`);
      const payload = (await response.json()) as PicksSnapshot;
      setSnapshot(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load live picks");
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void loadPicks(false);
  }, []);

  const filteredPicks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return snapshot.picks
      .filter((pick) => {
        if (!normalized) return true;
        return [pick.ticker, pick.companyName, pick.sector, pick.riskLevel, ...pick.catalystTags, ...pick.factors.map((factor) => `${factor.name} ${factor.direction}`)]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      })
      .sort(sorters[sortKey]);
  }, [query, sortKey, snapshot.picks]);

  const isLive = snapshot.dataStatus === "live";

  return (
    <section id="picks" className="border-t border-white/10 bg-slate-950/40 py-20">
      <div className="container">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Badge variant={isLive ? "success" : "warning"} className="mb-4">
              {isLive ? "Live Daily Research Pull" : "Fallback / cached data"}
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Today&apos;s 5 research-ranked trade ideas</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              As of {new Date(snapshot.asOf).toLocaleString()} · {snapshot.marketSession}. {snapshot.dataDelayNote}
            </p>
            <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-400">{snapshot.providerNote}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
            <TermExplainer />
            <UpdatePicksButton onRefresh={() => void loadPicks(true)} isRefreshing={isRefreshing} />
          </div>
        </div>

        {!isLive && (
          <div className="mb-6 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm leading-6 text-amber-50">
            <div className="mb-1 flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" /> API keys required for real daily data
            </div>
            Add <code className="rounded bg-slate-950 px-1.5 py-0.5">FMP_API_KEY</code> in <code className="rounded bg-slate-950 px-1.5 py-0.5">.env.local</code> locally and in Netlify environment variables. Add <code className="rounded bg-slate-950 px-1.5 py-0.5">ALPHA_VANTAGE_API_KEY</code> for an external news sentiment overlay.
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

        <div className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
          <label className="relative block">
            <span className="sr-only">Search picks</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter by ticker, sector, factor, Good/Bad influence, or catalyst..."
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-ring"
            />
          </label>

          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-muted-foreground">
            <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Sort</span>
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              className="bg-transparent text-foreground outline-none"
              aria-label="Sort picks"
            >
              <option className="bg-slate-950" value="rank">Recommended rank</option>
              <option className="bg-slate-950" value="overall">Overall score</option>
              <option className="bg-slate-950" value="sentiment">News sentiment</option>
              <option className="bg-slate-950" value="technical">Technical score</option>
              <option className="bg-slate-950" value="momentum">Momentum score</option>
              <option className="bg-slate-950" value="volume">Volume score</option>
              <option className="bg-slate-950" value="price">Lowest price</option>
              <option className="bg-slate-950" value="change">Largest change</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-slate-950/70 p-1" role="group" aria-label="Choose pick view">
            <Button type="button" size="sm" variant={viewMode === "cards" ? "default" : "ghost"} onClick={() => setViewMode("cards")}>
              <Grid2X2 className="h-4 w-4" aria-hidden="true" /> Cards
            </Button>
            <Button type="button" size="sm" variant={viewMode === "table" ? "default" : "ghost"} onClick={() => setViewMode("table")}>
              <Table2 className="h-4 w-4" aria-hidden="true" /> Table
            </Button>
          </div>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-3">
          <SnapshotMetric label="Universe scanned" value={snapshot.universe.length.toString()} />
          <SnapshotMetric label="Displayed ideas" value={snapshot.picks.length.toString()} />
          <SnapshotMetric label="Data mode" value={snapshot.dataStatus.toUpperCase()} icon={<DatabaseZap className="h-4 w-4" />} />
        </div>

        {viewMode === "cards" ? (
          <motion.div layout className="grid gap-5 lg:grid-cols-2">
            {filteredPicks.map((pick) => (
              <motion.div key={pick.ticker} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
                <PickCard pick={pick} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <PickTable picks={filteredPicks} />
        )}
      </div>
    </section>
  );
}

function SnapshotMetric({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="mt-1 text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function PickTable({ picks }: { picks: TradePick[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <caption className="sr-only">Sortable daily trade research picks</caption>
          <thead className="border-b border-white/10 bg-slate-950/80 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Ticker</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Change</th>
              <th className="px-4 py-3">Entry</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Stop</th>
              <th className="px-4 py-3">Influence summary</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {picks.map((pick) => (
              <tr key={pick.ticker} className="border-b border-white/10 last:border-0">
                <td className="px-4 py-4">
                  <div className="font-semibold">{pick.ticker}</div>
                  <div className="text-xs text-muted-foreground">{pick.companyName}</div>
                </td>
                <td className="px-4 py-4 font-semibold">{formatCurrency(pick.price)}</td>
                <td className={pick.changePercent >= 0 ? "px-4 py-4 text-emerald-300" : "px-4 py-4 text-red-300"}>{formatPercent(pick.changePercent)}</td>
                <td className="px-4 py-4">{pick.entryRange}</td>
                <td className="px-4 py-4">{pick.profitTarget}</td>
                <td className="px-4 py-4">{pick.stopLoss}</td>
                <td className="px-4 py-4 text-xs text-muted-foreground">
                  {pick.factors.map((factor) => `${factor.name}: ${factor.direction}`).join(" · ")}
                </td>
                <td className="px-4 py-4 font-semibold">{pick.overallScore}</td>
                <td className="px-4 py-4">
                  <Button asChild size="sm" variant="success">
                    <a href={pick.robinhoodUrl || robinhoodStockUrl(pick.ticker)} target="_blank" rel="noreferrer noopener">
                      Robinhood
                    </a>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-white/10 p-4 text-xs leading-6 text-amber-100/85">
        Table view is for research comparison only. It is not investment advice, a solicitation, or a promise of profit.
      </p>
    </div>
  );
}
