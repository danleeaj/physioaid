"use client";

import { useState } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { shellCopy } from "@/components/layout/copy";
import type { ProfileConsents, UserProfile } from "@/types/profile";

function ConsentToggle({
  label,
  body,
  value,
  onToggle,
}: {
  label: string;
  body: string;
  value: boolean;
  onToggle: () => void;
}) {
  const { lang } = useLanguage();
  const copy = shellCopy[lang].onboarding;
  return (
    <div className="app-card flex items-center gap-3">
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{label}</span>
        <span className="block text-[length:var(--text-label)] text-[var(--muted)]">
          {body}
        </span>
      </span>
      <button
        aria-pressed={value}
        className="filter-chip"
        onClick={onToggle}
        type="button"
      >
        {value ? copy.consent.on : copy.consent.off}
      </button>
    </div>
  );
}

/**
 * Privacy choices. All three toggles default to off (profile defaults are
 * false) and none is required — Continue stamps `consentedAt` whatever the
 * choices are, recording that the user was asked.
 */
export function ConsentStep({
  profile,
  onBack,
  onContinue,
}: {
  profile: UserProfile | null;
  onBack: () => void;
  onContinue: (consents: ProfileConsents) => void;
}) {
  const { lang } = useLanguage();
  const copy = shellCopy[lang].onboarding;
  const [assessmentConsent, setAssessmentConsent] = useState(
    profile?.consents.assessmentConsent ?? false,
  );
  const [aiInsightConsent, setAiInsightConsent] = useState(
    profile?.consents.aiInsightConsent ?? false,
  );
  const [communityVisibility, setCommunityVisibility] = useState(
    profile?.consents.communityVisibility ?? false,
  );

  return (
    <section className="grid gap-4">
      <div className="grid gap-1">
        <h1 className="text-[length:var(--text-display)] font-bold">
          {copy.consent.title}
        </h1>
        <p className="text-[var(--muted)]">{copy.consent.support}</p>
      </div>

      <ConsentToggle
        body={copy.consent.assessmentBody}
        label={copy.consent.assessmentLabel}
        onToggle={() => setAssessmentConsent((value) => !value)}
        value={assessmentConsent}
      />
      <ConsentToggle
        body={copy.consent.aiBody}
        label={copy.consent.aiLabel}
        onToggle={() => setAiInsightConsent((value) => !value)}
        value={aiInsightConsent}
      />
      <ConsentToggle
        body={copy.consent.communityBody}
        label={copy.consent.communityLabel}
        onToggle={() => setCommunityVisibility((value) => !value)}
        value={communityVisibility}
      />

      <div className="grid gap-3 pt-2">
        <button
          className="primary-action w-full"
          onClick={() =>
            onContinue({
              assessmentConsent,
              aiInsightConsent,
              communityVisibility,
              consentedAt: new Date().toISOString(),
            })
          }
          type="button"
        >
          {copy.continueLabel}
        </button>
        <button className="link-action" onClick={onBack} type="button">
          {copy.back}
        </button>
      </div>
    </section>
  );
}
