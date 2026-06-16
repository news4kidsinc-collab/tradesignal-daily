import latestSnapshot from "@/data/latest-picks.json";
import type { DataProvider, InfluenceFactor, PicksSnapshot, TradePick } from "@/types/market";
import { getUniverseFromEnv } from "@/lib/market/config";
import {
  buildTradeLevels,
  calculateRsi,
  catalystTagsFromText,
  keywordSentimentScore,
  riskFromScore,
  scoreDirection,
  scoreMomentum,
  scoreRelativeVolume,
  scoreRsi,
  weightedOverall,
  weightForFactor
} from "@/lib/market/scoring";
import { alphaSentimentToScore, getAlphaNewsSentiment, hasAlphaVantageKey } from "@/lib/market/providers/alpha-vantage";
import { getFmpHistorical, getFmpNews, getFmpProfile, getFmpQuote, hasFmpKey } from "@/lib/market/providers/fmp";
import { getFinnhubCandles, getFinnhubCompanyNews, getFinnhubProfile, getFinnhubQuote, hasFinnhubKey } from "@/lib/market/providers/finnhub";
import { robinhoodStockUrl } from "@/lib/utils";

const typedFallback = latestSnapshot as PicksSnapshot;

type BuildPickResult = {
  pick?: TradePick;
  error?: string;
};

type ResearchProvider = "fmp" | "finnhub";

type ResearchOptions = {
  refresh?: boolean;
  provider?: DataProvider;
  symbols?: string[];
};

const FMP_MANUAL_SCAN_LIMIT = 3;
const FINNHUB_MANUAL_SCAN_LIMIT = 5;

