"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Plus, Star, X } from "lucide-react";
import type { TradePick } from "@/types/market";
import { formatCurrency, robinhoodStockUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { addFavoriteTicker, FAVORITES_EVENT, readFavoriteTickers, removeFavoriteTicker } from "@/components/favorite-ticker-button";

export function TopFollowPanel({ candidates }: { candidates: TradePick[] }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [manualTicker, setManualTicker] = useState("");

  useEffect(() => {
    const sync = () => setFavorites(readFavoriteTickers());
    sync();
    window.addEventListener(FAVORITES_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FAVORITES_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const candidateMap = useMemo(() => new Map(candidates.map((candidate) => [candidate.ticker.toUpperCase(), candidate])), [candidates]);

  function addManualFavorite() {
    const normalized = manualTicker.trim().toUpperCase().replace(/[^A-Z0-9.]/g, "");
    if (!normalized) return;
    addFavoriteTicker(normalized);
    setManualTicker("");
  }

  return (
    <div className="mb-6 rounded-2xl border border-teal-300/20 bg-teal-300/[0.06] p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-teal-50">
            <Star className="h-4 w-4 fill-current text-teal-300" aria-hidden="true" /> Top Follow favorites
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-300">
            Star any ticker from the cards, table, or ticker directory. Favorites are saved in this browser for quick follow-up research.
          </p>
        </div>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="manual-favorite-ticker">Add ticker to favorites</label>
          <input
            id="manual-favorite-ticker"
            value={manualTicker}
            onChange={(event) => setManualTicker(event.target.value.toUpperCase())}
            onKeyDown={(event) => {
              if (event.key === "Enter") addManualFavorite();
            }}
            placeholder="Add ticker"
            className="h-10 w-32 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-foreground placeholder:text-muted-foreground focus-ring"
          />
          <Button type="button" size="sm" variant="success" onClick={addManualFavorite}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add
          </Button>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-slate-950/40 p-4 text-sm text-muted-foreground">
          No favorites saved yet. Click a star beside any ticker to add it here.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {favorites.map((ticker) => {
            const match = candidateMap.get(ticker);
            return (
              <div key={ticker} className="rounded-xl border border-white/10 bg-slate-950/55 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">{ticker}</span>
                      {match ? <Badge variant={match.selected ? "success" : "outline"}>{match.selected ? `Top ${match.rank}` : `Rank ${match.rank}`}</Badge> : <Badge variant="outline">Watch</Badge>}
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{match?.companyName ?? "Saved manual ticker"}</p>
                  </div>
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeFavoriteTicker(ticker)} aria-label={`Remove ${ticker}`}>
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-300">
                  <span>{match ? `${formatCurrency(match.price)} · Score ${match.overallScore}` : "Open in Robinhood to verify"}</span>
                  <a className="inline-flex items-center gap-1 text-teal-300 hover:text-teal-200" href={match?.robinhoodUrl || robinhoodStockUrl(ticker)} target="_blank" rel="noreferrer noopener">
                    Robinhood <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
