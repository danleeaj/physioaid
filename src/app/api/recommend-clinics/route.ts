import { NextResponse } from "next/server";
import { clinics, type Clinic } from "@/lib/demo/clinics";

/**
 * AI clinic recommendation seam — mirrors `/api/recommend-activities`.
 *
 * When OPENAI_API_KEY is configured the handler asks the OpenAI Chat
 * Completions API to pick and rank clinics relevant to the participant's
 * assessment results and planning area. Only anonymous data reaches the
 * model: planning area, risk band, completed test IDs, and concern tags.
 * Never names, ages, dates, or session IDs.
 *
 * Without a key — or on any error — the handler falls back to a simple
 * area-match + type-relevance ranking.
 */

const OPENAI_TIMEOUT_MS = 6000;
const MAX_RESULTS = 4;
const RISK_BANDS = new Set(["low", "moderate", "high"]);
const VALID_TESTS = new Set([
  "self_confidence",
  "sit_to_stand",
  "walk",
  "floor_rising",
]);
const VALID_CONCERNS = new Set([
  "low_confidence",
  "reduced_lower_limb_strength",
  "slow_gait",
  "poor_balance",
  "floor_rising_difficulty",
]);

type RecommendedClinic = Clinic & { why?: string };

type SanitizedPayload = {
  area: string | null;
  riskCategory: string | null;
  testsCompleted: string[];
  concerns: string[];
};

function sanitizePayload(raw: unknown): SanitizedPayload {
  const body =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const area =
    typeof body.area === "string" && body.area.trim().length > 0
      ? body.area.trim().slice(0, 50)
      : null;

  const riskCategory =
    typeof body.riskCategory === "string" && RISK_BANDS.has(body.riskCategory)
      ? body.riskCategory
      : null;

  const testsCompleted: string[] = [];
  if (Array.isArray(body.testsCompleted)) {
    for (const t of body.testsCompleted) {
      if (typeof t === "string" && VALID_TESTS.has(t)) {
        testsCompleted.push(t);
      }
    }
  }

  const concerns: string[] = [];
  if (Array.isArray(body.concerns)) {
    for (const c of body.concerns) {
      if (typeof c === "string" && VALID_CONCERNS.has(c)) {
        concerns.push(c);
      }
    }
  }

  return { area, riskCategory, testsCompleted, concerns };
}

function curatedRanking(payload: SanitizedPayload): RecommendedClinic[] {
  const typeOrder: Record<string, string[]> = {
    high: ["physiotherapy", "community_health_post", "polyclinic", "occupational_therapy"],
    moderate: ["community_health_post", "physiotherapy", "polyclinic", "occupational_therapy"],
    low: ["community_health_post", "polyclinic", "physiotherapy", "occupational_therapy"],
  };
  const order = typeOrder[payload.riskCategory ?? "low"];
  const ranked = [...clinics].sort((a, b) => {
    const aLocal = payload.area && a.area === payload.area ? 0 : 1;
    const bLocal = payload.area && b.area === payload.area ? 0 : 1;
    if (aLocal !== bLocal) return aLocal - bLocal;
    return order.indexOf(a.type) - order.indexOf(b.type);
  });
  return ranked.slice(0, MAX_RESULTS);
}

async function aiRanking(
  apiKey: string,
  payload: SanitizedPayload,
): Promise<RecommendedClinic[] | null> {
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
              "You are a supportive care-navigation assistant for a physiotherapy screening tool used with older adults in Singapore. " +
              "You provide decision support only — never diagnosis or medical advice. " +
              "Given a list of clinics with their services, a participant's planning area, risk band, completed tests, and identified concerns, " +
              "pick the 3–4 most relevant clinics. " +
              "Rules:\n" +
              "1. STRONGLY prefer clinics in or near the participant's planning area.\n" +
              "2. Match clinic services to identified concerns — e.g. slow_gait → gait rehab, low_confidence → confidence building, floor_rising_difficulty → floor transfer practice.\n" +
              "3. For 'high' risk, prefer physiotherapy clinics first. For 'moderate', mix physio and community support. For 'low', community health posts are fine.\n" +
              "4. Add a short supportive 'why' sentence (max 120 chars) per clinic explaining why it suits this participant.\n" +
              "5. Use warm, encouraging language — 'may help with' not 'you need'.\n\n" +
              'Reply with strict JSON: {"recommendations":[{"id":"<clinic id>","why":"<one short, warm sentence>"}]}',
          },
          {
            role: "user",
            content: JSON.stringify({
              area: payload.area ?? "unknown",
              riskCategory: payload.riskCategory ?? "unknown",
              testsCompleted: payload.testsCompleted,
              concerns: payload.concerns,
              clinics: clinics.map((c) => ({
                id: c.id,
                name: c.name,
                type: c.type,
                area: c.area,
                services: c.services,
              })),
            }),
          },
        ],
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return null;
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed?.recommendations)) return null;

    const byId = new Map(clinics.map((c) => [c.id, c]));
    const picked: RecommendedClinic[] = [];
    for (const item of parsed.recommendations) {
      const clinic = byId.get(item?.id);
      if (clinic && !picked.some((p) => p.id === clinic.id)) {
        picked.push({
          ...clinic,
          why:
            typeof item.why === "string"
              ? item.why.slice(0, 200)
              : undefined,
        });
      }
      if (picked.length >= MAX_RESULTS) break;
    }
    return picked.length > 0 ? picked : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request: Request) {
  let raw: unknown = null;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({
      source: "curated",
      clinics: curatedRanking({ area: null, riskCategory: null, testsCompleted: [], concerns: [] }),
    });
  }

  const payload = sanitizePayload(raw);

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    const result = await aiRanking(apiKey, payload);
    if (result) {
      return NextResponse.json({
        source: "ai",
        clinics: result,
      });
    }
  }

  return NextResponse.json({
    source: "curated",
    clinics: curatedRanking(payload),
  });
}
