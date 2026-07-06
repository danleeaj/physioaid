"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import { isLanguage, LANGUAGE_STORAGE_KEY, type Language } from "@/lib/i18n/types";
import { applyTextSize, persistTextSize, TEXT_SIZE_KEY } from "@/lib/preferences";
import {
  createEmptyProfile,
  getUserProfile,
  saveUserProfile,
} from "@/lib/user-profile";
import type { TextSize, UserProfile } from "@/types/profile";

const SESSION_KEY = "physioaid.session";

export type SessionKind = "signedOut" | "demo" | "firebase";

/**
 * Session + profile contract for the whole shell (architecture spine).
 * Goal 2 backs the firebase branch with the Firestore `users/{uid}` document
 * and a real onboarding status; Goal 3 adds `setTextSize`.
 */
export type UserProfileContextValue = {
  sessionKind: SessionKind;
  isDemo: boolean;
  uid: string | null;
  /** demoProfile in demo mode; Firestore doc for firebase (auth-derived fallback until it resolves). */
  profile: UserProfile | null;
  profileLoading: boolean;
  onboardingStatus: "unknown" | "needed" | "in_progress" | "complete";
  /** firebase → optimistic state + setDoc merge + localStorage cache; demo → localStorage; signedOut → no-op. */
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  /** Applies + persists immediately; also patches the profile when firebase/demo. */
  setTextSize: (size: TextSize) => void;
  startDemo: () => void;
  endDemo: () => void;
};

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

/**
 * Interim profile shown while the Firestore doc is loading or missing —
 * real users must never see demo identity, so the fallback carries only what
 * Firebase auth actually knows about them. Onboarding is honestly
 * `not_started`: the gate is driven by the resolved doc state, not this.
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
    onboarding: { status: "not_started", lastCompletedStep: null, completedAt: null },
    createdAt: now,
    updatedAt: now,
  };
}

/** Offline/warm cache of the Firestore profile doc, namespaced per account. */
function profileCacheKey(uid: string) {
  return `physioaid.profile.${uid}`;
}

function loadCachedProfile(uid: string): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(profileCacheKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserProfile;
    // The userId stamp doubles as a corruption / wrong-account guard.
    return parsed && typeof parsed === "object" && parsed.userId === uid
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function persistCachedProfile(uid: string, profile: UserProfile) {
  try {
    window.localStorage.setItem(profileCacheKey(uid), JSON.stringify(profile));
  } catch {
    // Storage unavailable (private mode) — the profile stays in memory.
  }
}

function loadStoredLanguage(): Language | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguage(stored) ? stored : undefined;
  } catch {
    return undefined;
  }
}

function loadStoredTextSize(): TextSize | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const stored = window.localStorage.getItem(TEXT_SIZE_KEY);
    return stored === "standard" || stored === "large" || stored === "xl"
      ? stored
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The first profile write for an account with no doc merges onto this seed so
 * About You arrives prefilled (auth display name, device language/text-size)
 * and the saved document is complete rather than a sparse patch.
 */
function seededEmptyProfile(user: User): UserProfile {
  return createEmptyProfile(user.uid, {
    displayName: user.displayName,
    preferredLanguage: loadStoredLanguage(),
    textSize: loadStoredTextSize(),
  });
}

/** Resolved state of the Firestore profile doc, keyed by uid. */
type FirebaseProfileState = {
  uid: string;
  status: "loading" | "loaded" | "missing";
  profile: UserProfile | null;
};

