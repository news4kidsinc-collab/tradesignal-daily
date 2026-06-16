#!/usr/bin/env python3
"""
Build a broad Robinhood-compatible ticker universe for research.

Important limitation:
Robinhood does not publish a complete official public equities symbol file. This
script uses Financial Modeling Prep's stock list as the source of truth, filters
for US exchanges and common stock/ETF-style securities, and writes a searchable
research universe to data/robinhood-universe.json.

Required:
  FMP_API_KEY

Optional:
  UNIVERSE_MAX_SYMBOLS   default 2500
  UNIVERSE_MIN_PRICE     default 0.50
  INCLUDE_ETFS           default true
"""

from __future__ import annotations

import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "robinhood-universe.json"
FMP_BASE = "https://financialmodelingprep.com/stable"
US_EXCHANGES = {"NASDAQ", "NYSE", "AMEX", "NYSEARCA", "BATS"}
SYMBOL_RE = re.compile(r"^[A-Z][A-Z0-9.]{0,5}$")
BAD_NAME_PARTS = (
    "warrant",
    "right",
    "unit",
    "acquisition corp. unit",
    "preferred",
    "pref",
    "depositary share",
)


def request_json(url: str) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": "TradeSignalDailyUniverseBuilder/1.0"})
    with urllib.request.urlopen(req, timeout=60) as response:  # nosec - intended market data request
        return json.loads(response.read().decode("utf-8"))


def fmp(path: str, **params: str) -> Any:
    key = os.environ.get("FMP_API_KEY")
    if not key:
        raise RuntimeError("FMP_API_KEY is required to build the ticker universe")
    params["apikey"] = key
    return request_json(f"{FMP_BASE}/{path}?{urllib.parse.urlencode(params)}")


def is_eligible(row: dict[str, Any], min_price: float, include_etfs: bool) -> bool:
    symbol = str(row.get("symbol") or "").upper().strip()
    name = str(row.get("name") or "").lower()
    exchange = str(row.get("exchangeShortName") or row.get("exchange") or "").upper().strip()
    stock_type = str(row.get("type") or "").lower().strip()
    price = row.get("price")

    if not symbol or not SYMBOL_RE.match(symbol):
        return False
    if exchange not in US_EXCHANGES:
        return False
    if any(part in name for part in BAD_NAME_PARTS):
        return False
    if ".W" in symbol or ".U" in symbol or symbol.endswith("W") or symbol.endswith("R"):
        return False
    if stock_type and stock_type not in {"stock", "etf", "fund", "trust"}:
        return False
    if stock_type in {"etf", "fund", "trust"} and not include_etfs:
        return False
    try:
        if price is not None and float(price) < min_price:
            return False
    except (TypeError, ValueError):
        pass
    return True


def main() -> int:
    max_symbols = int(os.environ.get("UNIVERSE_MAX_SYMBOLS") or "2500")
    min_price = float(os.environ.get("UNIVERSE_MIN_PRICE") or "0.50")
    include_etfs = os.environ.get("INCLUDE_ETFS", "true").lower() not in {"0", "false", "no"}

    rows = fmp("stock/list")
    if not isinstance(rows, list):
        raise RuntimeError("FMP stock/list did not return a list")

    selected: list[str] = []
    seen: set[str] = set()
    for row in rows:
        if not isinstance(row, dict):
            continue
        symbol = str(row.get("symbol") or "").upper().strip()
        if symbol in seen:
            continue
        if is_eligible(row, min_price=min_price, include_etfs=include_etfs):
            selected.append(symbol)
            seen.add(symbol)

    selected.sort()
    selected = selected[:max_symbols]

    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "source": "Financial Modeling Prep stock/list filtered for US stock/ETF-style symbols. Robinhood exact equities universe is not published as a complete official public list.",
        "approximationNote": "Use as a Robinhood-compatible research universe, then verify tradeability inside Robinhood before acting. Some tickers may be unavailable, recently delisted, restricted, or not supported by your account.",
        "count": len(selected),
        "symbols": selected,
    }

    OUTPUT.write_text(json.dumps(payload, indent=2) + "\n")
    print(f"Wrote {len(selected)} symbols to {OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
