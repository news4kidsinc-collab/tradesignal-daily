import { AlertOctagon, Ban, Scale, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const risks = [
  {
    title: "You can lose money quickly",
    icon: AlertOctagon,
    copy: "Day trading is speculative. Price can move against you before you can react, especially during news spikes and opening volatility."
  },
  {
    title: "Stops are not guarantees",
    icon: ShieldAlert,
    copy: "Stop-loss orders can slip, fail to fill at the expected price, or execute poorly in fast markets and wide spreads."
  },
  {
    title: "No personalized advice",
    icon: Scale,
    copy: "This site does not know your income, goals, debt, taxes, time horizon, risk tolerance, or legal obligations."
  },
  {
    title: "No affiliation",
    icon: Ban,
    copy: "This research site is not affiliated with, endorsed by, or sponsored by Robinhood or any listed company."
  }
];

export function RisksSection() {
  return (
    <section id="risks" className="border-y border-amber-400/20 bg-amber-400/10 py-20">
      <div className="container">
        <div className="mb-10 max-w-3xl">
          <Badge variant="warning" className="mb-4">Required risk disclosure</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-amber-50 sm:text-4xl">Risks & disclaimers</h2>
          <p className="mt-3 text-sm leading-7 text-amber-50/80">
            This section should remain prominent on every production version. Do not hide it behind a link, place it only in
            the footer, or weaken it with fine print.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {risks.map((risk) => {
            const Icon = risk.icon;
            return (
              <div key={risk.title} className="rounded-2xl border border-amber-400/20 bg-slate-950/75 p-5">
                <Icon className="mb-4 h-7 w-7 text-amber-200" aria-hidden="true" />
                <h3 className="font-semibold text-amber-50">{risk.title}</h3>
                <p className="mt-2 text-sm leading-6 text-amber-50/75">{risk.copy}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-red-400/30 bg-red-500/10 p-6 text-sm leading-7 text-red-100">
          <strong>Important:</strong> The picks shown on this site are research outputs from a scoring model and should not be treated as instructions to trade.
          Real trade recommendations may trigger legal, regulatory, advertising, licensing, and compliance obligations.
        </div>
      </div>
    </section>
  );
}
