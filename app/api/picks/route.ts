import { NextResponse } from "next/server";
import { getDailyResearchPicks } from "@/lib/market/analyze";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const refresh = url.searchParams.get("refresh") === "1";
  const providerParam = url.searchParams.get("provider");
  const provider = providerParam === "finnhub" || providerParam === "fmp" ? providerParam : "auto";
  const symbols = (url.searchParams.get("symbols") ?? "")
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean);

  try {
    const snapshot = await getDailyResearchPicks({ refresh, provider, symbols });
    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": refresh ? "no-store" : "s-maxage=300, stale-while-revalidate=900"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        asOf: new Date().toISOString(),
        dataStatus: "error",
        dataDelayNote: "The live research endpoint failed.",
        providerNote: "Check API environment variables and provider account permissions.",
        universe: [],
        picks: [],
        errors: [error instanceof Error ? error.message : "Unknown API route error"]
      },
      { status: 500 }
    );
  }
}