export async function getDailyResearchPicks(options: ResearchOptions = {}): Promise<PicksSnapshot> {
  const provider = resolveProvider(options.provider);
  const manualSymbols = sanitizeSymbols(options.symbols ?? []);
  const manualLimit = provider === "finnhub" ? FINNHUB_MANUAL_SCAN_LIMIT : FMP_MANUAL_SCAN_LIMIT;
  const universe = manualSymbols.length ? manualSymbols.slice(0, manualLimit) : getUniverseFromEnv();
  const refresh = Boolean(options.refresh);

  if (!hasProviderKey(provider)) {
    const fallbackCandidates = typedFallback.candidates ?? typedFallback.picks;
    return {
      ...typedFallback,
      candidates: fallbackCandidates,
      dataStatus: "fallback",
      dataDelayNote:
        provider === "finnhub"
          ? "Fallback sample shown because FINNHUB_API_KEY is missing. Add it locally, in GitHub Secrets, and in Netlify environment variables to use Finnhub scans."
          : "Fallback sample shown because FMP_API_KEY is missing. Add .env.local and Netlify environment variables to pull real daily data.",
      providerNote: provider === "finnhub" ? "No FINNHUB_API_KEY detected. This is not live Finnhub data." : "No server-side FMP market API key detected. This is not live data.",
      researchNote:
        "Use the manual symbol scanner to choose exactly which tickers to analyze. FMP/manual Alpha mode is capped at 3 symbols; Finnhub mode is capped at 5 symbols to reduce rate-limit failures.",
      providerMode: provider,
      manualSymbols: universe,
      manualScanLimit: manualLimit
    };
  }

  const builder: (ticker: string, refresh: boolean) => Promise<BuildPickResult> = provider === "finnhub" ? buildFinnhubPick : buildFmpPick;
  const results: BuildPickResult[] = await Promise.all(universe.map((ticker: string) => builder(ticker, refresh)));
  const rankedCandidates = results
    .filter((result): result is { pick: TradePick } => Boolean(result.pick))
    .map((result) => result.pick)
    .sort((a, b) => b.overallScore - a.overallScore)
    .map((pick, index) => ({
      ...pick,
      rank: index + 1,
      selected: index < 5,
      selectionNote:
        index < 5
          ? `Selected because it ranked #${index + 1} out of the scanned universe by weighted factor score.`
          : buildMissedTopFiveReason(pick, index + 1)
    }));

  const picks = rankedCandidates
    .slice(0, 5)
    .map((pick, index) => ({
      ...pick,
      rank: index + 1,
      selected: true,
      selectionNote: `Selected because it ranked #${index + 1} out of ${rankedCandidates.length} analyzed candidates.`
    }));

  const errors = results.map((result) => result.error).filter(Boolean) as string[];

  if (!picks.length) {
    return {
      ...typedFallback,
      dataStatus: "error",
      dataDelayNote: "Live provider calls failed; fallback sample data is displayed.",
      providerNote: "Check API keys, endpoint access, and provider limits.",
      candidates: typedFallback.candidates ?? typedFallback.picks,
      errors
    };
  }

  return {
    asOf: new Date().toISOString(),
    marketSession: marketSessionLabel(),
    dataStatus: "live",
    dataDelayNote:
      "Server-side API data loaded. Depending on your data plan, quotes may be real-time, near real-time, or delayed by the provider.",
    providerNote: provider === "finnhub"
      ? (hasAlphaVantageKey()
        ? "Using Finnhub for quote/daily candles/profile/news and Alpha Vantage for optional news sentiment overlay."
        : "Using Finnhub for quote/daily candles/profile/news. Add ALPHA_VANTAGE_API_KEY only if you want an external sentiment overlay.")
      : (hasAlphaVantageKey()
        ? "Using FMP for quote/history/profile/news and Alpha Vantage for optional news sentiment overlay."
        : "Using FMP for quote/history/profile/news. Add ALPHA_VANTAGE_API_KEY for an external sentiment overlay."),
    researchNote:
      manualSymbols.length
        ? `Manual scan completed for ${universe.length} selected symbol${universe.length === 1 ? "" : "s"}. ${provider === "finnhub" ? "Finnhub mode allows up to 5 selected symbols." : "FMP/Alpha mode allows up to 3 selected symbols."}`
        : "Top 5 recommendations may repeat when the same symbols keep scoring highest. Use the Full Scan view to inspect every ticker scanned, compare factor scores, and see why each symbol was or was not selected.",
    universe,
    picks,
    candidates: rankedCandidates,
    errors,
    providerMode: provider,
    manualSymbols: manualSymbols.length ? universe : undefined,
    manualScanLimit: manualLimit
  };
}

function sanitizeSymbols(symbols: string[]) {
  const seen = new Set<string>();
  return symbols
    .map((symbol) => symbol.trim().toUpperCase())
    .filter((symbol) => /^[A-Z][A-Z0-9.-]{0,9}$/.test(symbol))
    .filter((symbol) => {
      if (seen.has(symbol)) return false;
      seen.add(symbol);
      return true;
    });
}

function resolveProvider(provider: DataProvider | undefined): ResearchProvider {
  if (provider === "finnhub") return "finnhub";
  if (provider === "fmp") return "fmp";
  if (hasFinnhubKey()) return "finnhub";
  return "fmp";
}

function hasProviderKey(provider: ResearchProvider) {
  return provider === "finnhub" ? hasFinnhubKey() : hasFmpKey();
}

