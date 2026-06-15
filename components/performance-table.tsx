import { sampleBacktest } from "@/data/performance";
import { Badge } from "@/components/ui/badge";

export function PerformanceTable() {
  return (
    <section id="performance" className="py-20">
      <div className="container">
        <div className="mb-8 max-w-3xl">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">Heavily disclaimed sample</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Past performance preview</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            The table below uses synthetic sample backtest rows to demonstrate layout. Past performance, even when real, does
            not guarantee future results.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">Sample backtested performance table</caption>
              <thead className="border-b border-white/10 bg-slate-950/80 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Sample</th>
                  <th className="px-4 py-3">Win Rate</th>
                  <th className="px-4 py-3">Avg Gain</th>
                  <th className="px-4 py-3">Avg Loss</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {sampleBacktest.map((row) => (
                  <tr key={row.period} className="border-b border-white/10 last:border-0">
                    <td className="px-4 py-4 font-medium">{row.period}</td>
                    <td className="px-4 py-4 text-muted-foreground">{row.sampleSize}</td>
                    <td className="px-4 py-4 text-emerald-300">{row.winRate}</td>
                    <td className="px-4 py-4 text-emerald-300">{row.averageGain}</td>
                    <td className="px-4 py-4 text-red-300">{row.averageLoss}</td>
                    <td className="px-4 py-4 text-muted-foreground">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-white/10 p-4 text-xs leading-6 text-amber-100/85">
            Real reporting should include slippage, spread, rejected orders, data survivorship bias, delayed entries, tax impact,
            market regime, drawdown, and total account-level risk.
          </p>
        </div>
      </div>
    </section>
  );
}
