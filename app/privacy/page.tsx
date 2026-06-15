import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for TradeSignal Daily."
};

export default function PrivacyPage() {
  return (
    <div className="container py-16">
      <article className="prose prose-invert mx-auto max-w-4xl prose-p:text-slate-300 prose-li:text-slate-300 prose-headings:text-white">
        <h1>Privacy Policy</h1>
        <p>
          This sample privacy policy is provided for a personal research build. Have an attorney review it before making the
          site public, adding analytics, capturing emails, processing payments, or creating user accounts.
        </p>

        <h2>Information collected</h2>
        <p>
          This starter project does not require user accounts and does not intentionally collect brokerage credentials or bank
          information. Do not ask users to share brokerage login details or personal financial account details.
        </p>

        <h2>Environment variables and API keys</h2>
        <p>
          API keys are intended to stay server-side through Next.js Route Handlers and GitHub Actions secrets. Do not place API
          keys in client components, browser-visible JavaScript, public files, or committed source files.
        </p>

        <h2>Third-party providers</h2>
        <p>
          Market data, news, hosting, deployment, analytics, and brokerage links may involve third-party services. Review each
          provider&apos;s privacy policy and terms before public use.
        </p>
      </article>
    </div>
  );
}
