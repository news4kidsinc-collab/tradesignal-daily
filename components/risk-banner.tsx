import { AlertTriangle } from "lucide-react";

export function RiskBanner() {
  return (
    <div className="border-b border-amber-400/20 bg-amber-400/10 px-4 py-2 text-center text-xs text-amber-100">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          Personal research and education only. Trading involves substantial risk. This website does not provide personalized financial,
          investment, tax, or legal advice.
        </p>
      </div>
    </div>
  );
}
