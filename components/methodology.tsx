import { Activity, BarChart3, Building2, Newspaper, RadioTower } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const methods = [
  {
    icon: Newspaper,
    title: "News sentiment",
    text: "Pulls recent ticker-specific headlines. With Alpha Vantage enabled, the model blends provider sentiment with a conservative keyword sentiment pass. Positive catalysts help; legal, recall, downgrade, and debt language hurts."
  },
  {
    icon: BarChart3,
    title: "Technical setup",
    text: "Uses recent price bars to calculate RSI and identify whether the ticker is constructive, weak, or overextended. RSI is not treated as a trade signal by itself."
  },
  {
    icon: Activity,
    title: "Volume and momentum",
    text: "Compares current volume against recent average volume and checks daily percent change. Good setups usually need enough participation without chasing an exhausted move."
  },
  {
    icon: Building2,
    title: "Company operations/news catalyst",
    text: "Looks for headlines involving earnings, guidance, product launches, contracts, partnerships, analyst actions, or regulatory/legal issues. Each influence is labeled Good, Bad, or Neutral."
  },
  {
    icon: RadioTower,
    title: "Daily automation path",
    text: "The included GitHub Actions + Python script can run before market open, call the same APIs, write a daily JSON snapshot, and trigger a Netlify rebuild or commit the generated research file."
  }
];

export function Methodology() {
  return (
    <section id="methodology" className="border-t border-white/10 py-20">
      <div className="container">
        <div className="mb-10 max-w-3xl">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">Methodology</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How the daily research score is built</h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            The model is intentionally transparent. It does not predict the future. It ranks the daily research universe by weighted factors so you can study what appears to influence short-term stock movement.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {methods.map((method) => (
            <div key={method.title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <method.icon className="mb-4 h-6 w-6 text-primary" aria-hidden="true" />
              <h3 className="text-lg font-semibold">{method.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{method.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/10 p-5 text-sm leading-6 text-slate-200">
          <strong className="text-white">Default weights:</strong> technicals 26%, news sentiment 22%, volume 22%, momentum 18%, operations/news catalyst 12%.
          You can edit these in <code className="rounded bg-slate-950 px-1.5 py-0.5">lib/market/config.ts</code> as your research improves.
        </div>
      </div>
    </section>
  );
}
