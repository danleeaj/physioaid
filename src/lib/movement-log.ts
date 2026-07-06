import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import type { HistorySession } from "@/components/dashboard/history-store";
import { db } from "@/lib/firebase";
import type { MovementActivityInput, MovementActivityLog } from "@/types/movement";

/** Fired on `window` after every successful log write so open views refresh. */
export const MOVEMENT_LOG_EVENT = "physioaid:movement-log";

const DEMO_STORAGE_KEY = "physioaid.movement-log.demo";
/** Newest-first, capped so a long-lived account never grows this unbounded. */
const MAX_LOCAL_ENTRIES = 200;

function storageKeyFor(session: HistorySession): string {
  return session.kind === "demo"
    ? DEMO_STORAGE_KEY
    : `physioaid.movement-log.${session.uid}`;
}

function movementLogsRef(uid: string) {
  return collection(db, "users", uid, "movementLogs");
}

/**
 * Firestore rejects `undefined` values outright — optional fields like
 * `assessmentSessionId` are often absent, so drop undefined keys (mirrors
 * assessment-history.ts's stripUndefined).
 */
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)]),
    ) as T;
  }
  return value;
}

function isMovementActivityLog(value: unknown): value is MovementActivityLog {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as MovementActivityLog).id === "string" &&
    typeof (value as MovementActivityLog).userId === "string" &&
    typeof (value as MovementActivityLog).completedAt === "string"
  );
}

/** SSR-safe: returns `[]` on the server, never throws in private-mode browsers. */
export function loadLocalMovementLogs(session: HistorySession): MovementActivityLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKeyFor(session));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isMovementActivityLog) : [];
  } catch {
    return [];
  }
}

function persistLocalMovementLogs(
  session: HistorySession,
  logs: MovementActivityLog[],
) {
  try {
    window.localStorage.setItem(storageKeyFor(session), JSON.stringify(logs));
  } catch {
    // Storage unavailable (private mode) — the entry stays in memory only.
  }
}

function dispatchMovementLogEvent() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MOVEMENT_LOG_EVENT));
}

/**
 * Records a movement activity: always appends to the namespaced local log
 * (offline-first, works for demo and firebase alike), and — for firebase
 * sessions — fire-and-forgets a Firestore write so the entry syncs across
 * devices. The local copy is the durable/offline record either way.
 */
export async function recordMovementActivity(
  session: HistorySession,
  input: MovementActivityInput,
): Promise<MovementActivityLog> {
  const log: MovementActivityLog = {
    ...input,
    id: crypto.randomUUID(),
    userId: session.kind === "firebase" ? session.uid : "demo",
    completedAt: input.completedAt ?? new Date().toISOString(),
    visibility: input.visibility ?? "private",
  };

  const existing = loadLocalMovementLogs(session);
  const next = [log, ...existing].slice(0, MAX_LOCAL_ENTRIES);
  persistLocalMovementLogs(session, next);

  if (session.kind === "firebase") {
    // Fire-and-forget: the local copy above is already durable; a failed
    // remote write (offline, rules, config) must never block or reject here.
    void setDoc(doc(movementLogsRef(session.uid), log.id), stripUndefined(log)).catch(
      () => {},
    );
  }

  dispatchMovementLogEvent();
  return log;
}

/** Remote log history for a firebase user, newest first. */
export async function getMovementLogs(
  uid: string,
  max = 100,
): Promise<MovementActivityLog[]> {
  const q = query(movementLogsRef(uid), orderBy("completedAt", "desc"), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data()).filter(isMovementActivityLog);
}

export function toLocalDateKey(iso: string): string {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Unique active days (local timezone) in the current Monday-based week,
 * unioning logged activity with legacy `physioaid.practice-log` day strings
 * so movement tracked before this log existed still counts during the
 * transition (mirrors the Monday math in lib/streak.ts).
 */
export function getActiveDaysThisWeek(
  logs: MovementActivityLog[],
  legacyDays: string[],
): number {
  const now = new Date();
  const monday = new Date(now);
  const dayOffset = (now.getDay() + 6) % 7; // Monday = 0
  monday.setDate(now.getDate() - dayOffset);
  monday.setHours(0, 0, 0, 0);

  const days = new Set<string>();
  for (const log of logs) {
    days.add(toLocalDateKey(log.completedAt));
  }
  for (const day of legacyDays) {
    days.add(day);
  }

  return Array.from(days).filter((entry) => {
    const date = new Date(`${entry}T00:00:00`);
    return date >= monday && date <= now;
  }).length;
}