function toOnboardingStatus(
  status: UserProfile["onboarding"]["status"],
): "needed" | "in_progress" | "complete" {
  return status === "not_started"
    ? "needed"
    : status === "in_progress"
      ? "in_progress"
      : "complete";
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
  // Keyed by uid so a sign-out/sign-in never shows another account's profile —
  // stale entries are simply ignored below (pattern: history-store.ts).
  const [firebaseState, setFirebaseState] =
    useState<FirebaseProfileState | null>(null);

  // Firebase auth takes precedence over a leftover demo marker.
  const sessionKind: SessionKind = user
    ? "firebase"
    : demoSession
      ? "demo"
      : "signedOut";
  const isDemo = sessionKind === "demo";
  const uid = user?.uid ?? null;

  // Resolve the Firestore profile doc whenever the account changes.
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- uid-change sync; the splash gate depends on entering "loading" immediately
    setFirebaseState({ uid, status: "loading", profile: null });
    getUserProfile(uid)
      .then((profileDoc) => {
        if (cancelled) return;
        if (profileDoc) {
          persistCachedProfile(uid, profileDoc);
          setFirebaseState({ uid, status: "loaded", profile: profileDoc });
        } else {
          // No doc yet → onboarding is needed; profile stays the auth fallback.
          setFirebaseState({ uid, status: "missing", profile: null });
        }
      })
      .catch(() => {
        if (cancelled) return;
        // Offline / rules / config issues — fall back to this account's local
        // cache so a returning user is not re-shown onboarding without network.
        const cached = loadCachedProfile(uid);
        setFirebaseState(
          cached
            ? { uid, status: "loaded", profile: cached }
            : { uid, status: "missing", profile: null },
        );
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const activeFirebase =
    firebaseState && firebaseState.uid === uid ? firebaseState : null;
  const profileLoading =
    sessionKind === "firebase" &&
    (!activeFirebase || activeFirebase.status === "loading");

  const onboardingStatus: UserProfileContextValue["onboardingStatus"] =
    sessionKind === "demo"
      ? toOnboardingStatus(demoProfileState.onboarding.status)
      : sessionKind === "firebase"
        ? profileLoading
          ? "unknown"
          : activeFirebase?.status === "loaded" && activeFirebase.profile
            ? toOnboardingStatus(activeFirebase.profile.onboarding.status)
            : "needed"
        : "unknown";

  const authFallbackProfile = useMemo(
    () => (user ? profileFromAuthUser(user) : null),
    [user],
  );

  const profile: UserProfile | null =
    sessionKind === "demo"
      ? demoProfileState
      : sessionKind === "firebase"
        ? activeFirebase?.status === "loaded" && activeFirebase.profile
          ? activeFirebase.profile
          : authFallbackProfile
        : null;

  const updateProfile = useCallback(
    async (patch: Partial<UserProfile>) => {
      if (user) {
        const targetUid = user.uid;
        // Only a resolved doc (or a previous optimistic write) counts as a
        // base; "missing" means this is the account's very first write and
        // must merge onto the seeded empty profile so the doc is complete.
        // (The AppShell splash blocks interaction while status is "loading",
        // so a write can never race the initial fetch.)
        const base =
          firebaseState &&
          firebaseState.uid === targetUid &&
          firebaseState.status === "loaded"
            ? firebaseState.profile
            : null;
        const isFirstWrite = base === null;
        const next: UserProfile = {
          ...(base ?? seededEmptyProfile(user)),
          ...patch,
          userId: targetUid,
          updatedAt: new Date().toISOString(),
        };
        setFirebaseState({ uid: targetUid, status: "loaded", profile: next });
        persistCachedProfile(targetUid, next);
        // Fire-and-forget: optimistic state + cache already reflect the
        // change; the cache fallback covers the next load if this fails.
        void saveUserProfile(targetUid, isFirstWrite ? next : patch).catch(
          () => {},
        );
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
    [user, demoSession, firebaseState],
  );

  const setTextSize = useCallback(
    (size: TextSize) => {
      applyTextSize(size);
      persistTextSize(size);
      if (sessionKind === "firebase" || sessionKind === "demo") {
        void updateProfile({ textSize: size });
      }
    },
    [sessionKind, updateProfile],
  );

  // Once a firebase/demo profile resolves, apply + cache its text size so a
  // fresh browser (empty localStorage) renders correctly after load. Ref-
  // guarded to run once per uid (once for demo) so it never fights a change
  // the user makes in this session — keyed on the scalar textSize value, not
  // the profile object, which gets a new identity on every updateProfile.
  const appliedTextSizeRef = useRef<string | null>(null);
  const resolvedTextSize =
    sessionKind === "firebase"
      ? (activeFirebase?.status === "loaded" && activeFirebase.profile
          ? activeFirebase.profile.textSize
          : null)
      : sessionKind === "demo"
        ? demoProfileState.textSize
        : null;
  useEffect(() => {
    if (sessionKind === "firebase") {
      if (profileLoading || !uid || resolvedTextSize === null) return;
      const key = `firebase:${uid}`;
      if (appliedTextSizeRef.current === key) return;
      appliedTextSizeRef.current = key;
      applyTextSize(resolvedTextSize);
      persistTextSize(resolvedTextSize);
    } else if (sessionKind === "demo") {
      if (resolvedTextSize === null) return;
      if (appliedTextSizeRef.current === "demo") return;
      appliedTextSizeRef.current = "demo";
      applyTextSize(resolvedTextSize);
      persistTextSize(resolvedTextSize);
    }
  }, [sessionKind, uid, profileLoading, resolvedTextSize]);

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
      profileLoading,
      onboardingStatus,
      updateProfile,
      setTextSize,
      startDemo,
      endDemo,
    }),
    [
      sessionKind,
      isDemo,
      uid,
      profile,
      profileLoading,
      onboardingStatus,
      updateProfile,
      setTextSize,
      startDemo,
      endDemo,
    ],
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
