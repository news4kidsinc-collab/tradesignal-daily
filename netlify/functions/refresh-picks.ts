import type { Handler } from "@netlify/functions";

// Optional Netlify Function scaffold for a future protected refresh endpoint.
// The main live endpoint is now app/api/picks/route.ts, which runs server-side
// in Next.js and keeps API keys private.
export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed. Use POST." })
    };
  }

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ok: true,
      message: "Use /api/picks?refresh=1 for server-side live research refresh. Protect this function with an admin secret before exposing it."
    })
  };
};