async function buildFmpPick(ticker: string, _refresh: boolean): Promise<BuildPickResult> {
  try {
    const [quote, profile, historical, news] = await Promise.all([
      getFmpQuote(ticker),
      getFmpProfile(ticker).catch(() => undefined),
      getFmpHistorical(ticker, 60).catch(() => []),
      getFmpNews(ticker).catch(() => [])
    ]);

    if (!quote?.price) return { error: `${ticker}: missing live quote price` };

    const orderedHistorical = [...historical]
      .filter((bar) => typeof bar.close === "number" || typeof bar.price === "number")
      .sort((a, b) => a.date.localeCompare(b.date));
    const closes = orderedHistorical.map((bar) => Number(bar.close ?? bar.price)).filter(Number.isFinite);
    const rsi14 = calculateRsi(closes);

    const newsText = news.map((item) => `${item.title ?? ""} ${item.text ?? ""}`);
    let sentimentScore = keywordSentimentScore(newsText);
    const alphaResponse = hasAlphaVantageKey() ? await getAlphaNewsSentiment(ticker).catch(() => undefined) : undefined;
    const alphaScore = alphaSentimentToScore(ticker, alphaResponse);
    if (alphaScore !== undefined) {
      sentimentScore = Math.round((sentimentScore + alphaScore) / 2);
    }

    const price = Number(quote.price);
    const changePercent = Number(quote.changePercentage ?? quote.changesPercentage ?? 0);
    const avgVolume = Number(quote.avgVolume ?? averageVolume(orderedHistorical));
    const volume = Number(quote.volume ?? orderedHistorical.at(-1)?.volume ?? 0);
    const relativeVolume = avgVolume > 0 ? Number((volume / avgVolume).toFixed(2)) : undefined;
    const technicalScore = scoreRsi(rsi14);
    const momentumScore = scoreMomentum(changePercent);
    const volumeScore = scoreRelativeVolume(relativeVolume);
    const operationsScore = scoreOperations(newsText);

    const factors: InfluenceFactor[] = [
      {
        name: "News sentiment",
        value: `${sentimentScore}/100`,
        score: sentimentScore,
        weight: weightForFactor("newsSentiment"),
        direction: scoreDirection(sentimentScore),
        reason:
          alphaScore !== undefined
            ? "Headline keyword tone blended with Alpha Vantage ticker sentiment."
            : "Headline keyword tone from recent stock-specific news because Alpha Vantage key is not enabled.",
        source: alphaScore !== undefined ? "FMP news + Alpha Vantage NEWS_SENTIMENT" : "FMP news"
      },
      {
        name: "Technical setup",
        value: rsi14 ? `RSI ${rsi14.toFixed(1)}` : "RSI unavailable",
        score: technicalScore,
        weight: weightForFactor("technicals"),
        direction: scoreDirection(technicalScore),
        reason: technicalReason(rsi14),
        source: "FMP historical price bars"
      },
      {
        name: "Volume pressure",
        value: relativeVolume ? `${relativeVolume}x average` : "Volume unavailable",
        score: volumeScore,
        weight: weightForFactor("volume"),
        direction: scoreDirection(volumeScore),
        reason: volumeReason(relativeVolume),
        source: "FMP quote + historical volume"
      },
      {
        name: "Price momentum",
        value: `${changePercent.toFixed(2)}% today`,
        score: momentumScore,
        weight: weightForFactor("momentum"),
        direction: scoreDirection(momentumScore),
        reason: momentumReason(changePercent),
        source: "FMP quote"
      },
      {
        name: "Operations/news catalyst",
        value: catalystTagsFromText(newsText).join(", ") || "No clear catalyst",
        score: operationsScore,
        weight: weightForFactor("operations"),
        direction: scoreDirection(operationsScore),
        reason: operationsReason(operationsScore),
        source: "FMP stock news"
      }
    ];

    const overallScore = weightedOverall(factors);
    const levels = buildTradeLevels(price, quote.dayLow, quote.dayHigh);
    const riskLevel = riskFromScore(overallScore, price, relativeVolume);
    const tags = catalystTagsFromText(newsText);

    const pick: TradePick = {
      rank: 999,
      ticker,
      companyName: profile?.companyName ?? quote.name ?? ticker,
      sector: profile?.sector ?? profile?.industry ?? "Market",
      price,
      changePercent,
      dayHigh: quote.dayHigh,
      dayLow: quote.dayLow,
      open: quote.open,
      previousClose: quote.previousClose,
      volume,
      avgVolume,
      relativeVolume,
      rsi14,
      vwap: orderedHistorical.at(-1)?.vwap,
      sentimentScore,
      momentumScore,
      volumeScore,
      technicalScore,
      operationsScore,
      overallScore,
      riskLevel,
      ...levels,
      pullOutGuidance: buildExitGuidance(rsi14, relativeVolume, changePercent),
      rationale: buildRationale({
        ticker,
        sentimentScore,
        technicalScore,
        volumeScore,
        momentumScore,
        operationsScore,
        relativeVolume,
        changePercent,
        tags
      }),
      catalystTags: tags.length ? tags : ["Liquidity scan", "Technical watch"],
      factors,
      robinhoodUrl: robinhoodStockUrl(ticker),
      sources: ["FMP quote", "FMP historical prices", "FMP stock news", hasAlphaVantageKey() ? "Alpha Vantage sentiment" : "Keyword sentiment"]
    };

    return { pick };
  } catch (error) {
    return { error: `${ticker}: ${error instanceof Error ? error.message : "unknown error"}` };
  }
}


