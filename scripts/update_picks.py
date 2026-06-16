#!/usr/bin/env python3
"""
Daily real-data research automation for TradeSignal Daily.

This script pulls real market/research data when API keys are provided and writes
`data/latest-picks.json`. It is built for personal research, not automated trading.

Required:
  FMP_API_KEY                 Financial Modeling Prep quote/history/profile/news, OR
  FINNHUB_API_KEY             Finnhub quote/candles/profile/news for smaller manual-style scans

Optional:
  DATA_PROVIDER               auto, fmp, or finnhub
  ALPHA_VANTAGE_API_KEY       Alpha Vantage NEWS_SENTIMENT overlay
  TRADE_TICKERS               Comma-separated ticker universe, or ALL
  MAX_SCAN_TICKERS            Limits daily scan size when TRADE_TICKERS=ALL/default
  NETLIFY_BUILD_HOOK_URL      If set, the workflow can trigger a Netlify deploy

Provider notes:
- FMP quote docs describe real-time/up-to-minute quote data, but actual freshness
  depends on your plan and exchange entitlements.
- Alpha Vantage NEWS_SENTIMENT is useful for sentiment/relevance, but free limits
  are tight, so keep the universe small.
"""

from __future__ import annotations

import json
import math
import os
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "latest-picks.json"
UNIVERSE_FILE = ROOT / "data" / "robinhood-universe.json"
FMP_BASE = "https://financialmodelingprep.com/stable"
FINNHUB_BASE = "https://finnhub.io/api/v1"
ALPHA_BASE = "https://www.alphavantage.co/query"
DEFAULT_TICKERS = ["SOFI", "PLTR", "HOOD", "RIVN", "F", "BAC", "INTC", "SNAP", "UBER", "AMD", "LCID", "NIO", "PFE", "T", "WBD", "NU", "VALE", "AAL", "CCL", "JBLU", "DKNG", "OPEN", "MARA", "RIOT", "JOBY", "RKLB", "IONQ", "CHPT", "EVGO", "BBAI", "SOUN", "PATH", "U", "AFRM", "UPST", "LAZR", "QS", "HIMS", "ACHR", "PYPL", "DIS", "TSLA", "NVDA", "AAPL", "MSFT"]

WEIGHTS = {
    "newsSentiment": 0.22,
    "technicals": 0.26,
    "volume": 0.22,
    "momentum": 0.18,
    "operations": 0.12,
}

POSITIVE_WORDS = [
    "beats", "beat", "raises", "upgrade", "upgraded", "partnership", "contract", "approval",
    "launch", "record", "growth", "profit", "profitable", "guidance", "buyback", "demand", "expands",
]
NEGATIVE_WORDS = [
    "misses", "miss", "downgrade", "downgraded", "lawsuit", "probe", "investigation", "recall",
    "loss", "decline", "warning", "cuts", "layoff", "fraud", "debt", "bankruptcy",
]


def request_json(url: str) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": "TradeSignalDailyResearch/1.0"})
    with urllib.request.urlopen(req, timeout=30) as response:  # nosec - intended outbound API request
        return json.loads(response.read().decode("utf-8"))


def fmp(path: str, **params: str) -> Any:
    key = os.environ.get("FMP_API_KEY")
    if not key:
        raise RuntimeError("FMP_API_KEY is required for real data")
    params = {("from" if k == "from_" else k): v for k, v in params.items()}
    params["apikey"] = key
    query = urllib.parse.urlencode(params)
    return request_json(f"{FMP_BASE}/{path}?{query}")



def finnhub(path: str, **params: str | int) -> Any:
    key = os.environ.get("FINNHUB_API_KEY")
    if not key:
        raise RuntimeError("FINNHUB_API_KEY is required for Finnhub data")
    params = {("from" if k == "from_" else k): v for k, v in params.items()}
    params["token"] = key
    query = urllib.parse.urlencode(params)
    return request_json(f"{FINNHUB_BASE}/{path}?{query}")


