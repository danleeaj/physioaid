"use client";

import { useCallback, useEffect, useState } from "react";
import {
  demoHistory,
  sessionToHistoryEntry,
  type HistoryEntry,
} from "@/components/dashboard/demo-display-data";
import { getAssessmentHistory } from "@/lib/assessment-history";
import type { AssessmentSession } from "@/types/assessment";

const LEGACY_STORAGE_KEY = "physioaid.history";

export type HistorySession =
  | { kind: "demo" }
  | { kind: "firebase"; uid: string };

type SavedRecord = {
  entry: HistoryEntry;
  session?: AssessmentSession;
};

/** Device-local saves are scoped per identity so demo-device history can
 * never leak into a real account (and vice versa). */
function storageKey(session: HistorySession): string {
  return session.kind === "demo"
    ? "physioaid.history.demo"
    : `physioaid.history.${session.uid}`;
}

function parseRecords(raw: string | null): SavedRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Earlier builds stored bare HistoryEntry objects — migrate on read.
    return parsed
      .map((item) =>
        item && typeof item === "object" && "entry" in item
          ? (item as SavedRecord)
          : ({ entry: item as HistoryEntry } satisfies SavedRecord),
      )
      .filter((record) => record.entry && typeof record.entry.id === "string");
  } catch {
    return [];
  }
}

function loadStoredRecords(session: HistorySession | null): SavedRecord[] {
  if (typeof window === "undefined" || !session) return [];
  try {
    // One-time migration: the un-scoped legacy key predates real accounts,
    // so its contents belong to the demo bucket.
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy != null) {
      window.localStorage.setItem("physioaid.history.demo", legacy);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
    return parseRecords(window.localStorage.getItem(storageKey(session)));
  } catch {
    return [];
  }
}

function persistRecords(session: HistorySession, records: SavedRecord[]) {
  try {
    window.localStorage.setItem(storageKey(session), JSON.stringify(records));
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
  const key = session ? storageKey(session) : null;
  // Local saves are keyed by identity too — switching between demo and a real
  // account swaps buckets instead of resetting state in an effect.
  const [saved, setSaved] = useState<{
    key: string | null;
    records: SavedRecord[];
  }>(() => ({ key, records: loadStoredRecords(session) }));
  const savedRecords =
    saved.key === key ? saved.records : loadStoredRecords(session);
  // Keyed by uid so a sign-out/sign-in never shows another account's cache —
  // no reset-in-effect needed, stale data is simply ignored below.
  const [remote, setRemote] = useState<{
    uid: string;
    records: SavedRecord[];
  } | null>(null);

  const uid = session?.kind === "firebase" ? session.uid : null;

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

  const remoteRecords = remote && remote.uid === uid ? remote.records : [];

  const addSession = useCallback(
    (newSession: AssessmentSession) => {
      if (!session) return;
      const record: SavedRecord = {
        entry: sessionToHistoryEntry(newSession),
        session: newSession,
      };
      const base = loadStoredRecords(session);
      const next = [record, ...base.filter((r) => r.entry.id !== record.entry.id)];
      persistRecords(session, next);
      setSaved({ key: storageKey(session), records: next });
    },
    // session object identity changes per render; key by its stable parts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session?.kind, session?.kind === "firebase" ? session.uid : null],
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

  const getSession = useCallback(
    (entryId: string) =>
      records.find((r) => r.entry.id === entryId)?.session ?? null,
    // records is derived fresh each render; identity is fine for callers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [savedRecords, remoteRecords, session?.kind],
  );

  return { entries, addSession, getSession };
}
