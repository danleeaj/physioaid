"use client";

import { shellCopy } from "@/components/layout/copy";
import { AGE_GROUP_OPTIONS } from "@/components/onboarding/steps/AboutYouStep";
import type { UserProfile } from "@/types/profile";

const copy = shellCopy.onboarding;

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="shrink-0 text-[length:var(--text-label)] text-[var(--muted)]">
        {label}
      </span>
      <span className="min-w-0 text-right font-bold">{value}</span>
    </div>
  );
}

/** Final step — brief recap of what was saved, then into the app. */
export function ReadyStep({
  profile,
  onBack,
  onStart,
}: {
  profile: UserProfile | null;
  onBack: () => void;
  onStart: () => void;
}) {
  const ageLabel = AGE_GROUP_OPTIONS.find(
    (option) => option.id === profile?.ageGroup,
  )?.label;
  const consents = profile?.consents;
  const consentsOn = consents
    ? [
        consents.assessmentConsent,
        consents.aiInsightConsent,
        consents.communityVisibility,
      ].filter(Boolean).length
    : 0;

  return (
    <section className="grid gap-4">
      <div className="grid gap-1">
        <h1 className="text-[length:var(--text-display)] font-bold">
          {copy.ready.title}
        </h1>
        <p className="text-[var(--muted)]">{copy.ready.body}</p>
      </div>

      <div className="app-card grid gap-3">
        <SummaryRow
          label={copy.ready.nameLabel}
          value={profile?.displayName.trim() || copy.ready.notProvided}
        />
        <SummaryRow
          label={copy.ready.ageLabel}
          value={ageLabel ?? copy.ready.notProvided}
        />
        <SummaryRow
          label={copy.ready.areaLabel}
          value={profile?.planningArea ?? copy.ready.notProvided}
        />
        <SummaryRow
          label={copy.ready.contactLabel}
          value={profile?.supportContact?.name || copy.ready.contactNone}
        />
        <SummaryRow
          label={copy.ready.consentsLabel}
          value={copy.ready.consentsSummary(consentsOn, 3)}
        />
      </div>

      <div className="grid gap-3 pt-2">
        <button className="primary-action w-full" onClick={onStart} type="button">
          {copy.ready.start}
        </button>
        <button className="link-action" onClick={onBack} type="button">
          {copy.back}
        </button>
      </div>
    </section>
  );
}