def selected_provider() -> str:
    requested = (os.environ.get("DATA_PROVIDER") or "auto").strip().lower()
    if requested in {"fmp", "finnhub"}:
        return requested
    if os.environ.get("FINNHUB_API_KEY"):
        return "finnhub"
    return "fmp"


def alpha(params: dict[str, str]) -> Any | None:
    key = os.environ.get("ALPHA_VANTAGE_API_KEY")
    if not key:
        return None
    params = {**params, "apikey": key}
    return request_json(f"{ALPHA_BASE}?{urllib.parse.urlencode(params)}")


def clamp(value: float, low: float = 0, high: float = 100) -> int:
    return int(round(min(high, max(low, value))))


def fmt_money(value: float) -> str:
    return f"${value:,.2f}"


def direction(score: int) -> str:
    if score >= 62:
        return "Good"
    if score <= 42:
        return "Bad"
    return "Neutral"


def calculate_rsi(closes: list[float], period: int = 14) -> float | None:
    if len(closes) <= period:
        return None
    gains = 0.0
    losses = 0.0
    for i in range(1, period + 1):
        change = closes[i] - closes[i - 1]
        gains += max(change, 0)
        losses += max(-change, 0)
    avg_gain = gains / period
    avg_loss = losses / period
    for i in range(period + 1, len(closes)):
        change = closes[i] - closes[i - 1]
        avg_gain = (avg_gain * (period - 1) + max(change, 0)) / period
        avg_loss = (avg_loss * (period - 1) + max(-change, 0)) / period
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100 - 100 / (1 + rs)


def score_rsi(rsi: float | None) -> int:
    if rsi is None or math.isnan(rsi):
        return 50
    if 45 <= rsi <= 68:
        return 85
    if 68 < rsi <= 75:
        return 62
    if rsi > 75:
        return 38
    if 35 <= rsi < 45:
        return 58
    return 35


def score_momentum(change_percent: float) -> int:
    if 0.75 <= change_percent <= 5.5:
        return clamp(58 + change_percent * 7)
    if 5.5 < change_percent <= 9:
        return 68
    if change_percent > 9:
        return 42
    if change_percent > -0.75:
        return 50
    return clamp(45 + change_percent * 3)


def score_relative_volume(relative_volume: float | None) -> int:
    if not relative_volume or math.isnan(relative_volume):
        return 50
    if 1.5 <= relative_volume <= 3.5:
        return clamp(65 + (relative_volume - 1.5) * 10)
    if relative_volume > 3.5:
        return 70
    if relative_volume >= 1.0:
        return 58
    return 38


def keyword_sentiment(texts: list[str]) -> int:
    body = " ".join(texts).lower()
    score = 50
    for word in POSITIVE_WORDS:
        if word in body:
            score += 5
    for word in NEGATIVE_WORDS:
        if word in body:
            score -= 7
    return clamp(score)


def alpha_sentiment_score(symbol: str) -> int | None:
    try:
        payload = alpha({"function": "NEWS_SENTIMENT", "tickers": symbol, "sort": "LATEST", "limit": "10"})
    except Exception as exc:  # noqa: BLE001
        print(f"Alpha Vantage skipped for {symbol}: {exc}", file=sys.stderr)
        return None
    if not payload or not payload.get("feed"):
        return None
    scores: list[float] = []
    for item in payload.get("feed", []):
        for row in item.get("ticker_sentiment", []) or []:
            if str(row.get("ticker", "")).upper() == symbol.upper():
                try:
                    scores.append(float(row.get("ticker_sentiment_score")))
                except (TypeError, ValueError):
                    pass
    if not scores:
        return None
    avg = sum(scores) / len(scores)
    return clamp((avg + 1) * 50)


