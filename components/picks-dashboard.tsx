"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowUpDown, DatabaseZap, ExternalLink, Grid2X2, ListFilter, Search, Star, Table2, X } from "lucide-react";
import { latestPicksSnapshot } from "@/data/picks";
import { robinhoodUniverse } from "@/data/ticker-universe";
import type { DataProvider, PicksSnapshot, TradePick } from "@/types/market";
import { formatCurrency, formatPercent, robinhoodStockUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FavoriteTickerButton } from "@/components/favorite-ticker-button";
import { PickCard } from "@/components/pick-card";
import { TermExplainer } from "@/components/term-explainer";
import { TopFollowPanel } from "@/components/top-follow-panel";
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
type ViewMode = "cards" | "table" | "research" | "tickers";
type ManualProvider = Extract<DataProvider, "fmp" | "finnhub">;

export function PicksDashboard() {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [snapshot, setSnapshot] = useState<PicksSnapshot>(latestPicksSnapshot);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualProvider, setManualProvider] = useState<ManualProvider>("finnhub");
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [symbolInput, setSymbolInput] = useState("");

  async function loadPicks(refresh = false, manual?: { symbols?: string[]; provider?: ManualProvider }) {
    setIsRefreshing(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (refresh) params.set("refresh", "1");
      if (manual?.provider) params.set("provider", manual.provider);
      if (manual?.symbols?.length) params.set("symbols", manual.symbols.join(","));
      const queryString = params.toString();
      const response = await fetch(`/api/picks${queryString ? `?${queryString}` : ""}`, { cache: refresh ? "no-store" : "default" });
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

  const manualLimit = manualProvider === "finnhub" ? 5 : 3;

  function addSymbol(symbol: string) {
    const normalized = symbol.trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(normalized)) return;
    setSelectedSymbols((current) => {
      if (current.includes(normalized) || current.length >= manualLimit) return current;
      return [...current, normalized];
    });
    setSymbolInput("");
  }

  function removeSymbol(symbol: string) {
    setSelectedSymbols((current) => current.filter((item) => item !== symbol));
  }

  function scanSelectedSymbols() {
    if (!selectedSymbols.length) return;
    void loadPicks(true, { provider: manualProvider, symbols: selectedSymbols.slice(0, manualLimit) });
    setViewMode("cards");
  }

  const allCandidates = snapshot.candidates?.length ? snapshot.candidates : snapshot.picks;
  const visibleList = viewMode === "research" ? allCandidates : snapshot.picks;

  const filteredPicks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return visibleList
      .filter((pick) => {
        if (!normalized) return true;
        return [
          pick.ticker,
          pick.companyName,
          pick.sector,
          pick.riskLevel,
          pick.selectionNote ?? "",
          ...pick.catalystTags,
          ...pick.factors.map((factor) => `${factor.name} ${factor.direction}`)
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      })
      .sort(sorters[sortKey]);
  }, [query, sortKey, visibleList]);

  const filteredUniverse = useMemo(() => {
    const normalized = query.trim().toUpperCase();
    const symbols = robinhoodUniverse.symbols;
    if (!normalized) return symbols;
    return symbols.filter((symbol) => symbol.includes(normalized));
  }, [query]);

  useEffect(() => {
    setSelectedSymbols((current) => current.slice(0, manualLimit));
  }, [manualLimit]);

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
            {snapshot.researchNote && (
              <p className="mt-2 max-w-3xl rounded-xl border border-teal-300/20 bg-teal-300/10 px-3 py-2 text-xs leading-5 text-teal-50">
                {snapshot.researchNote}
              </p>
            )}
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
            Add <code className="rounded bg-slate-950 px-1.5 py-0.5">FINNHUB_API_KEY</code> for 5-symbol manual scans or <code className="rounded bg-slate-950 px-1.5 py-0.5">FMP_API_KEY</code> for the original 3-symbol/FMP mode. Add <code className="rounded bg-slate-950 px-1.5 py-0.5">ALPHA_VANTAGE_API_KEY</code> only if you want the optional external news sentiment overlay.
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

        <TopFollowPanel candidates={allCandidates} />

        <ManualSymbolScanner
          provider={manualProvider}
          onProviderChange={setManualProvider}
          selectedSymbols={selectedSymbols}
          symbolInput={symbolInput}
          onSymbolInputChange={setSymbolInput}
          onAddSymbol={addSymbol}
          onRemoveSymbol={removeSymbol}
          onScan={scanSelectedSymbols}
          isRefreshing={isRefreshing}
          limit={manualLimit}
        />

        <div className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
          <label className="relative block">
            <span className="sr-only">Search picks or tickers</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={viewMode === "tickers" ? "Search the ticker directory..." : "Filter by ticker, sector, factor, Good/Bad influence, or catalyst..."}
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
              disabled={viewMode === "tickers"}
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

          <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-slate-950/70 p-1 sm:grid-cols-4" role="group" aria-label="Choose pick view">
            <Button type="button" size="sm" variant={viewMode === "cards" ? "default" : "ghost"} onClick={() => setViewMode("cards")}>
              <Grid2X2 className="h-4 w-4" aria-hidden="true" /> Cards
            </Button>
            <Button type="button" size="sm" variant={viewMode === "table" ? "default" : "ghost"} onClick={() => setViewMode("table")}>
              <Table2 className="h-4 w-4" aria-hidden="true" /> Top 5
            </Button>
            <Button type="button" size="sm" variant={viewMode === "research" ? "default" : "ghost"} onClick={() => setViewMode("research")}>
              <ListFilter className="h-4 w-4" aria-hidden="true" /> Full Scan
            </Button>
            <Button type="button" size="sm" variant={viewMode === "tickers" ? "default" : "ghost"} onClick={() => setViewMode("tickers")}>
              <Star className="h-4 w-4" aria-hidden="true" /> Tickers
            </Button>
          </div>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-5">
          <SnapshotMetric label="Universe requested" value={snapshot.universe.length.toString()} />
          <SnapshotMetric label="Analyzed candidates" value={allCandidates.length.toString()} />
          <SnapshotMetric label="Displayed ideas" value={snapshot.picks.length.toString()} />
          <SnapshotMetric label="Ticker directory" value={robinhoodUniverse.count.toString()} />
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
        ) : viewMode === "tickers" ? (
          <TickerDirectory symbols={filteredUniverse} candidateMap={new Map(allCandidates.map((candidate) => [candidate.ticker.toUpperCase(), candidate]))} />
        ) : (
          <PickTable picks={filteredPicks} showSelection={viewMode === "research"} />
        )}
      </div>
    </section>
  );
}

