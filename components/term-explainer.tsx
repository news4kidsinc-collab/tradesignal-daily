"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

const terms = [
  {
    term: "RSI",
    definition:
      "Relative Strength Index. A momentum indicator often used to estimate whether a ticker may be overbought or oversold. It is not a buy or sell signal by itself."
  },
  {
    term: "VWAP",
    definition:
      "Volume Weighted Average Price. Many day traders use it as an intraday reference point for price strength, weakness, and institutional participation."
  },
  {
    term: "Sentiment Score",
    definition:
      "A model-generated estimate of whether news and market discussion appear positive, neutral, or negative for a ticker. It must be verified against source quality."
  },

  {
    term: "Relative Volume",
    definition:
      "Current trading volume divided by recent average volume. Higher relative volume can indicate stronger attention, but extremely high volume can also mean volatility risk."
  },
  {
    term: "Good / Bad Influence",
    definition:
      "A label showing how each factor affected the model score. Good supports the rank, Bad hurts it, and Neutral means the signal is mixed or incomplete."
  },
  {
    term: "Stop-Loss",
    definition:
      "A preplanned exit level intended to reduce downside. A stop-loss can slip in fast markets and does not guarantee a specific execution price."
  }
];

export function TermExplainer() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10">
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
          Explain terms
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Trading term guide</DialogTitle>
          <DialogDescription>
            Educational definitions for reading the daily research cards. These terms are not trading instructions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {terms.map((item) => (
            <div key={item.term} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <h3 className="font-semibold text-primary">{item.term}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.definition}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
