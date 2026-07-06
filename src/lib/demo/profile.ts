import type { UserProfile } from "@/types/profile";

const DEMO_PROFILE_KEY = "physioaid.profile.demo";

/** Static timestamp for the demo persona — keeps SSR and client output identical. */
const DEMO_TIMESTAMP = "2026-01-01T00:00:00.000Z";

/**
 * The Mr Tan demo persona as a full profile. Built from the shell's
 * `demoPerson` display values so demo mode renders exactly as before, but
 * through the same `UserProfile` contract real users get. Demo is onboarding-
 * complete (never hits the onboarding gate) and community-visible (the sample
 * feed is part of the demo story).
 */
export const demoProfile: UserProfile = {
  userId: "demo",
  displayName: "Mr Tan",
  ageGroup: "70s",
  livingSituation: "Lives with spouse",
  planningArea: "Toa Payoh",
  heightCm: 168,
  preferredLanguage: "en",
  textSize: "standard",
  supportContact: null,
  consents: {
    assessmentConsent: true,
    aiInsightConsent: true,
    communityVisibility: true,
    consentedAt: DEMO_TIMESTAMP,
  },
  onboarding: {
    status: "complete",
    lastCompletedStep: "ready",
    completedAt: DEMO_TIMESTAMP,
  },
  createdAt: DEMO_TIMESTAMP,
  updatedAt: DEMO_TIMESTAMP,
};

/** Demo profile edits persisted on this device (merged over `demoProfile`). */
export function loadDemoProfileOverrides(): Partial<UserProfile> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DEMO_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as Partial<UserProfile>)
      : null;
  } catch {
    return null;
  }
}

export function persistDemoProfile(profile: UserProfile) {
  try {
    window.localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Storage may be unavailable (private mode) — edits stay in memory.
  }
}