async function buildFinnhubPick(ticker: string, _refresh: boolean): Promise<BuildPickResult> {
  try {
    const [quote, profile, candles, news] = await Promise.all([
      getFinnhubQuote(ticker),
      getFinnhubProfile(ticker).catch(() => undefined),
      getFinnhubCandles(ticker, 75).catch(() => undefined),
      getFinnhubCompanyNews(ticker).catch(() => [])
    ]);

    if (!quote?.c) return { error: `${ticker}: missing Finnhub quote price` };

    const orderedHistorical = candlesToBars(candles);
    const closes = orderedHistorical.map((bar) => Number(bar.close)).filter(Number.isFinite);
    const rsi14 = calculateRsi(closes);

    const newsText = news.map((item) => `${item.headline ?? ""} ${item.summary ?? ""}`);
    let sentimentScore = keywordSentimentScore(newsText);
    const alphaResponse = hasAlphaVantageKey() ? await getAlphaNewsSentiment(ticker).catch(() => undefined) : undefined;
    const alphaScore = alphaSentimentToScore(ticker, alphaResponse);
    if (alphaScore !== undefined) {
      sentimentScore = Math.round((sentimentScore + alphaScore) / 2);
    }

    const price = Number(quote.c);
    const changePercent = Number(quote.dp ?? 0);
    const avgVolume = averageVolume(orderedHistorical);
    const volume = Number(orderedHistorical.at(-1)?.volume ?? 0);
    const relativeVolume = avgVolume > 0 ? Number((volume / avgVolume).toFixed(2)) : undefined;
    const technicalScore = scoreRsi(rsi14);
    const momentumScore = scoreMomentum(changePercent);
    const volumeScore = scoreRelativeVolume(relativeVolume);
    const operationsScore = scoreOperations(newsText);

    const factors: InfluenceFactor[] = [
      {
        name: "News sentiment",
        value: `${sentimentScore}/100`,
        score: sentimentScore,
        weight: weightForFactor("newsSentiment"),
        direction: scoreDirection(sentimentScore),
        reason:
          alphaScore !== undefined
            ? "Finnhub headline keyword tone blended with Alpha Vantage ticker sentiment."
            : "Headline keyword tone from recent Finnhub company news because Alpha Vantage key is not enabled.",
        source: alphaScore !== undefined ? "Finnhub company news + Alpha Vantage NEWS_SENTIMENT" : "Finnhub company news"
      },
      {
        name: "Technical setup",
        value: rsi14 ? `RSI ${rsi14.toFixed(1)}` : "RSI unavailable",
        score: technicalScore,
        weight: weightForFactor("technicals"),
        direction: scoreDirection(technicalScore),
        reason: technicalReason(rsi14),
        source: "Finnhub daily candles"
      },
      {
        name: "Volume pressure",
        value: relativeVolume ? `${relativeVolume}x average` : "Volume unavailable",
        score: volumeScore,
        weight: weightForFactor("volume"),
        direction: scoreDirection(volumeScore),
        reason: relativeVolume ? volumeReason(relativeVolume) : "Finnhub quote does not include intraday volume in this endpoint, so the model uses latest daily candle volume when available.",
        source: "Finnhub daily candles"
      },
      {
        name: "Price momentum",
        value: `${changePercent.toFixed(2)}% today`,
        score: momentumScore,
        weight: weightForFactor("momentum"),
        direction: scoreDirection(momentumScore),
        reason: momentumReason(changePercent),
        source: "Finnhub quote"
      },
      {
        name: "Operations/news catalyst",
        value: catalystTagsFromText(newsText).join(", ") || "No clear catalyst",
        score: operationsScore,
        weight: weightForFactor("operations"),
        direction: scoreDirection(operationsScore),
        reason: operationsReason(operationsScore),
        source: "Finnhub company news"
      }
    ];

    const overallScore = weightedOverall(factors);
    const levels = buildTradeLevels(price, quote.l, quote.h);
    const riskLevel = riskFromScore(overallScore, price, relativeVolume);
    const tags = catalystTagsFromText(newsText);

    const pick: TradePick = {
      rank: 999,
      ticker,
      companyName: profile?.name ?? ticker,
      sector: profile?.finnhubIndustry ?? "Market",
      price,
      changePercent,
      dayHigh: quote.h,
      dayLow: quote.l,
      open: quote.o,
      previousClose: quote.pc,
      volume,
      avgVolume,
      relativeVolume,
      rsi14,
      vwap: undefined,
      sentimentScore,
      momentumScore,
      volumeScore,
      technicalScore,
      operationsScore,
      overallScore,
      riskLevel,
      ...levels,
      pullOutGuidance: buildExitGuidance(rsi14, relativeVolume, changePercent),
      rationale: buildRationale({
        ticker,
        sentimentScore,
        technicalScore,
        volumeScore,
        momentumScore,
        operationsScore,
        relativeVolume,
        changePercent,
        tags
      }),
      catalystTags: tags.length ? tags : ["Liquidity scan", "Technical watch"],
      factors,
      robinhoodUrl: robinhoodStockUrl(ticker),
      sources: ["Finnhub quote", "Finnhub daily candles", "Finnhub company news", hasAlphaVantageKey() ? "Alpha Vantage sentiment" : "Keyword sentiment"]
    };

    return { pick };
  } catch (error) {
    return { error: `${ticker}: ${error instanceof Error ? error.message : "unknown Finnhub error"}` };
  }
}

