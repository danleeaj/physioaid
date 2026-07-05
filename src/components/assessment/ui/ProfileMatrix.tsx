"use client";

import { CheckCircle2 } from "lucide-react";
import { profileCopy } from "@/content/clinical-copy";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { clinicalText } from "@/lib/i18n/clinical-drafts";
import type { AbilityConfidenceProfile } from "@/types/assessment";

const cells: {
  ability: string;
  confidence: string;
  profile: AbilityConfidenceProfile;
}[] = [
  {
    ability: "Good ability",
    confidence: "Good confidence",
    profile: "stable_profile",
  },
  {
    ability: "Good ability",
    confidence: "Low confidence",
    profile: "under_confidence",
  },
  {
    ability: "Reduced ability",
    confidence: "Good confidence",
    profile: "possible_risk_taking",
  },
  {
    ability: "Reduced ability",
    confidence: "Low confidence",
    profile: "high_vulnerability",
  },
];

/** The signature 2×2 ability-confidence quadrant. */
export function ProfileMatrix({
  activeProfile,
}: {
  activeProfile: AbilityConfidenceProfile;
}) {
  const { lang } = useLanguage();

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cells.map((cell) => {
        const isActive = cell.profile === activeProfile;

        return (
          <div
            className={`rounded-[var(--radius-card)] p-4 ${
              isActive
                ? "border-2 border-[var(--primary)] bg-[var(--primary-soft)]"
                : "bg-[var(--surface-muted)]"
            }`}
            key={cell.profile}
          >
            <p
              className={`flex items-start gap-2 text-[length:var(--text-body)] font-bold ${
                isActive ? "text-[var(--primary-dark)]" : ""
              }`}
            >
              {isActive && (
                <CheckCircle2 aria-hidden className="mt-1 shrink-0" size={18} />
              )}
              {clinicalText(
                lang,
                `profile.${cell.profile}.title`,
                profileCopy[cell.profile].title,
              )}
            </p>
            <p className="mt-2 text-[length:var(--text-label)] text-[var(--muted)]">
              {cell.ability}, {cell.confidence}
            </p>
          </div>
        );
      })}
    </div>
  );
}
