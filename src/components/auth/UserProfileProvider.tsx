"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  demoProfile,
  loadDemoProfileOverrides,
  persistDemoProfile,
} from "@/lib/demo/profile";
import type { UserProfile } from "@/types/profile";

const SESSION_KEY = "physioaid.session";

export type SessionKind = "signedOut" | "demo" | "firebase";

/**
 * Session + profile contract for the whole shell (architecture spine).
 * Goal 1 ships this subset; Goal 2 adds the Firestore-backed profile and
 * real onboarding status, Goal 3 adds `setTextSize`.
 */
export type UserProfileContextValue = {
  sessionKind: SessionKind;
  isDemo: boolean;
  uid: string | null;
  /** demoProfile in demo mode; auth-derived fallback for firebase (Goal 2 swaps in the Firestore doc). */
  profile: UserProfile | null;
  profileLoading: boolean;
  onboardingStatus: "unknown" | "needed" | "in_progress" | "complete";
  /** firebase → in-memory only for now (Goal 2 adds setDoc merge); demo → localStorage; signedOut → no-op. */
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  startDemo: () => void;
  endDemo: () => void;
};

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

/**
 * Interim profile for signed-in users until Goal 2 lands the Firestore
 * `users/{uid}` document — real users must never see demo identity, so the
 * fallback carries only what Firebase auth actually knows about them.
 */
function profileFromAuthUser(user: User): UserProfile {
  const now = new Date().toISOString();
  return {
    userId: user.uid,
    displayName: user.displayName ?? "",
    ageGroup: null,
    livingSituation: "",
    planningArea: null,
    preferredLanguage: "en",
    textSize: "standard",
    supportContact: null,
    consents: {
      assessmentConsent: false,
      aiInsightConsent: false,
      communityVisibility: false,
      consentedAt: null,
    },
    // Placeholder so existing users are not gated before onboarding exists.
    onboarding: { status: "complete", lastCompletedStep: null, completedAt: null },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Owns session kind (signed out / demo / firebase) and the active profile.
 * The `physioaid.session` demo marker moved here from AppShell so every
 * surface can gate demo-only content on `isDemo` instead of guessing.
 */
export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [demoSession, setDemoSession] = useState(
    () =>
      typeof window !== "undefined" &&
      window.localStorage.getItem(SESSION_KEY) === "demo",
  );
  const [demoProfileState, setDemoProfileState] = useState<UserProfile>(() => {
    const overrides = loadDemoProfileOverrides();
    return overrides ? { ...demoProfile, ...overrides } : demoProfile;
  });
  // Keyed by uid so a sign-out/sign-in never shows another account's edits —
  // stale entries are simply ignored below (pattern: history-store.ts).
  const [firebaseProfile, setFirebaseProfile] = useState<{
    uid: string;
    profile: UserProfile;
  } | null>(null);

  // Firebase auth takes precedence over a leftover demo marker.
  const sessionKind: SessionKind = user
    ? "firebase"
    : demoSession
      ? "demo"
      : "signedOut";
  const isDemo = sessionKind === "demo";
  const uid = user?.uid ?? null;

  const authFallbackProfile = useMemo(
    () => (user ? profileFromAuthUser(user) : null),
    [user],
  );

  const profile: UserProfile | null =
    sessionKind === "demo"
      ? demoProfileState
      : sessionKind === "firebase"
        ? firebaseProfile && firebaseProfile.uid === uid
          ? firebaseProfile.profile
          : authFallbackProfile
        : null;

  const updateProfile = useCallback(
    async (patch: Partial<UserProfile>) => {
      if (user) {
        // In-memory only for now — Goal 2 adds the Firestore setDoc merge.
        setFirebaseProfile((current) => {
          const base =
            current && current.uid === user.uid
              ? current.profile
              : profileFromAuthUser(user);
          return {
            uid: user.uid,
            profile: { ...base, ...patch, updatedAt: new Date().toISOString() },
          };
        });
        return;
      }
      if (demoSession) {
        setDemoProfileState((current) => {
          const next = {
            ...current,
            ...patch,
            updatedAt: new Date().toISOString(),
          };
          persistDemoProfile(next);
          return next;
        });
      }
      // Signed out: nothing to update.
    },
    [user, demoSession],
  );

  const startDemo = useCallback(() => {
    try {
      window.localStorage.setItem(SESSION_KEY, "demo");
    } catch {
      // Session stays in memory only.
    }
    setDemoSession(true);
  }, []);

  const endDemo = useCallback(() => {
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      // Nothing to clear.
    }
    setDemoSession(false);
  }, []);

  const value = useMemo<UserProfileContextValue>(
    () => ({
      sessionKind,
      isDemo,
      uid,
      profile,
      // Goal 2 flips this while the Firestore profile doc loads.
      profileLoading: false,
      // Placeholder until Goal 2 derives it from the profile doc.
      onboardingStatus: "complete",
      updateProfile,
      startDemo,
      endDemo,
    }),
    [sessionKind, isDemo, uid, profile, updateProfile, startDemo, endDemo],
  );

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) {
    throw new Error("useUserProfile must be used within UserProfileProvider");
  }
  return ctx;
}