def catalyst_tags(texts: list[str]) -> list[str]:
    body = " ".join(texts).lower()
    checks = [
        ("Earnings", ["earnings", "eps", "revenue", "quarter"]),
        ("Analyst action", ["upgrade", "downgrade", "price target", "rating"]),
        ("Partnership", ["partnership", "contract", "deal", "agreement"]),
        ("Product news", ["launch", "product", "platform", "chip", "ai"]),
        ("Regulatory/legal", ["approval", "sec", "lawsuit", "probe", "investigation"]),
        ("Guidance", ["guidance", "forecast", "outlook"]),
    ]
    tags = []
    for tag, words in checks:
        if any(word in body for word in words):
            tags.append(tag)
    return tags[:4]


def score_operations(texts: list[str]) -> int:
    tags = catalyst_tags(texts)
    if not texts:
        return 45
    if "Regulatory/legal" in tags:
        return 48
    if len(tags) >= 2:
        return 72
    if len(tags) == 1:
        return 62
    return 50


def trade_levels(price: float, day_low: float | None, day_high: float | None) -> dict[str, str]:
    entry_low = max((day_low * 1.003) if day_low else price * 0.994, price * 0.99)
    entry_high = min((day_high * 0.997) if day_high else price * 1.006, price * 1.012)
    return {
        "entryRange": f"{fmt_money(entry_low)} – {fmt_money(entry_high)}",
        "profitTarget": f"{fmt_money(price * 1.018)} – {fmt_money(price * 1.034)}",
        "stopLoss": fmt_money(max(price * 0.972, (day_low * 0.992) if day_low else price * 0.972)),
    }


def weighted_overall(factors: list[dict[str, Any]]) -> int:
    total = sum(float(f["weight"]) for f in factors)
    return clamp(sum(float(f["score"]) * float(f["weight"]) for f in factors) / total)


def risk_level(overall: int, price: float, relative_volume: float | None) -> str:
    if price < 10 or (relative_volume or 0) > 2.5 or overall < 50:
        return "Speculative"
    if overall >= 70 and price >= 10:
        return "Balanced"
    return "Aggressive"


def average_volume(bars: list[dict[str, Any]]) -> float:
    volumes = [float(row.get("volume") or 0) for row in bars[-30:] if float(row.get("volume") or 0) > 0]
    return sum(volumes) / len(volumes) if volumes else 0.0


def technical_reason(rsi: float | None) -> str:
    if rsi is None:
        return "Not enough closing price history to calculate RSI."
    if 45 <= rsi <= 68:
        return "RSI is in a constructive momentum zone without being extremely overbought."
    if rsi > 75:
        return "RSI is stretched; the stock may be overextended for a fresh entry."
    if rsi < 35:
        return "RSI is weak; momentum may be damaged unless a reversal confirms."
    return "RSI is mixed and needs confirmation from price and volume."



def candles_to_history(candles: dict[str, Any]) -> list[dict[str, Any]]:
    if not candles or candles.get("s") == "no_data" or not isinstance(candles.get("c"), list):
        return []
    rows = []
    closes = candles.get("c", [])
    for index, close in enumerate(closes):
        timestamp = (candles.get("t") or [])[index] if index < len(candles.get("t") or []) else None
        rows.append({
            "date": datetime.fromtimestamp(timestamp, tz=timezone.utc).date().isoformat() if timestamp else str(index),
            "open": (candles.get("o") or [None] * len(closes))[index] if index < len(candles.get("o") or []) else None,
            "high": (candles.get("h") or [None] * len(closes))[index] if index < len(candles.get("h") or []) else None,
            "low": (candles.get("l") or [None] * len(closes))[index] if index < len(candles.get("l") or []) else None,
            "close": close,
            "volume": (candles.get("v") or [0] * len(closes))[index] if index < len(candles.get("v") or []) else 0,
        })
    return sorted(rows, key=lambda row: row.get("date", ""))


