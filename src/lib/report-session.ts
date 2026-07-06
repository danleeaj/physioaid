import type { AssessmentSession } from "@/types/assessment";

const STORAGE_PREFIX = "physioaid:report:";

/**
 * Hands the completed session to the report page via sessionStorage (per-tab,
 * cleared when the tab closes — nothing is persisted beyond the session).
 * Always returns `session.id` so the report page can still resolve the
 * session from Firestore (for signed-in users) if sessionStorage write fails
 * or the id is opened in a different tab/device.
 */
export function saveSessionForReport(session: AssessmentSession): string {
  try {
    window.sessionStorage.setItem(
      `${STORAGE_PREFIX}${session.id}`,
      JSON.stringify(session),
    );
  } catch {
    // sessionStorage unavailable/full — the report page falls back to a
    // Firestore lookup by id for signed-in users.
  }
  return session.id;
}

export function loadSessionForReport(
  id: string,
): AssessmentSession | undefined {
  try {
    const raw = window.sessionStorage.getItem(`${STORAGE_PREFIX}${id}`);
    if (!raw) {
      return undefined;
    }
    return JSON.parse(raw) as AssessmentSession;
  } catch {
    return undefined;
  }
}
