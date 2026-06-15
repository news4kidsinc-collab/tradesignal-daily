# TradeSignal Daily

A **Next.js 15 + TypeScript + Tailwind + shadcn/ui-style** personal stock-movement research dashboard. It pulls daily market/research data server-side, scores five short-term trade research ideas, and shows exactly which factors are influencing the score as **Good**, **Bad**, or **Neutral**.

> **Important:** This is for personal research and education only. It is not financial advice, not trading advice, not a brokerage service, and not affiliated with Robinhood. API data can be live, delayed, cached, incomplete, or inaccurate depending on your provider plan.

## What changed from the first static version

The original version used isolated mock data because a deployable public project cannot safely include private API keys. This version is live-data ready:

- Server-side `/api/picks` route handler keeps API keys private
- Daily quote, volume, company profile, news, and historical-price pull through Financial Modeling Prep
- Optional Alpha Vantage News & Sentiment overlay
- Transparent weighted factor model
- Factor-by-factor influence labels: Good, Bad, Neutral
- `Update Picks` button that refreshes the server-side research endpoint
- GitHub Actions + Python script that can write `data/latest-picks.json` every weekday
- Netlify-ready dynamic Next.js deployment

## Tech Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style components
- Framer Motion
- Lucide icons
- Netlify deployment
- GitHub Actions automation
- Python daily data script

## Data sources supported

### Financial Modeling Prep
Used for:

- Quote data
- Price change
- Current volume
- Average volume
- Company profile
- Historical OHLCV bars
- Stock news

Required environment variable:

```bash
FMP_API_KEY=your_key_here
```

### Alpha Vantage
Optional overlay for:

- Ticker-specific news sentiment
- Sentiment score blending

Required environment variable:

```bash
ALPHA_VANTAGE_API_KEY=your_key_here
```

## Local setup

```bash
cd tradesignal-daily
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```bash
FMP_API_KEY=your_financial_modeling_prep_key_here
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
TRADE_TICKERS=SOFI,PLTR,HOOD,RIVN,F,BAC,INTC,SNAP,UBER,AMD
```

Run locally:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## How the live data flow works

1. The browser loads the page.
2. `components/picks-dashboard.tsx` calls `/api/picks`.
3. `app/api/picks/route.ts` runs server-side.
4. `lib/market/analyze.ts` fetches provider data and scores the ticker universe.
5. The API returns five ranked research picks.
6. The UI shows price, change, RSI, relative volume, score, trade levels, and factor influence labels.

API keys stay on the server. Do not put provider keys in client components or public files.

## Factor model

Default weights live in:

```text
lib/market/config.ts
```

Current model:

```text
Technicals: 26%
News sentiment: 22%
Volume: 22%
Momentum: 18%
Operations/news catalyst: 12%
```

Every card shows the factor list:

- News sentiment
- Technical setup
- Volume pressure
- Price momentum
- Operations/news catalyst

Each factor includes:

- Value
- Score
- Weight
- Good / Bad / Neutral label
- Short reason
- Data source

## Change the ticker universe

Edit:

```text
data/ticker-universe.ts
```

Or set:

```bash
TRADE_TICKERS=SOFI,PLTR,HOOD,RIVN,F,BAC,INTC,SNAP,UBER,AMD
```

Keep the list small on free API tiers. Each ticker can consume quote, profile, historical, news, and sentiment requests.

## Run the Python daily pull manually

```bash
python3 scripts/update_picks.py
```

This writes:

```text
data/latest-picks.json
```

The website uses this JSON as fallback/cached research data when live API keys are missing or provider calls fail.

## GitHub Actions daily automation

Workflow file:

```text
.github/workflows/update-picks.yml
```

Add these GitHub secrets:

```text
FMP_API_KEY
ALPHA_VANTAGE_API_KEY
NETLIFY_BUILD_HOOK_URL optional
```

Add this GitHub variable if you want a custom universe:

```text
TRADE_TICKERS
```

The workflow runs weekdays at 12:10 UTC. During daylight saving time, that is 8:10 AM Eastern.

## Deploy to Netlify

1. Push the project to GitHub.
2. In Netlify, choose **Add new site** → **Import from Git**.
3. Select the repository.
4. Build command:

```bash
npm run build
```

5. Publish directory:

```text
.next
```

6. Add environment variables in Netlify:

```text
FMP_API_KEY
ALPHA_VANTAGE_API_KEY
TRADE_TICKERS
```

Netlify supports Next.js App Router and Route Handlers, so `/api/picks` can run server-side.

## Connect a Namecheap domain to Netlify

1. In Netlify, go to **Site configuration** → **Domain management**.
2. Add your custom domain.
3. Netlify will show the DNS records it expects.
4. In Namecheap, open **Domain List** → **Manage** → **Advanced DNS**.
5. Remove conflicting parking or redirect records.
6. Add Netlify’s required records.
7. Usually:
   - `www` uses a CNAME pointing to your Netlify site.
   - Root/apex domain uses Netlify DNS or the records Netlify provides.
8. Return to Netlify and verify DNS.
9. Enable HTTPS after DNS resolves.

## Files to edit most often

```text
data/ticker-universe.ts        # symbols scanned daily
lib/market/config.ts          # scoring weights
lib/market/scoring.ts         # factor scoring rules
lib/market/analyze.ts         # live-pick construction logic
scripts/update_picks.py       # scheduled daily JSON generation
```

## Risk and compliance notes

- Do not present the model as guaranteed or predictive.
- Do not remove disclaimers.
- Do not store brokerage credentials.
- Do not execute trades automatically.
- Verify provider terms before public/commercial use.
- If this becomes a public recommendation site, get legal/compliance review.
