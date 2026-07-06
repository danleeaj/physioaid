"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { HistorySession } from "@/components/dashboard/history-store";
import {
  getActiveDaysThisWeek,
  getMovementLogs,
  loadLocalMovementLogs,
  MOVEMENT_LOG_EVENT,
  recordMovementActivity,
} from "@/lib/movement-log";
import { loadPracticeLog } from "@/lib/streak";
import type { MovementActivityInput, MovementActivityLog } from "@/types/movement";

function sessionKeyFor(session: HistorySession | null): string | null {
  if (!session) return null;
  return session.kind === "demo" ? "demo" : `firebase:${session.uid}`;
}

/**
 * Reactive movement log for the current session — mirrors useHistoryStore's
 * local-first + uid-keyed remote merge, plus a MOVEMENT_LOG_EVENT listener so
 * any view that calls `recordMovementActivity` (assessment save, exercise
 * done, manual walk) is reflected here without a reload.
 */
export function useMovementLog(session: HistorySession | null) {
  // Rebuilt from primitives rather than trusting the caller's object
  // identity (AppShell/CommunityTab construct a fresh literal each render).
  const kind = session?.kind ?? null;
  const uid = session?.kind === "firebase" ? session.uid : null;
  const stableSession = useMemo<HistorySession | null>(() => {
    if (kind === "demo") return { kind: "demo" };
    if (kind === "firebase" && uid) return { kind: "firebase", uid };
    return null;
  }, [kind, uid]);
  const sessionKey = sessionKeyFor(stableSession);

  // Keyed by session key so a session change (sign-out/sign-in, demo start)
  // never shows another session's records — stale data is ignored below.
  const [local, setLocal] = useState<{
    key: string;
    logs: MovementActivityLog[];
  } | null>(null);
  // Keyed by uid so a sign-out/sign-in never shows another account's cache.
  const [remote, setRemote] = useState<{
    uid: string;
    logs: MovementActivityLog[];
  } | null>(null);

  const refreshLocal = useCallback(() => {
    if (!stableSession || !sessionKey) return;
    setLocal({ key: sessionKey, logs: loadLocalMovementLogs(stableSession) });
  }, [stableSession, sessionKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- post-hydration / session-change sync from localStorage (pattern: history-store.ts)
    refreshLocal();
  }, [refreshLocal]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.addEventListener(MOVEMENT_LOG_EVENT, refreshLocal);
    return () => window.removeEventListener(MOVEMENT_LOG_EVENT, refreshLocal);
  }, [refreshLocal]);

  const localLogs = local && local.key === sessionKey ? local.logs : [];

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    getMovementLogs(uid)
      .then((logs) => {
        if (cancelled) return;
        setRemote({ uid, logs });
      })
      .catch(() => {
        // Offline / rules / config issues — fall back to local-only logs.
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const remoteLogs = remote && remote.uid === uid ? remote.logs : [];

  // Local entries first (freshest), then remote entries not already local.
  const localIds = new Set(localLogs.map((log) => log.id));
  const logs = [
    ...localLogs,
    ...remoteLogs.filter((log) => !localIds.has(log.id)),
  ].sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  const activeDaysThisWeek = getActiveDaysThisWeek(
    logs,
    typeof window === "undefined" ? [] : loadPracticeLog(),
  );

  const logActivity = useCallback(
    (input: MovementActivityInput) => {
      if (!stableSession) {
        return Promise.reject(new Error("logActivity requires an active session"));
      }
      return recordMovementActivity(stableSession, input);
    },
    [stableSession],
  );

  return { logs, activeDaysThisWeek, logActivity };
}
