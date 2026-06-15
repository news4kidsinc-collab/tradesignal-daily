import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms of use for TradeSignal Daily."
};

export default function TermsPage() {
  return (
    <div className="container py-16">
      <article className="prose prose-invert mx-auto max-w-4xl prose-p:text-slate-300 prose-li:text-slate-300 prose-headings:text-white">
        <h1>Terms of Use</h1>
        <p>
          Personal research and education only. Trading involves substantial risk. Nothing on this website is financial advice,
          legal advice, tax advice, or a recommendation to buy, sell, or hold any security.
        </p>

        <h2>Use at your own risk</h2>
        <p>
          By using this website, you agree that all content is provided for informational purposes only. You are solely responsible
          for verifying data, reviewing source material, and making your own financial decisions.
        </p>

        <h2>Data and model outputs</h2>
        <p>
          Data may be live, delayed, cached, incomplete, inaccurate, or unavailable. Model scores, factor labels, entry ranges,
          targets, stop-losses, and exit notes are research outputs only and may be wrong.
        </p>

        <h2>No warranty</h2>
        <p>
          This site is provided as-is without warranty of any kind. The operators are not liable for losses, damages, missed
          opportunities, technical errors, data-provider issues, or brokerage execution problems.
        </p>

        <h2>Third-party services</h2>
        <p>
          This site may link to Robinhood or use third-party market data providers. Those services are governed by their own
          terms, policies, pricing, and data entitlements.
        </p>
      </article>
    </div>
  );
}
