/**
 * Legacy local practice log (device-local, one date string per day a check
 * was completed).
 *
 * @deprecated Superseded by `src/lib/movement-log.ts` (Goal 6), which is
 * user-owned, typed, and synced for firebase accounts. This module is kept
 * read-only so pre-existing `physioaid.practice-log` entries still count
 * toward the weekly goal during the transition — `getActiveDaysThisWeek`
 * unions these day strings with real movement-log entries. Do not add new
 * writers; the key drains naturally as movement-log becomes the only writer.
 */

const STORAGE_KEY = "physioaid.practice-log";

export function loadPracticeLog(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((d) => typeof d === "string") : [];
  } catch {
    return [];
  }
}
