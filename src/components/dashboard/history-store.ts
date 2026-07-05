"use client";

import { useCallback, useState } from "react";
import {
  demoHistory,
  type HistoryEntry,
} from "@/components/dashboard/demo-display-data";

const STORAGE_KEY = "physioaid.history";

function loadStoredEntries(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function persistEntries(entries: HistoryEntry[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage may be unavailable (private mode) — history stays in memory.
  }
}

/**
 * Device-local assessment history for the shell: entries saved from completed
 * assessments (localStorage) layered on top of the static demo journal.
 * Firestore persistence for signed-in users continues to happen at save time
 * via `saveAssessment` in the Result screen — this store is display state.
 */
export function useHistoryStore() {
  // Lazy init: [] on the server, stored entries on the client. The shell
  // renders a splash until hydration, so the difference is never painted.
  const [savedEntries, setSavedEntries] = useState<HistoryEntry[]>(
    loadStoredEntries,
  );

  const addEntry = useCallback((entry: HistoryEntry) => {
    setSavedEntries((current) => {
      const next = [entry, ...current];
      persistEntries(next);
      return next;
    });
  }, []);

  const entries: HistoryEntry[] = [...savedEntries, ...demoHistory];

  return { entries, addEntry };
}
