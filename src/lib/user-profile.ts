import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Language } from "@/lib/i18n/types";
import type { TextSize, UserProfile } from "@/types/profile";

/** The profile lives at the `users/{uid}` root document (assessments are a
 *  sibling subcollection — no conflict). Mirrors assessment-history.ts. */
function profileRef(uid: string) {
  return doc(db, "users", uid);
}

/**
 * Firestore rejects `undefined` values outright — profile patches can carry
 * optional fields, so drop undefined keys (recursively) before writing.
 * (Mirror of the helper in assessment-history.ts.)
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

/** Values known before the user answers anything — auth display name plus the
 *  device's existing language / text-size preferences. */
export type ProfileSeed = {
  displayName?: string | null;
  preferredLanguage?: Language;
  textSize?: TextSize;
};

/**
 * A complete, honest starting profile for a brand-new account: onboarding
 * not started, every consent false and unstamped. The seed pre-fills what we
 * already know so the About You step arrives populated.
 */
export function createEmptyProfile(uid: string, seed: ProfileSeed): UserProfile {
  const now = new Date().toISOString();
  return {
    userId: uid,
    displayName: seed.displayName?.trim() ?? "",
    ageGroup: null,
    livingSituation: "",
    planningArea: null,
    heightCm: null,
    preferredLanguage: seed.preferredLanguage ?? "en",
    textSize: seed.textSize ?? "standard",
    supportContact: null,
    consents: {
      assessmentConsent: false,
      aiInsightConsent: false,
      communityVisibility: false,
      consentedAt: null,
    },
    onboarding: {
      status: "not_started",
      lastCompletedStep: null,
      completedAt: null,
    },
    createdAt: now,
    updatedAt: now,
  };
}

/** Single-doc lookup; null when the account has no profile yet (pre-onboarding). */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(profileRef(uid));
  if (!snap.exists()) {
    return null;
  }
  return snap.data() as UserProfile;
}

/**
 * Merge-write a profile patch. Always stamps `userId` (required by the
 * Firestore rules) and a fresh `updatedAt`.
 */
export async function saveUserProfile(
  uid: string,
  patch: Partial<UserProfile>,
): Promise<void> {
  await setDoc(
    profileRef(uid),
    stripUndefined({
      ...patch,
      userId: uid,
      updatedAt: new Date().toISOString(),
    }),
    { merge: true },
  );
}
