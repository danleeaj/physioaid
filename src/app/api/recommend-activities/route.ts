import { NextResponse } from "next/server";
import { communityActivities } from "@/lib/demo/community";

/**
 * Activity recommendation seam.
 *
 * Today this serves the curated demonstration dataset, ranked so the
 * participant's self-reported planning area comes first. It exists as a
 * server route (rather than client-side filtering) because this is exactly
 * where a real recommendation pipeline plugs in:
 *
 *   1. A scheduled server-side job fetches public directories — e.g. the
 *      AIC Active Ageing Centre listing (aic.sg/care-services/
 *      active-ageing-centres) — which a browser cannot fetch directly
 *      (CORS, and scraping belongs on the server anyway).
 *   2. An LLM call (Claude / OpenAI) extracts each centre into the
 *      CommunityActivity shape {title, venue, schedule, spots, area} and
 *      the results are cached in a database or KV store.
 *   3. This handler then ranks the cached records for the requested area —
 *      optionally with a second LLM call for natural-language matching
 *      ("gentle, seated, morning") — and returns the same JSON shape, so
 *      the UI needs no changes when the real pipeline lands.
 *
 * The participant's area arrives as a query param and is never stored
 * server-side by this route.
 */
export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const area = searchParams.get("area");

  const ranked = area
    ? [...communityActivities].sort((a, b) => {
        const aNear = a.area === area ? 0 : 1;
        const bNear = b.area === area ? 0 : 1;
        return aNear - bNear;
      })
    : communityActivities;

  return NextResponse.json({
    source: "curated-demo",
    area: area ?? null,
    activities: ranked.slice(0, 4),
  });
}