function candlesToBars(candles?: { c?: number[]; h?: number[]; l?: number[]; o?: number[]; t?: number[]; v?: number[]; s?: string }) {
  if (!candles || candles.s === "no_data" || !Array.isArray(candles.c)) return [];
  return candles.c
    .map((close, index) => ({
      date: candles.t?.[index] ? new Date(Number(candles.t[index]) * 1000).toISOString().slice(0, 10) : String(index),
      open: candles.o?.[index],
      high: candles.h?.[index],
      low: candles.l?.[index],
      close,
      volume: candles.v?.[index]
    }))
    .filter((bar) => Number.isFinite(Number(bar.close)))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function buildMissedTopFiveReason(pick: TradePick, rank: number) {
  const weakest = [...pick.factors].sort((a, b) => a.score - b.score)[0];
  const strongest = [...pick.factors].sort((a, b) => b.score - a.score)[0];
  return `Ranked #${rank}. It missed the Top 5 mainly because ${weakest.name.toLowerCase()} scored ${weakest.score}/100 (${weakest.direction}). Strongest factor: ${strongest.name.toLowerCase()} at ${strongest.score}/100.`;
}

function averageVolume(bars: Array<{ volume?: number }>) {
  const volumes = bars.map((bar) => Number(bar.volume)).filter((value) => Number.isFinite(value) && value > 0).slice(-30);
  if (!volumes.length) return 0;
  return volumes.reduce((sum, value) => sum + value, 0) / volumes.length;
}

function scoreOperations(texts: string[]) {
  const tags = catalystTagsFromText(texts);
  if (!texts.length) return 45;
  if (tags.includes("Regulatory/legal")) return 48;
  if (tags.length >= 2) return 72;
  if (tags.length === 1) return 62;
  return 50;
}

function technicalReason(rsi?: number) {
  if (!rsi) return "Not enough closing price history to calculate RSI.";
  if (rsi >= 45 && rsi <= 68) return "RSI is in a constructive momentum zone without being extremely overbought.";
  if (rsi > 75) return "RSI is stretched; the stock may be overextended for a fresh entry.";
  if (rsi < 35) return "RSI is weak; momentum may be damaged unless a reversal confirms.";
  return "RSI is mixed and needs confirmation from price and volume.";
}

function volumeReason(relativeVolume?: number) {
  if (!relativeVolume) return "Average volume comparison could not be calculated.";
  if (relativeVolume >= 1.5) return "Trading activity is meaningfully above normal, which can support intraday movement.";
  if (relativeVolume < 0.8) return "Volume is below normal, which can make breakouts less reliable.";
  return "Volume is near normal and needs confirmation before sizing up.";
}

function momentumReason(changePercent: number) {
  if (changePercent > 9) return "Price has already moved sharply; this raises reversal and chase risk.";
  if (changePercent >= 0.75) return "Positive price movement suggests active buyer interest today.";
  if (changePercent < -0.75) return "Negative daily movement weakens the long-side day trade setup.";
  return "Price movement is modest and may require a breakout before action.";
}

function operationsReason(score: number) {
  if (score >= 62) return "Recent headlines show an identifiable company, sector, analyst, earnings, or product catalyst.";
  if (score <= 42) return "News flow appears weak or negative; catalyst quality is not supportive.";
  return "No strong company-specific catalyst detected from current headlines.";
}

function buildExitGuidance(rsi?: number, relativeVolume?: number, changePercent?: number) {
  if ((rsi ?? 0) > 75 || (changePercent ?? 0) > 8) {
    return "Protect gains quickly. Pull out if price rejects near the high of day, loses VWAP, or prints two lower five-minute closes on rising sell volume.";
  }
  if ((relativeVolume ?? 0) < 1) {
    return "Do not force the trade. Pull out if volume stays below average or the move cannot hold above the entry range after the first 30–45 minutes.";
  }
  return "Pull out if price loses VWAP, breaks the lower entry range on heavy volume, or the news/sector catalyst fades before reaching target.";
}

function buildRationale(input: {
  ticker: string;
  sentimentScore: number;
  technicalScore: number;
  volumeScore: number;
  momentumScore: number;
  operationsScore: number;
  relativeVolume?: number;
  changePercent: number;
  tags: string[];
}) {
  const strongest = [
    ["news sentiment", input.sentimentScore],
    ["technicals", input.technicalScore],
    ["volume", input.volumeScore],
    ["momentum", input.momentumScore],
    ["operations/news", input.operationsScore]
  ].sort((a, b) => Number(b[1]) - Number(a[1]))[0][0];

  const catalyst = input.tags.length ? ` Catalyst tags: ${input.tags.join(", ")}.` : "";
  return `${input.ticker} ranks well because ${strongest} is currently the strongest influence in the model, with ${input.relativeVolume ? `${input.relativeVolume}x relative volume` : "volume data under review"} and ${input.changePercent.toFixed(2)}% price movement today.${catalyst} This is a research signal, not a buy instruction.`;
}

function marketSessionLabel() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
    weekday: "short"
  });
  return `Generated ${formatter.format(now)} ET`;
}
