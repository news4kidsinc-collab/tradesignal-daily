"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyTickerButton({ ticker }: { ticker: string }) {
  const [copied, setCopied] = useState(false);

  async function copyTicker() {
    try {
      await navigator.clipboard.writeText(ticker);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={copyTicker} aria-label={`Copy ${ticker} ticker symbol`}>
      {copied ? <Check className="h-4 w-4 text-emerald-300" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}
