"use client";

import { useCallback, useEffect, useState } from "react";
import { demoPerson } from "@/components/dashboard/demo-display-data";
import type { HistorySession } from "@/components/dashboard/history-store";
import {
  createBlankProfile,
  loadUserProfile,
  saveUserProfile,
  type UserProfile,
} from "@/lib/user-profile";

const CACHE_PREFIX = "physioaid.profile.";

/** Static Mr Tan profile for the demo session — never triggers onboarding. */
export const demoProfile: UserProfile = {
  name: demoPerson.name,
  ageGroup: "70s",
  age: 75,
  livingSituation: "Lives with spouse",
  neighbourhood: demoPerson.location,
  emergencyContact: {
    name: "Mrs Tan",
    phone: "+65 9000 0000",
    relationship: "Spouse",
  },
  preferred_language: "en",
  textSize: "standard",
  consents: { privacy: true, aiInsights: true, communityVisibility: true },
  onboardedAt: "2025-12-01T00:00:00.000Z",
  createdAt: "2025-12-01T00:00:00.000Z",
  userId: "demo-mr-tan",
};

function readCache(uid: string): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + uid);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

function writeCache(uid: string, profile: UserProfile) {
  try {
    window.localStorage.setItem(CACHE_PREFIX + uid, JSON.stringify(profile));
  } catch {
    // Cache only — Firestore stays the durable copy.
  }
}

/**
 * Profile state for the shell. Demo sessions get the static Mr Tan profile.
 * Firebase users get their Firestore profile (uid-keyed localStorage cache
 * for instant paint); a blank profile doc is created on FIRST sign-in so
 * routing can distinguish "new user → onboarding" from "returning → app".
 * Remote errors degrade to the cache (rules may not be deployed yet).
 */
export function useUserProfile(
  session: HistorySession | null,
  displayName?: string | null,
) {
  const uid = session?.kind === "firebase" ? session.uid : null;

  // Keyed by uid so switching accounts never shows another user's cache.
  const [remote, setRemote] = useState<{
    uid: string;
    profile: UserProfile;
  } | null>(null);
  const [loadedUid, setLoadedUid] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    loadUserProfile(uid)
      .then(async (stored) => {
        if (cancelled) return;
        if (stored) {
          setRemote({ uid, profile: stored });
          writeCache(uid, stored);
        } else {
          // First sign-in: create the blank, user-owned profile doc.
          const blank = createBlankProfile(uid, displayName);
          setRemote({ uid, profile: blank });
          writeCache(uid, blank);
          await saveUserProfile(uid, blank).catch(() => {});
        }
        setLoadedUid(uid);
      })
      .catch(() => {
        if (cancelled) return;
        // Offline / rules not deployed — fall back to cache or a blank.
        const cached = readCache(uid) ?? createBlankProfile(uid, displayName);
        setRemote({ uid, profile: cached });
        setLoadedUid(uid);
      });
    return () => {
      cancelled = true;
    };
    // displayName is stable for a given uid — refetch only on account change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const updateProfile = useCallback(
    (patch: Partial<UserProfile>) => {
      if (!uid) return;
      setRemote((current) => {
        const base =
          current && current.uid === uid
            ? current.profile
            : (readCache(uid) ?? createBlankProfile(uid));
        const next = { ...base, ...patch };
        writeCache(uid, next);
        saveUserProfile(uid, next).catch(() => {});
        return { uid, profile: next };
      });
    },
    [uid],
  );

  if (session?.kind === "demo") {
    return {
      profile: demoProfile,
      profileLoading: false,
      needsOnboarding: false,
      updateProfile: () => {},
    };
  }

  const profile = remote && remote.uid === uid ? remote.profile : null;
  const profileLoading = Boolean(uid) && loadedUid !== uid && !profile;
  const needsOnboarding = Boolean(uid) && !profileLoading && profile?.onboardedAt == null;

  return { profile, profileLoading, needsOnboarding, updateProfile };
}