def build_pick_finnhub(symbol: str) -> dict[str, Any]:
    quote = finnhub("quote", symbol=symbol)
    if not quote or not quote.get("c"):
        raise RuntimeError(f"{symbol}: no Finnhub quote returned")
    profile = finnhub("stock/profile2", symbol=symbol)

    end = datetime.now(timezone.utc).date()
    start = end - timedelta(days=75)
    candles = finnhub("stock/candle", symbol=symbol, resolution="D", from_=int(datetime(start.year, start.month, start.day, tzinfo=timezone.utc).timestamp()), to=int(datetime(end.year, end.month, end.day, tzinfo=timezone.utc).timestamp()))
    history = candles_to_history(candles)

    try:
        news = finnhub("company-news", symbol=symbol, from_=str(end - timedelta(days=14)), to=str(end))
    except Exception as exc:  # noqa: BLE001
        print(f"Finnhub news skipped for {symbol}: {exc}", file=sys.stderr)
        news = []

    texts = [f"{item.get('headline', '')} {item.get('summary', '')}" for item in news if isinstance(item, dict)]
    sentiment = keyword_sentiment(texts)
    alpha_score = alpha_sentiment_score(symbol)
    if alpha_score is not None:
        sentiment = round((sentiment + alpha_score) / 2)

    closes = [float(row.get("close", 0)) for row in history if float(row.get("close", 0) or 0) > 0]
    rsi = calculate_rsi(closes)
    price = float(quote.get("c") or 0)
    change = float(quote.get("dp") or 0)
    volume = float(history[-1].get("volume") if history else 0)
    avg_volume = average_volume(history)
    relative_volume = round(volume / avg_volume, 2) if avg_volume else None

    technical = score_rsi(rsi)
    volume_score = score_relative_volume(relative_volume)
    momentum = score_momentum(change)
    operations = score_operations(texts)
    tags = catalyst_tags(texts)

    factors = [
        {"name": "News sentiment", "value": f"{sentiment}/100", "score": sentiment, "weight": WEIGHTS["newsSentiment"], "direction": direction(sentiment), "reason": "Finnhub company-news headline tone blended with Alpha Vantage ticker sentiment." if alpha_score is not None else "Finnhub company-news headline tone from recent stock-specific news.", "source": "Finnhub company news + Alpha Vantage NEWS_SENTIMENT" if alpha_score is not None else "Finnhub company news"},
        {"name": "Technical setup", "value": f"RSI {rsi:.1f}" if rsi is not None else "RSI unavailable", "score": technical, "weight": WEIGHTS["technicals"], "direction": direction(technical), "reason": technical_reason(rsi), "source": "Finnhub daily candles"},
        {"name": "Volume pressure", "value": f"{relative_volume}x average" if relative_volume else "Volume unavailable", "score": volume_score, "weight": WEIGHTS["volume"], "direction": direction(volume_score), "reason": "Trading activity is meaningfully above normal." if (relative_volume or 0) >= 1.5 else "Volume is near or below normal and needs confirmation.", "source": "Finnhub daily candles"},
        {"name": "Price momentum", "value": f"{change:.2f}% today", "score": momentum, "weight": WEIGHTS["momentum"], "direction": direction(momentum), "reason": "Positive price movement suggests active buyer interest today." if change >= 0.75 else "Price movement is weak, negative, or modest.", "source": "Finnhub quote"},
        {"name": "Operations/news catalyst", "value": ", ".join(tags) if tags else "No clear catalyst", "score": operations, "weight": WEIGHTS["operations"], "direction": direction(operations), "reason": "Recent headlines show an identifiable company, sector, analyst, earnings, or product catalyst." if operations >= 62 else "No strong company-specific catalyst detected from current headlines.", "source": "Finnhub company news"},
    ]
    overall = weighted_overall(factors)
    strongest = max(factors, key=lambda f: f["score"])
    levels = trade_levels(price, quote.get("l"), quote.get("h"))

    return {
        "rank": 999,
        "ticker": symbol,
        "companyName": profile.get("name") or symbol,
        "sector": profile.get("finnhubIndustry") or "Market",
        "price": round(price, 4),
        "changePercent": round(change, 4),
        "dayHigh": quote.get("h"),
        "dayLow": quote.get("l"),
        "open": quote.get("o"),
        "previousClose": quote.get("pc"),
        "volume": volume,
        "avgVolume": avg_volume,
        "relativeVolume": relative_volume,
        "rsi14": round(rsi, 2) if rsi is not None else None,
        "vwap": None,
        "sentimentScore": sentiment,
        "momentumScore": momentum,
        "volumeScore": volume_score,
        "technicalScore": technical,
        "operationsScore": operations,
        "overallScore": overall,
        "riskLevel": risk_level(overall, price, relative_volume),
        **levels,
        "pullOutGuidance": "Pull out if price loses VWAP/short-term trend support, breaks the lower entry range on heavy volume, or the news/sector catalyst fades before reaching target.",
        "rationale": f"{symbol} ranks well because {strongest['name'].lower()} is currently the strongest influence in the Finnhub model, with {relative_volume or 'unknown'}x relative volume and {change:.2f}% price movement today. This is a research signal, not a buy instruction.",
        "catalystTags": tags or ["Liquidity scan", "Technical watch"],
        "factors": factors,
        "robinhoodUrl": f"https://robinhood.com/stocks/{urllib.parse.quote(symbol)}",
        "sources": ["Finnhub quote", "Finnhub daily candles", "Finnhub company news", "Alpha Vantage sentiment" if alpha_score is not None else "Keyword sentiment"],
    }


