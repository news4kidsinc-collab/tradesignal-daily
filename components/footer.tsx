import Link from "next/link";
import { Activity } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/70">
      <div className="container grid gap-8 py-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="mb-3 flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
              <Activity className="h-4 w-4" aria-hidden="true" />
            </span>
            TradeSignal Daily
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            A personal research dashboard for transparent short-term stock-movement analysis. No content on this site is a
            recommendation to buy, sell, or hold any security.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold">Legal</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link className="hover:text-foreground" href="/disclaimers/">Risks & Disclaimers</Link></li>
            <li><Link className="hover:text-foreground" href="/terms/">Terms of Use</Link></li>
            <li><Link className="hover:text-foreground" href="/privacy/">Privacy Policy</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold">Risk Notice</h2>
          <p className="risk-text">
            Day trading can result in rapid losses. Provider data can be live, delayed, cached, incomplete, or inaccurate. Always consult a qualified
            financial professional before making investment decisions.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} TradeSignal Daily. Personal research tool. Not affiliated with Robinhood Markets, Inc.
      </div>
    </footer>
  );
}