function ManualSymbolScanner({
  provider,
  onProviderChange,
  selectedSymbols,
  symbolInput,
  onSymbolInputChange,
  onAddSymbol,
  onRemoveSymbol,
  onScan,
  isRefreshing,
  limit
}: {
  provider: ManualProvider;
  onProviderChange: (provider: ManualProvider) => void;
  selectedSymbols: string[];
  symbolInput: string;
  onSymbolInputChange: (value: string) => void;
  onAddSymbol: (symbol: string) => void;
  onRemoveSymbol: (symbol: string) => void;
  onScan: () => void;
  isRefreshing: boolean;
  limit: number;
}) {
  const normalized = symbolInput.trim().toUpperCase();
  const suggestions = useMemo(() => {
    if (!normalized) return robinhoodUniverse.symbols.slice(0, 12);
    return robinhoodUniverse.symbols
      .filter((symbol) => symbol.includes(normalized) && !selectedSymbols.includes(symbol))
      .slice(0, 12);
  }, [normalized, selectedSymbols]);

  const canAdd = Boolean(normalized) && selectedSymbols.length < limit && !selectedSymbols.includes(normalized);
  const providerLabel = provider === "finnhub" ? "Finnhub · up to 5 symbols" : "FMP/Alpha · up to 3 symbols";

  return (
    <div className="mb-6 rounded-2xl border border-teal-300/20 bg-teal-300/[0.06] p-4 shadow-glow">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="success">Manual research scan</Badge>
            <span className="text-xs font-semibold text-teal-100">{providerLabel}</span>
          </div>
          <h3 className="text-lg font-semibold text-white">Choose exactly which symbols to scan</h3>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
            Search the ticker directory, select symbols, then run a focused scan. This prevents API overuse and lets you compare the stocks you personally want to study. Finnhub mode is capped at 5 selected symbols; FMP/Alpha mode is capped at 3 selected symbols.
          </p>
        </div>

        <label className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-muted-foreground">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">Provider</span>
          <select
            value={provider}
            onChange={(event) => onProviderChange(event.target.value as ManualProvider)}
            className="w-full bg-transparent text-foreground outline-none"
            aria-label="Manual scan provider"
          >
            <option className="bg-slate-950" value="finnhub">Finnhub: 5 symbols</option>
            <option className="bg-slate-950" value="fmp">FMP/Alpha: 3 symbols</option>
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <label className="relative block">
            <span className="sr-only">Enter ticker symbol</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              value={symbolInput}
              onChange={(event) => onSymbolInputChange(event.target.value.toUpperCase())}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onAddSymbol(normalized);
                }
              }}
              placeholder="Type a ticker, example: SOFI, PLTR, TSLA..."
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-ring"
            />
          </label>

          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((symbol) => (
              <button
                key={symbol}
                type="button"
                onClick={() => onAddSymbol(symbol)}
                disabled={selectedSymbols.length >= limit}
                className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-teal-300/50 hover:text-teal-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 md:justify-end">
          <Button type="button" variant="outline" onClick={() => onAddSymbol(normalized)} disabled={!canAdd}>
            Add symbol
          </Button>
          <Button type="button" variant="success" onClick={onScan} disabled={!selectedSymbols.length || isRefreshing}>
            {isRefreshing ? "Scanning..." : `Scan ${selectedSymbols.length || 0}`}
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Selected {selectedSymbols.length}/{limit}:</span>
        {selectedSymbols.length ? (
          selectedSymbols.map((symbol) => (
            <span key={symbol} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/80 px-3 py-1 text-xs font-bold text-white">
              {symbol}
              <button type="button" onClick={() => onRemoveSymbol(symbol)} className="text-slate-400 hover:text-red-200" aria-label={`Remove ${symbol}`}>
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-xs text-slate-500">No manual symbols selected yet.</span>
        )}
      </div>
    </div>
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

function TickerDirectory({ symbols, candidateMap }: { symbols: string[]; candidateMap: Map<string, TradePick> }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
      <div className="border-b border-white/10 p-4">
        <h3 className="text-lg font-semibold text-white">Robinhood-compatible ticker directory</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Showing {symbols.length} matching symbols from a {robinhoodUniverse.count}-symbol seed universe. Run <code className="rounded bg-slate-950 px-1 py-0.5">npm run update:universe</code> with FMP_API_KEY to regenerate a larger current research universe.
        </p>
      </div>
      <div className="grid max-h-[650px] gap-2 overflow-y-auto p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {symbols.map((symbol) => {
          const match = candidateMap.get(symbol);
          return (
            <div key={symbol} className="rounded-xl border border-white/10 bg-slate-950/55 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-base font-bold text-white">{symbol}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {match ? `${match.companyName} · Score ${match.overallScore}` : "Not in current scan"}
                  </div>
                </div>
                <FavoriteTickerButton ticker={symbol} compact />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                {match ? <Badge variant={match.selected ? "success" : "outline"}>{match.selected ? `Top ${match.rank}` : `Rank ${match.rank}`}</Badge> : <Badge variant="outline">Directory</Badge>}
                <a className="inline-flex items-center gap-1 text-xs font-semibold text-teal-300 hover:text-teal-200" href={robinhoodStockUrl(symbol)} target="_blank" rel="noreferrer noopener">
                  Robinhood <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
      <p className="border-t border-white/10 p-4 text-xs leading-6 text-amber-100/85">
        Verify every ticker inside Robinhood before acting. Availability can vary by security, account type, restrictions, delistings, and provider data freshness.
      </p>
    </div>
  );
}

function PickTable({ picks, showSelection = false }: { picks: TradePick[]; showSelection?: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1400px] text-left text-sm">
          <caption className="sr-only">Sortable daily trade research picks</caption>
          <thead className="border-b border-white/10 bg-slate-950/80 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Follow</th>
              <th className="px-4 py-3">Ticker</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Change</th>
              <th className="px-4 py-3">Entry</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Stop</th>
              <th className="px-4 py-3">Influence summary</th>
              <th className="px-4 py-3">Score</th>
              {showSelection && <th className="px-4 py-3">Selection reason</th>}
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {picks.map((pick) => (
              <tr key={pick.ticker} className="border-b border-white/10 last:border-0">
                <td className="px-4 py-4"><FavoriteTickerButton ticker={pick.ticker} compact /></td>
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
                {showSelection && (
                  <td className="px-4 py-4 text-xs leading-5 text-muted-foreground">
                    <span className={pick.selected ? "font-semibold text-emerald-300" : "font-semibold text-slate-300"}>
                      {pick.selected ? "Selected" : "Not selected"}
                    </span>
                    <br />
                    {pick.selectionNote ?? "No selection note available."}
                  </td>
                )}
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
        Table view is for research comparison only. Full Scan shows every analyzed candidate so you can study which factors helped or hurt each ticker. It is not investment advice, a solicitation, or a promise of profit.
      </p>
    </div>
  );
}
