import type { AssessmentSession } from "@/types/assessment";

/** Schema version stamped on every session the app writes today. */
export const CURRENT_SESSION_SCHEMA = 2;

/**
 * Explicit demo sessions are the only place demo metrics are legitimate
 * content (keyed by id, always labelled in the UI).
 */
export function isDemoSessionId(id: string): boolean {
  return id === "demo-mr-tan" || id.startsWith("demo-");
}

type DemoStrippable = {
  completionStatus?: string;
  source?: string;
};

/**
 * v1 metrics whose status or source is "demo" were seeded by the old guided
 * flow's default state — they are not evidence of anything the participant
 * did, so they normalize to undefined ("not attempted").
 */
function stripIfDemoSeeded<T extends DemoStrippable>(
  metric: T | undefined,
): T | undefined {
  if (!metric || typeof metric !== "object") return undefined;
  if (metric.completionStatus === "demo" || metric.source === "demo") {
    return undefined;
  }
  return metric;
}

/**
 * Normalize a session read from any storage (Firestore, localStorage,
 * sessionStorage) to the current schema — purely in memory, never rewriting
 * storage.
 *
 * - Structurally invalid payloads return null.
 * - schemaVersion 2 sessions pass through unchanged.
 * - v1 sessions (no schemaVersion) on non-demo ids get their demo-seeded
 *   test metrics stripped to undefined; the questionnaire is kept (v1 answers
 *   are indistinguishable from real ones). Explicit demo ids keep everything.
 */
export function normalizeSession(raw: unknown): AssessmentSession | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Record<string, unknown>;
  if (typeof candidate.id !== "string") return null;
  if (typeof candidate.createdAt !== "string") return null;
  if (!candidate.consent || typeof candidate.consent !== "object") return null;
  if (!candidate.safetyScreen || typeof candidate.safetyScreen !== "object") {
    return null;
  }

  const session = candidate as unknown as AssessmentSession;

  if (session.schemaVersion === CURRENT_SESSION_SCHEMA) {
    return session;
  }

  // v1 session. Explicit demo sessions keep their demo metrics — they are
  // legitimate sample content, always rendered with a demo banner.
  if (isDemoSessionId(session.id)) {
    return { ...session, schemaVersion: CURRENT_SESSION_SCHEMA };
  }

  return {
    ...session,
    schemaVersion: CURRENT_SESSION_SCHEMA,
    chairStand: stripIfDemoSeeded(session.chairStand),
    motion: stripIfDemoSeeded(session.motion),
    floorRising: stripIfDemoSeeded(session.floorRising),
    vision: stripIfDemoSeeded(session.vision),
  };
}
