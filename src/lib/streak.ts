/**
 * Local practice log powering the streak and active-days display.
 *
 * Deliberately device-local (localStorage) for the MVP: no account, no
 * server, nothing leaves the phone. A real multi-device version would move
 * this to a backend (see /community architecture notes in the PR).
 */

const STORAGE_KEY = "physioaid.practice-log";

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

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

export function markPracticedToday(): string[] {
  const log = loadPracticeLog();
  const today = toDateKey(new Date());
  if (!log.includes(today)) {
    log.push(today);
    log.sort();
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
    } catch {
      // storage unavailable — the tap still updates this session's view
    }
  }
  return log;
}

export function practisedToday(log: string[]): boolean {
  return log.includes(toDateKey(new Date()));
}

/** Consecutive daily entries counting back from today (or yesterday). */
export function computeStreak(log: string[]): number {
  const days = new Set(log);
  const cursor = new Date();
  if (!days.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1); // streak survives until end of today
  }
  let streak = 0;
  while (days.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Entries in the current Monday-to-Sunday week. */
export function activeDaysThisWeek(log: string[]): number {
  const now = new Date();
  const monday = new Date(now);
  const day = (now.getDay() + 6) % 7; // Monday = 0
  monday.setDate(now.getDate() - day);
  monday.setHours(0, 0, 0, 0);
  return log.filter((entry) => {
    const date = new Date(`${entry}T00:00:00`);
    return date >= monday && date <= now;
  }).length;
}