def build_pick(symbol: str) -> dict[str, Any]:
    quote_rows = fmp("quote", symbol=symbol)
    if not quote_rows:
        raise RuntimeError(f"{symbol}: no quote returned")
    quote = quote_rows[0]
    profile_rows = fmp("profile", symbol=symbol)
    profile = profile_rows[0] if profile_rows else {}

    end = datetime.now(timezone.utc).date()
    start = end - timedelta(days=75)
    history = fmp("historical-price-eod/full", symbol=symbol, from_=str(start), to=str(end))
    if isinstance(history, dict):
        history = history.get("historical", [])
    if not isinstance(history, list):
        history = []
    history = sorted(history, key=lambda row: row.get("date", ""))

    try:
        news = fmp("news/stock", symbols=symbol, limit="8")
    except Exception as exc:  # noqa: BLE001
        print(f"FMP news skipped for {symbol}: {exc}", file=sys.stderr)
        news = []

    texts = [f"{item.get('title', '')} {item.get('text', '')}" for item in news if isinstance(item, dict)]
    sentiment = keyword_sentiment(texts)
    alpha_score = alpha_sentiment_score(symbol)
    if alpha_score is not None:
        sentiment = round((sentiment + alpha_score) / 2)

    closes = [float(row.get("close", row.get("price", 0))) for row in history if float(row.get("close", row.get("price", 0)) or 0) > 0]
    rsi = calculate_rsi(closes)
    price = float(quote.get("price") or 0)
    change = float(quote.get("changePercentage") or quote.get("changesPercentage") or 0)
    volume = float(quote.get("volume") or (history[-1].get("volume") if history else 0) or 0)
    avg_volume = float(quote.get("avgVolume") or average_volume(history))
    relative_volume = round(volume / avg_volume, 2) if avg_volume else None

    technical = score_rsi(rsi)
    volume_score = score_relative_volume(relative_volume)
    momentum = score_momentum(change)
    operations = score_operations(texts)
    tags = catalyst_tags(texts)

    factors = [
        {
            "name": "News sentiment",
            "value": f"{sentiment}/100",
            "score": sentiment,
            "weight": WEIGHTS["newsSentiment"],
            "direction": direction(sentiment),
            "reason": "Headline keyword tone blended with Alpha Vantage ticker sentiment." if alpha_score is not None else "Headline keyword tone from recent stock-specific news.",
            "source": "FMP news + Alpha Vantage NEWS_SENTIMENT" if alpha_score is not None else "FMP news",
        },
        {
            "name": "Technical setup",
            "value": f"RSI {rsi:.1f}" if rsi is not None else "RSI unavailable",
            "score": technical,
            "weight": WEIGHTS["technicals"],
            "direction": direction(technical),
            "reason": technical_reason(rsi),
            "source": "FMP historical price bars",
        },
        {
            "name": "Volume pressure",
            "value": f"{relative_volume}x average" if relative_volume else "Volume unavailable",
            "score": volume_score,
            "weight": WEIGHTS["volume"],
            "direction": direction(volume_score),
            "reason": "Trading activity is meaningfully above normal." if (relative_volume or 0) >= 1.5 else "Volume is near or below normal and needs confirmation.",
            "source": "FMP quote + historical volume",
        },
        {
            "name": "Price momentum",
            "value": f"{change:.2f}% today",
            "score": momentum,
            "weight": WEIGHTS["momentum"],
            "direction": direction(momentum),
            "reason": "Positive price movement suggests active buyer interest today." if change >= 0.75 else "Price movement is weak, negative, or modest.",
            "source": "FMP quote",
        },
        {
            "name": "Operations/news catalyst",
            "value": ", ".join(tags) if tags else "No clear catalyst",
            "score": operations,
            "weight": WEIGHTS["operations"],
            "direction": direction(operations),
            "reason": "Recent headlines show an identifiable company, sector, analyst, earnings, or product catalyst." if operations >= 62 else "No strong company-specific catalyst detected from current headlines.",
            "source": "FMP stock news",
        },
    ]
    overall = weighted_overall(factors)
    strongest = max(factors, key=lambda f: f["score"])
    levels = trade_levels(price, quote.get("dayLow"), quote.get("dayHigh"))

    pick = {
        "rank": 999,
        "ticker": symbol,
        "companyName": profile.get("companyName") or quote.get("name") or symbol,
        "sector": profile.get("sector") or profile.get("industry") or "Market",
        "price": round(price, 4),
        "changePercent": round(change, 4),
        "dayHigh": quote.get("dayHigh"),
        "dayLow": quote.get("dayLow"),
        "open": quote.get("open"),
        "previousClose": quote.get("previousClose"),
        "volume": volume,
        "avgVolume": avg_volume,
        "relativeVolume": relative_volume,
        "rsi14": round(rsi, 2) if rsi is not None else None,
        "vwap": history[-1].get("vwap") if history else None,
        "sentimentScore": sentiment,
        "momentumScore": momentum,
        "volumeScore": volume_score,
        "technicalScore": technical,
        "operationsScore": operations,
        "overallScore": overall,
        "riskLevel": risk_level(overall, price, relative_volume),
        **levels,
        "pullOutGuidance": "Pull out if price loses VWAP, breaks the lower entry range on heavy volume, or the news/sector catalyst fades before reaching target.",
        "rationale": f"{symbol} ranks well because {strongest['name'].lower()} is currently the strongest influence in the model, with {relative_volume or 'unknown'}x relative volume and {change:.2f}% price movement today. This is a research signal, not a buy instruction.",
        "catalystTags": tags or ["Liquidity scan", "Technical watch"],
        "factors": factors,
        "robinhoodUrl": f"https://robinhood.com/stocks/{urllib.parse.quote(symbol)}",
        "sources": ["FMP quote", "FMP historical prices", "FMP stock news", "Alpha Vantage sentiment" if alpha_score is not None else "Keyword sentiment"],
    }
    return pick


