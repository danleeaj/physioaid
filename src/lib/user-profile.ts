import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Language } from "@/lib/i18n/types";
import type { EmergencyContact } from "@/types/assessment";

/**
 * User-owned profile — collected by onboarding, edited in Profile.
 * Onboarding identifies the user; the assessment only measures.
 *
 * Stored at users/{uid}/profile/main with a stamped userId field (same
 * convention as saved assessments, required by firestore.rules).
 */

export type AgeGroup = "under60" | "60s" | "70s" | "80plus";
export type TextSizePref = "standard" | "large" | "xl";

export type UserProfile = {
  name: string;
  ageGroup: AgeGroup | null;
  /** Representative age for the age group — feeds Demographics.age. */
  age: number | null;
  livingSituation: string;
  neighbourhood?: string;
  emergencyContact: EmergencyContact;
  preferred_language: Language;
  textSize: TextSizePref;
  consents: {
    privacy: boolean;
    aiInsights: boolean;
    communityVisibility: boolean;
  };
  /** null ⇒ onboarding incomplete ⇒ route to onboarding. */
  onboardedAt: string | null;
  createdAt: string;
  userId: string;
};

export const AGE_GROUP_AGES: Record<AgeGroup, number> = {
  under60: 55,
  "60s": 65,
  "70s": 75,
  "80plus": 82,
};

export function createBlankProfile(
  uid: string,
  displayName?: string | null,
): UserProfile {
  return {
    name: displayName?.trim().split(/\s+/)[0] ?? "",
    ageGroup: null,
    age: null,
    livingSituation: "",
    emergencyContact: { name: "", phone: "", relationship: "" },
    preferred_language: "en",
    textSize: "standard",
    consents: { privacy: false, aiInsights: false, communityVisibility: false },
    onboardedAt: null,
    createdAt: new Date().toISOString(),
    userId: uid,
  };
}

function profileRef(uid: string) {
  return doc(db, "users", uid, "profile", "main");
}

export async function loadUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(profileRef(uid));
  return snapshot.exists() ? (snapshot.data() as UserProfile) : null;
}

export async function saveUserProfile(
  uid: string,
  profile: UserProfile,
): Promise<void> {
  await setDoc(profileRef(uid), { ...profile, userId: uid });
}
