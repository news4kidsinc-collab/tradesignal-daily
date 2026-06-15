import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { RiskBanner } from "@/components/risk-banner";

export const metadata: Metadata = {
  title: {
    default: "TradeSignal Daily | Daily Data-Driven Day Trade Picks",
    template: "%s | TradeSignal Daily"
  },
  description:
    "A personal stock-movement research dashboard for five daily short-term trade ideas with transparent factor scoring, real API data support, and prominent risk disclaimers.",
  keywords: [
    "day trading",
    "stock picks",
    "Robinhood",
    "technical analysis",
    "market sentiment",
    "momentum stocks"
  ],
  authors: [{ name: "TradeSignal Daily" }],
  creator: "TradeSignal Daily",
  publisher: "TradeSignal Daily",
  metadataBase: new URL("https://tradesignaldaily.com"),
  openGraph: {
    title: "TradeSignal Daily",
    description: "Daily data-driven stock research with factor scoring and strong risk education.",
    url: "https://tradesignaldaily.com",
    siteName: "TradeSignal Daily",
    locale: "en_US",
    type: "website"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <RiskBanner />
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
