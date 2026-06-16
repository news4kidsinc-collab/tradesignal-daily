"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "tradesignal:favorites";
export const FAVORITES_EVENT = "tradesignal:favorites-changed";

export function readFavoriteTickers() {
  if (typeof window === "undefined") return [] as string[];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.map(String).map((item) => item.toUpperCase()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function writeFavoriteTickers(tickers: string[]) {
  if (typeof window === "undefined") return;
  const clean = Array.from(new Set(tickers.map((item) => item.trim().toUpperCase()).filter(Boolean))).sort();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  window.dispatchEvent(new CustomEvent(FAVORITES_EVENT, { detail: clean }));
}

export function addFavoriteTicker(ticker: string) {
  const normalized = ticker.trim().toUpperCase();
  if (!normalized) return;
  writeFavoriteTickers([...readFavoriteTickers(), normalized]);
}

export function removeFavoriteTicker(ticker: string) {
  const normalized = ticker.trim().toUpperCase();
  writeFavoriteTickers(readFavoriteTickers().filter((item) => item !== normalized));
}

export function FavoriteTickerButton({ ticker, compact = false }: { ticker: string; compact?: boolean }) {
  const normalized = ticker.toUpperCase();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const sync = () => setIsFavorite(readFavoriteTickers().includes(normalized));
    sync();
    window.addEventListener(FAVORITES_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FAVORITES_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [normalized]);

  return (
    <Button
      type="button"
      size={compact ? "sm" : "default"}
      variant={isFavorite ? "success" : "outline"}
      onClick={() => (isFavorite ? removeFavoriteTicker(normalized) : addFavoriteTicker(normalized))}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? `Remove ${normalized} from Top Follow` : `Add ${normalized} to Top Follow`}
      title={isFavorite ? `Remove ${normalized} from Top Follow` : `Add ${normalized} to Top Follow`}
    >
      <Star className={isFavorite ? "h-4 w-4 fill-current" : "h-4 w-4"} aria-hidden="true" />
      {compact ? null : isFavorite ? "Following" : "Follow"}
    </Button>
  );
}
