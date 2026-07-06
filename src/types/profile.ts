import type { Language } from "@/lib/i18n/types";

export type TextSize = "standard" | "large" | "xl";

export type AgeGroup = "under60" | "60s" | "70s" | "80s" | "90plus";

export type SupportContact = {
  name: string;
  phone: string;
  relationship: string;
};

export type ProfileConsents = {
  assessmentConsent: boolean;
  aiInsightConsent: boolean;
  /** Community sharing — default FALSE for real users. */
  communityVisibility: boolean;
  consentedAt: string | null;
};

export type UserProfile = {
  /** Stamped uid (mirrors the assessments pattern). */
  userId: string;
  displayName: string;
  ageGroup: AgeGroup | null;
  livingSituation: string;
  /** From PLANNING_AREAS. */
  planningArea: string | null;
  preferredLanguage: Language;
  textSize: TextSize;
  /** null = skipped. */
  supportContact: SupportContact | null;
  consents: ProfileConsents;
  onboarding: {
    status: "not_started" | "in_progress" | "complete";
    lastCompletedStep:
      | "welcome"
      | "aboutYou"
      | "supportContact"
      | "consent"
      | "ready"
      | null;
    completedAt: string | null;
  };
  createdAt: string;
  updatedAt: string;
};
