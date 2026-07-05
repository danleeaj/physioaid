"use client";

import { useCallback, useEffect, useState } from "react";
import {
  demoHistory,
  sessionToHistoryEntry,
  type HistoryEntry,
} from "@/components/dashboard/demo-display-data";
import { getAssessmentHistory } from "@/lib/assessment-history";
import type { AssessmentSession } from "@/types/assessment";

const STORAGE_KEY = "physioaid.history";

export type HistorySession =
  | { kind: "demo" }
  | { kind: "firebase"; uid: string };

type SavedRecord = {
  entry: HistoryEntry;
  session?: AssessmentSession;
};

function loadStoredRecords(): SavedRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
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
      .filter((record) => record.entry && typeof record.entry.id === "string");
  } catch {
    return [];
  }
}

function persistRecords(records: SavedRecord[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
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
  const [savedRecords, setSavedRecords] = useState<SavedRecord[]>(
    loadStoredRecords,
  );
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

  const addSession = useCallback((newSession: AssessmentSession) => {
    const record: SavedRecord = {
      entry: sessionToHistoryEntry(newSession),
      session: newSession,
    };
    setSavedRecords((current) => {
      const next = [record, ...current.filter((r) => r.entry.id !== record.entry.id)];
      persistRecords(next);
      return next;
    });
  }, []);

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
