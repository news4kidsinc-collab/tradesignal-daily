import { ArrowRight, BarChart3, DatabaseZap, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const stats = [
  { label: "Daily ideas", value: "5" },
  { label: "Research factors", value: "5" },
  { label: "Risk rules", value: "Always" }
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-radial-signal">
      <div className="absolute inset-0 bg-grid-fade bg-[length:42px_42px] opacity-40" aria-hidden="true" />
      <div className="container relative grid min-h-[720px] items-center gap-12 py-20 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
        <div>
          <Badge variant="success" className="mb-5">
            Personal stock-movement research dashboard
          </Badge>
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Daily Data-Driven Day Trade Picks
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Five short-term stock research ideas for low-entry Robinhood users, ranked with daily quote, volume, technical,
            news sentiment, and company-catalyst data. Each factor is labeled as a good, bad, or neutral influence.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="success">
              <a href="#picks">
                See Today&apos;s Picks <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#methodology">How It Works</a>
            </Button>
          </div>
          <p className="mt-5 text-xs leading-6 text-amber-100/85">
            Risk reminder: This dashboard is for personal research and education. It is not investment advice, not a brokerage
            service, and not a promise of profit.
          </p>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card relative rounded-3xl p-5 shadow-glow">
          <div className="rounded-2xl border border-white/10 bg-slate-950/90 p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Signal Board</p>
                <h2 className="text-2xl font-semibold">Daily Research Pull</h2>
              </div>
              <div className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">Live-ready</div>
            </div>
            <div className="space-y-3">
              {[
                ["News sentiment", "Good/Bad", "Headline tone and ticker sentiment"],
                ["Technicals", "RSI/VWAP", "Constructive vs. overextended setup"],
                ["Volume", "Relative", "Above/below average participation"],
                ["Momentum", "% move", "Buyer/seller pressure today"]
              ].map(([label, value, note]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-300">{label}</span>
                    <span className="font-semibold text-emerald-300">{value}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{note}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <BarChart3 className="mb-2 h-5 w-5" aria-hidden="true" />
                <p className="text-xs text-primary/90">Technicals</p>
              </div>
              <div className="rounded-xl bg-emerald-400/10 p-3 text-emerald-300">
                <DatabaseZap className="mb-2 h-5 w-5" aria-hidden="true" />
                <p className="text-xs text-emerald-200">API Pull</p>
              </div>
              <div className="rounded-xl bg-sky-400/10 p-3 text-sky-200">
                <Smartphone className="mb-2 h-5 w-5" aria-hidden="true" />
                <p className="text-xs text-sky-100">Mobile</p>
              </div>
              <div className="rounded-xl bg-amber-400/10 p-3 text-amber-200">
                <ShieldCheck className="mb-2 h-5 w-5" aria-hidden="true" />
                <p className="text-xs text-amber-100">Risk-first</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
