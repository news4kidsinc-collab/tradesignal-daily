import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Risks & Disclaimers",
  description: "Risk disclosures for TradeSignal Daily."
};

export default function DisclaimersPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-6 text-amber-50">
          <div className="mb-3 flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            Read before using this site
          </div>
          <p className="text-sm leading-7">
            TradeSignal Daily is a personal research and education tool. It does not provide personalized financial advice,
            investment advice, tax advice, legal advice, brokerage services, or guaranteed trading results.
          </p>
        </div>

        <article className="prose prose-invert max-w-none prose-p:text-slate-300 prose-li:text-slate-300 prose-headings:text-white">
          <h1>Risks & Disclaimers</h1>

          <h2>No financial advice</h2>
          <p>
            All content is provided for personal research and educational purposes only. Nothing on this site is a recommendation
            to buy, sell, short, hold, or otherwise transact in any security. You are responsible for your own research,
            judgment, risk management, and compliance obligations.
          </p>

          <h2>Market data limitations</h2>
          <p>
            Market data may be live, delayed, cached, incomplete, inaccurate, or unavailable depending on API provider limits,
            exchange entitlements, network conditions, and your account plan. Always verify price, volume, spreads, halts,
            news, and order details directly inside your brokerage platform before making any decision.
          </p>

          <h2>Research model limitations</h2>
          <p>
            Scores and factor labels are model outputs, not facts. A factor marked Good, Bad, or Neutral only describes how the
            model scored that input. It does not mean a trade will succeed or fail. Technical indicators, news sentiment, and
            volume filters can produce false signals.
          </p>

          <h2>Day trading risk</h2>
          <p>
            Day trading can result in rapid and substantial losses. Volatility, liquidity, spreads, slippage, order delays,
            outages, and emotional decision-making can all harm results. Never trade money you cannot afford to lose.
          </p>

          <h2>Past performance</h2>
          <p>
            Any performance information shown on this site may be sample, synthetic, backtested, incomplete, or hypothetical.
            Past performance does not guarantee future results. Backtests often fail to account for slippage, taxes, order
            execution, borrow costs, liquidity constraints, and real-world trader behavior.
          </p>

          <h2>Robinhood affiliation</h2>
          <p>
            TradeSignal Daily is not affiliated with, endorsed by, sponsored by, or approved by Robinhood Markets, Inc. Links
            to Robinhood are provided for convenience only and may change or fail.
          </p>
        </article>
      </div>
    </div>
  );
}
