"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  demoHistory,
  sessionToHistoryEntry,
  type HistoryEntry,
} from "@/components/dashboard/demo-display-data";
import { getAssessmentHistory } from "@/lib/assessment-history";
import {
  isDemoSessionId,
  normalizeSession,
} from "@/lib/assessment/normalize-session";
import type { AssessmentSession } from "@/types/assessment";

const LEGACY_STORAGE_KEY = "physioaid.history";
const DEMO_STORAGE_KEY = "physioaid.history.demo";

export type HistorySession =
  | { kind: "demo" }
  | { kind: "firebase"; uid: string };

/**
 * Local history is namespaced per session so accounts sharing a device never
 * see each other's saves: `physioaid.history.demo` / `physioaid.history.<uid>`.
 */
function storageKeyFor(session: HistorySession | null): string | null {
  if (!session) return null;
  return session.kind === "demo"
    ? DEMO_STORAGE_KEY
    : `physioaid.history.${session.uid}`;
}

/**
 * One-time migration of the old shared `physioaid.history` key, demo mode
 * only. Firebase users deliberately ignore the legacy key: their saves also
 * went to Firestore, which is authoritative — a small local-only loss beats
 * adopting another person's records on a shared device.
 */
function migrateLegacyDemoHistory() {
  try {
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy !== null && window.localStorage.getItem(DEMO_STORAGE_KEY) === null) {
      window.localStorage.setItem(DEMO_STORAGE_KEY, legacy);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  } catch {
    // Storage unavailable — nothing to migrate.
  }
}

type SavedRecord = {
  entry: HistoryEntry;
  session?: AssessmentSession;
};

// Stable fallback so derived values (and the `sessions` memo) keep their
// identity across renders when there is nothing to show.
const NO_RECORDS: SavedRecord[] = [];

function loadStoredRecords(storageKey: string): SavedRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Earlier builds stored bare HistoryEntry objects — migrate on read.
    return parsed
      .map((item) =>
        item && typeof item === "object" && "entry" in item
          ? (item as SavedRecord)
          : ({ entry: item as HistoryEntry } satisfies SavedRecord),
      )
      .filter((record) => record.entry && typeof record.entry.id === "string")
      // Normalize stored sessions to the current schema (in memory only).
      // A session that fails normalization keeps its history entry but
      // drops the unusable session payload.
      .map((record) => {
        if (!record.session) return record;
        const session = normalizeSession(record.session);
        return session
          ? { ...record, session }
          : { entry: record.entry };
      });
  } catch {
    return [];
  }
}

function persistRecords(storageKey: string, records: SavedRecord[]) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(records));
  } catch {
    // Storage may be unavailable (private mode) — history stays in memory.
  }
}

/**
 * Assessment history for the shell.
 *
 * Demo mode: static Mr Tan sample entries + device-local saves.
 * Firebase users: real saved history via the existing `getAssessmentHistory`
 * utility (its first UI caller) merged with device-local saves — no Mr Tan
 * sample data. Full sessions are kept alongside entries so the clinician
 * report stays reachable from history.
 */
export function useHistoryStore(session: HistorySession | null) {
  const storageKey = storageKeyFor(session);
  // Keyed by storage key so a session change (sign-out/sign-in, demo start)
  // never shows another session's records — stale data is ignored below.
  const [local, setLocal] = useState<{
    key: string;
    records: SavedRecord[];
  } | null>(null);
  // Keyed by uid so a sign-out/sign-in never shows another account's cache —
  // no reset-in-effect needed, stale data is simply ignored below.
  const [remote, setRemote] = useState<{
    uid: string;
    records: SavedRecord[];
  } | null>(null);

  const uid = session?.kind === "firebase" ? session.uid : null;

  useEffect(() => {
    if (!storageKey) return;
    if (storageKey === DEMO_STORAGE_KEY) migrateLegacyDemoHistory();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- post-hydration / session-change sync from localStorage
    setLocal({ key: storageKey, records: loadStoredRecords(storageKey) });
  }, [storageKey]);

  const savedRecords =
    local && local.key === storageKey ? local.records : NO_RECORDS;

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    getAssessmentHistory(uid)
      .then((sessions) => {
        if (cancelled) return;
        setRemote({
          uid,
          records: sessions.map((s) => ({
            entry: sessionToHistoryEntry(s),
            session: s,
          })),
        });
      })
      .catch(() => {
        // Offline / rules / config issues — fall back to local-only history.
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const remoteRecords =
    remote && remote.uid === uid ? remote.records : NO_RECORDS;

  const addSession = useCallback(
    (newSession: AssessmentSession) => {
      // Saving requires an active session (the flow is unreachable otherwise).
      if (!storageKey) return;
      const record: SavedRecord = {
        entry: sessionToHistoryEntry(newSession),
        session: newSession,
      };
      setLocal((current) => {
        const existing =
          current && current.key === storageKey ? current.records : [];
        const next = [
          record,
          ...existing.filter((r) => r.entry.id !== record.entry.id),
        ];
        persistRecords(storageKey, next);
        return { key: storageKey, records: next };
      });
    },
    [storageKey],
  );

  // Local saves first (freshest), then remote not already present locally,
  // then — demo mode only — the static sample journal.
  const localIds = new Set(savedRecords.map((r) => r.entry.id));
  const records: SavedRecord[] = [
    ...savedRecords,
    ...remoteRecords.filter((r) => !localIds.has(r.entry.id)),
    ...(session?.kind === "demo" ? demoHistory.map((entry) => ({ entry })) : []),
  ];

  const entries = records.map((r) => r.entry);

  // Normalized real sessions for the trend dashboard: local + remote saves,
  // never explicit demo sessions and never the static sample journal (those
  // entries carry no session payload). Memoized on the underlying stores so
  // consumers can safely key effects on the array identity.
  const sessions = useMemo(() => {
    const seen = new Set<string>();
    const result: AssessmentSession[] = [];
    for (const record of [...savedRecords, ...remoteRecords]) {
      const recordSession = record.session;
      if (!recordSession) continue;
      if (isDemoSessionId(recordSession.id)) continue;
      if (seen.has(recordSession.id)) continue;
      seen.add(recordSession.id);
      result.push(recordSession);
    }
    return result;
  }, [savedRecords, remoteRecords]);

  const getSession = useCallback(
    (entryId: string) =>
      records.find((r) => r.entry.id === entryId)?.session ?? null,
    // records is derived fresh each render; identity is fine for callers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [savedRecords, remoteRecords, session?.kind],
  );

  return { entries, sessions, addSession, getSession };
}
