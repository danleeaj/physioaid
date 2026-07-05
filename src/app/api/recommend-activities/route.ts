import { NextResponse } from "next/server";
import {
  communityActivities,
  type CommunityActivity,
} from "@/lib/demo/community";

/**
 * Activity recommendation seam — now AI-enabled.
 *
 * When OPENAI_API_KEY is configured (server-side env, never NEXT_PUBLIC),
 * the handler asks the OpenAI Chat Completions API to pick and rank four of
 * the curated activities for the requested area and coarse risk band, adding
 * a short supportive "why" per activity. Only the area and an anonymous
 * risk band (low|moderate|high) reach the model — never names, ages, scores,
 * or any other personal data.
 *
 * Without a key — or on any timeout, API error, or malformed response — the
 * handler falls back to the original curated ranking, so the route never
 * fails to the client. The response `source` field is honest about which
 * path produced the result ("ai" vs "curated-demo").
 */

type RecommendedActivity = CommunityActivity & { why?: string };

const OPENAI_TIMEOUT_MS = 5000;
const RISK_BANDS = new Set(["low", "moderate", "high"]);

function curatedRanking(area: string | null): RecommendedActivity[] {
  const ranked = area
    ? [...communityActivities].sort((a, b) => {
        const aNear = a.area === area ? 0 : 1;
        const bNear = b.area === area ? 0 : 1;
        return aNear - bNear;
      })
    : communityActivities;
  return ranked.slice(0, 4);
}

async function aiRanking(
  apiKey: string,
  area: string | null,
  risk: string | null,
): Promise<RecommendedActivity[] | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a supportive community-activity matcher for older adults in Singapore. " +
              "You provide decision support only — never diagnosis or medical advice. "
              +
              "Given a list of activities, a neighbourhood, and a coarse mobility-support band, " +
              "pick the 4 most suitable activities. Prefer the participant's neighbourhood, and " +
              "for 'high' support bands prefer seated or supervised options. " +
              'Reply with strict JSON: {"recommendations":[{"id":"<activity id>","why":"<one short, warm sentence>"}]}',
          },
          {
            role: "user",
            content: JSON.stringify({
              area: area ?? "unknown",
              supportBand: risk ?? "unknown",
              activities: communityActivities,
            }),
          },
        ],
      }),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return null;
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed?.recommendations)) return null;

    const byId = new Map(communityActivities.map((a) => [a.id, a]));
    const picked: RecommendedActivity[] = [];
    for (const item of parsed.recommendations) {
      const activity = byId.get(item?.id);
      if (activity && !picked.some((p) => p.id === activity.id)) {
        picked.push({
          ...activity,
          why: typeof item.why === "string" ? item.why.slice(0, 200) : undefined,
        });
      }
      if (picked.length === 4) break;
    }
    return picked.length > 0 ? picked : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const area = searchParams.get("area");
  const riskParam = searchParams.get("risk");
  const risk = riskParam && RISK_BANDS.has(riskParam) ? riskParam : null;

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    const aiResult = await aiRanking(apiKey, area, risk);
    if (aiResult) {
      return NextResponse.json({
        source: "ai",
        area: area ?? null,
        activities: aiResult,
      });
    }
  }

  return NextResponse.json({
    source: "curated-demo",
    area: area ?? null,
    activities: curatedRanking(area),
  });
}
