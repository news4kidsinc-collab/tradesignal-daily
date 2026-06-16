# TradeSignal Daily

A personal-use Next.js 15 research dashboard for studying short-term stock movement factors. The site is not investment advice, not automated trading, and not a guarantee of profit.

## What this version adds

- Manual symbol scanner in the dashboard.
- Choose symbols from the Robinhood-compatible ticker directory.
- FMP/Alpha mode is capped at **3 selected symbols**.
- Finnhub mode is capped at **5 selected symbols**.
- Optional `FINNHUB_API_KEY` support for quote, daily candles, company profile, and company news.
- Top Follow favorites still save in the browser for easier tracking.
- GitHub Actions now supports `DATA_PROVIDER=finnhub`.

## Why Finnhub mode was added

Alpha Vantage free stock API usage is very tight, so the project should not use Alpha Vantage as the primary quote/history provider for repeated scans. Alpha Vantage is best used only as an optional sentiment overlay. Finnhub is better for small manual scans because its free plan is commonly listed at 60 API calls per minute, while Alpha Vantage support lists free stock API usage at 25 requests per day.

## Local setup

Create `.env.local`:

```bash
FMP_API_KEY=your_financial_modeling_prep_key_here
FINNHUB_API_KEY=your_finnhub_key_here
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
DATA_PROVIDER=finnhub
TRADE_TICKERS=SOFI,PLTR,HOOD,RIVN,F
MAX_SCAN_TICKERS=5
BUILD_ROBINHOOD_UNIVERSE=false
```

Then run:

```bash
npm install
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Manual symbol scanner

On the dashboard:

1. Choose provider:
   - **Finnhub: 5 symbols**
   - **FMP/Alpha: 3 symbols**
2. Type a ticker or choose from the suggestions.
3. Add up to the allowed symbol limit.
4. Click **Scan**.
5. Review the factor scores and save favorites with the star button.

The manual scanner calls:

```txt
/api/picks?refresh=1&provider=finnhub&symbols=SOFI,PLTR,HOOD,RIVN,F
```

or:

```txt
/api/picks?refresh=1&provider=fmp&symbols=SOFI,PLTR,HOOD
```

## GitHub Actions setup

Add these GitHub Secrets:

```txt
FMP_API_KEY
FINNHUB_API_KEY
ALPHA_VANTAGE_API_KEY
NETLIFY_BUILD_HOOK_URL
```

Add these GitHub Variables:

```txt
DATA_PROVIDER = finnhub
TRADE_TICKERS = SOFI,PLTR,HOOD,RIVN,F
MAX_SCAN_TICKERS = 5
BUILD_ROBINHOOD_UNIVERSE = false
```

For FMP mode, use:

```txt
DATA_PROVIDER = fmp
TRADE_TICKERS = SOFI,PLTR,HOOD
MAX_SCAN_TICKERS = 3
```

## Netlify environment variables

Add these in Netlify under **Site configuration → Environment variables**:

```txt
FMP_API_KEY
FINNHUB_API_KEY
ALPHA_VANTAGE_API_KEY
DATA_PROVIDER
TRADE_TICKERS
MAX_SCAN_TICKERS
BUILD_ROBINHOOD_UNIVERSE
```

Suggested values:

```txt
DATA_PROVIDER = finnhub
TRADE_TICKERS = SOFI,PLTR,HOOD,RIVN,F
MAX_SCAN_TICKERS = 5
BUILD_ROBINHOOD_UNIVERSE = false
```

After changing environment variables, run:

```txt
Netlify → Deploys → Trigger deploy → Clear cache and deploy site
```

## Important research limits

Scanning a broad universe can burn through API limits quickly. A single ticker can require quote, profile, historical/candles, news, and optional sentiment calls. For free/low-tier plans, keep manual scans small.

Recommended starting point:

```txt
Finnhub mode: 5 selected tickers
FMP/Alpha mode: 3 selected tickers
Alpha Vantage: sentiment overlay only
```

## Risk disclaimer

This project is for personal research and education. It is not financial advice, a recommendation to buy or sell securities, or a guarantee of performance. Verify every ticker, quote, data delay, and Robinhood availability before making any decision.