def load_robinhood_universe() -> list[str]:
    try:
        payload = json.loads(UNIVERSE_FILE.read_text(encoding="utf-8"))
        symbols = payload.get("symbols", [])
        if isinstance(symbols, list):
            clean = [str(symbol).strip().upper() for symbol in symbols if str(symbol).strip()]
            return clean or DEFAULT_TICKERS
    except Exception as exc:  # noqa: BLE001
        print(f"Unable to load {UNIVERSE_FILE}: {exc}; using built-in default list", file=sys.stderr)
    return DEFAULT_TICKERS


def tickers(provider: str) -> list[str]:
    raw = os.environ.get("TRADE_TICKERS")
    default_max = "5" if provider == "finnhub" else "20"
    max_scan = int(os.environ.get("MAX_SCAN_TICKERS") or default_max)

    if not raw:
        return load_robinhood_universe()[:max_scan]

    if raw.strip().upper() == "ALL":
        return load_robinhood_universe()[:max_scan]

    parsed = [part.strip().upper() for part in raw.split(",") if part.strip()]
    return (parsed or load_robinhood_universe())[:max_scan]


def missed_top_five_reason(pick: dict[str, Any], rank: int) -> str:
    factors = pick.get("factors", []) or []
    if not factors:
        return f"Ranked #{rank}. It missed the Top 5 because the model did not receive enough complete factor data."
    weakest = sorted(factors, key=lambda item: item.get("score", 0))[0]
    strongest = sorted(factors, key=lambda item: item.get("score", 0), reverse=True)[0]
    return (
        f"Ranked #{rank}. It missed the Top 5 mainly because "
        f"{weakest.get('name', 'one factor').lower()} scored {weakest.get('score', 'unknown')}/100 "
        f"({weakest.get('direction', 'Neutral')}). Strongest factor: "
        f"{strongest.get('name', 'one factor').lower()} at {strongest.get('score', 'unknown')}/100."
    )


