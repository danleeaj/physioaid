import type { AssessmentSession } from "@/types/assessment";

const STORAGE_PREFIX = "physioaid:report:";

/**
 * Hands the completed session to the report page via sessionStorage (per-tab,
 * cleared when the tab closes — nothing is persisted beyond the session).
 * Returns the id to link to. The report page falls back to demo data when the
 * id cannot be found, and labels that state clearly.
 */
export function saveSessionForReport(session: AssessmentSession): string {
  try {
    window.sessionStorage.setItem(
      `${STORAGE_PREFIX}${session.id}`,
      JSON.stringify(session),
    );
    return session.id;
  } catch {
    return "demo";
  }
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
