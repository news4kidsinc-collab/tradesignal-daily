import { ExternalLink, Smartphone, TrendingUp } from "lucide-react";
import type { FactorDirection, TradePick } from "@/types/market";
import { formatCurrency, formatPercent, formatVolume, robinhoodStockUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CopyTickerButton } from "@/components/copy-ticker-button";
import { FavoriteTickerButton } from "@/components/favorite-ticker-button";

export function PickCard({ pick }: { pick: TradePick }) {
  const isPositive = pick.changePercent >= 0;

  return (
    <Card className="glass-card h-full overflow-hidden">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-3xl font-bold tracking-tight">{pick.ticker}</span>
              <Badge variant={pick.riskLevel === "Speculative" ? "warning" : "success"}>{pick.riskLevel}</Badge>
              <Badge variant="outline" className="border-primary/30 text-primary">Score {pick.overallScore}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{pick.companyName}</p>
          </div>
          <div className="flex items-center gap-2">
            <FavoriteTickerButton ticker={pick.ticker} compact />
            <CopyTickerButton ticker={pick.ticker} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <PriceMetric label="Live price" value={formatCurrency(pick.price)} />
          <PriceMetric
            label="Change"
            value={formatPercent(pick.changePercent)}
            className={isPositive ? "text-emerald-300" : "text-red-300"}
          />
          <PriceMetric label="Rel. volume" value={pick.relativeVolume ? `${pick.relativeVolume}x` : "N/A"} />
          <PriceMetric label="RSI 14" value={pick.rsi14 ? pick.rsi14.toFixed(1) : "N/A"} />
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <p className="text-sm leading-6 text-slate-300">{pick.rationale}</p>

        <div className="grid gap-3 sm:grid-cols-5">
          <Metric label="Sentiment" value={pick.sentimentScore} />
          <Metric label="Technical" value={pick.technicalScore} />
          <Metric label="Volume" value={pick.volumeScore} />
          <Metric label="Momentum" value={pick.momentumScore} />
          <Metric label="Operations" value={pick.operationsScore} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white">Factor influence — good or bad</h3>
            <p className="text-xs text-muted-foreground">Weights show model influence on rank.</p>
          </div>
          <div className="space-y-2">
            {pick.factors.map((factor) => (
              <div key={factor.name} className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.025] p-3 md:grid-cols-[160px_90px_1fr] md:items-start">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{factor.name}</p>
                  <p className="text-xs text-muted-foreground">Weight {(factor.weight * 100).toFixed(0)}%</p>
                </div>
                <InfluenceBadge direction={factor.direction} score={factor.score} />
                <div>
                  <p className="text-sm text-slate-300">{factor.value}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{factor.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 text-sm">
          <TradeRule label="Suggested entry" value={pick.entryRange} />
          <TradeRule label="Profit target" value={pick.profitTarget} />
          <TradeRule label="Stop-loss" value={pick.stopLoss} />
          <TradeRule label="Volume" value={pick.volume ? formatVolume(pick.volume) : "N/A"} />
        </div>

        <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-amber-100">
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            When to pull out
          </div>
          <p className="text-sm leading-6 text-amber-50/85">{pick.pullOutGuidance}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {pick.catalystTags.map((tag) => (
            <Badge key={tag} variant="outline" className="border-white/10 text-slate-300">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="grid gap-2">
          <Button asChild variant="success" size="lg" className="w-full">
            <a href={pick.robinhoodUrl || robinhoodStockUrl(pick.ticker)} target="_blank" rel="noreferrer noopener" aria-label={`Open ${pick.ticker} on Robinhood`}>
              Open on Robinhood <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
          <Button asChild variant="outline" className="w-full sm:hidden">
            <a href={pick.robinhoodUrl || robinhoodStockUrl(pick.ticker)} target="_blank" rel="noreferrer noopener">
              <Smartphone className="h-4 w-4" aria-hidden="true" /> Open in Robinhood App
            </a>
          </Button>
        </div>

        <p className="risk-text">
          Research signal only. Verify ticker, data freshness, spread, liquidity, market conditions, and your own risk tolerance before making any financial decision.
        </p>
      </CardContent>
    </Card>
  );
}

function PriceMetric({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${className}`}>{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="font-semibold text-slate-200">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800" aria-hidden="true">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function InfluenceBadge({ direction, score }: { direction: FactorDirection; score: number }) {
  const className =
    direction === "Good"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : direction === "Bad"
        ? "border-red-400/30 bg-red-400/10 text-red-200"
        : "border-amber-400/30 bg-amber-400/10 text-amber-100";

  return <div className={`w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>{direction} · {score}</div>;
}

function TradeRule({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/60 p-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold text-white">{value}</span>
    </div>
  );
}