def main() -> None:
    provider = selected_provider()
    if provider == "finnhub" and not os.environ.get("FINNHUB_API_KEY"):
        raise SystemExit("FINNHUB_API_KEY is required for Finnhub mode. Add it as a GitHub Actions secret and Netlify/local env value.")
    if provider == "fmp" and not os.environ.get("FMP_API_KEY"):
        raise SystemExit("FMP_API_KEY is required for FMP mode. Add it as a GitHub Actions secret and local .env value.")

    universe = tickers(provider)
    builder = build_pick_finnhub if provider == "finnhub" else build_pick
    errors: list[str] = []
    analyzed: list[dict[str, Any]] = []
    for symbol in universe:
        try:
            analyzed.append(builder(symbol))
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{symbol}: {exc}")
            print(errors[-1], file=sys.stderr)

    candidates = sorted(analyzed, key=lambda item: item["overallScore"], reverse=True)
    for index, candidate in enumerate(candidates, start=1):
        candidate["rank"] = index
        candidate["selected"] = index <= 5
        candidate["selectionNote"] = (
            f"Selected because it ranked #{index} out of {len(candidates)} analyzed candidates."
            if index <= 5
            else missed_top_five_reason(candidate, index)
        )

    picks = [dict(candidate, rank=index + 1, selected=True) for index, candidate in enumerate(candidates[:5])]

    snapshot = {
        "asOf": datetime.now(timezone.utc).isoformat(),
        "marketSession": "Generated by GitHub Actions daily research script",
        "dataStatus": "live" if picks else "error",
        "dataDelayNote": "Generated from server-side provider APIs. Freshness depends on your provider plan and exchange entitlements.",
        "providerNote": ("Finnhub quote/candles/profile/news" if provider == "finnhub" else "FMP quote/history/profile/news") + (" + Alpha Vantage NEWS_SENTIMENT" if os.environ.get("ALPHA_VANTAGE_API_KEY") else ""),
        "providerMode": provider,
        "manualScanLimit": 5 if provider == "finnhub" else 3,
        "researchNote": "Top 5 recommendations may repeat when the same symbols keep scoring highest. Use candidates for the full ranked scan and the Top Follow favorites list to track symbols over time.",
        "universe": universe,
        "picks": picks,
        "candidates": candidates,
        "errors": errors,
    }
    OUTPUT.write_text(json.dumps(snapshot, indent=2), encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(ROOT)} with {len(picks)} top picks and {len(candidates)} analyzed candidates")


if __name__ == "__main__":
    main()
