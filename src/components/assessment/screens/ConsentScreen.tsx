"use client";

import { BarChart3, ShieldOff } from "lucide-react";
import { ChoiceOption } from "@/components/assessment/ui/ChoiceOption";
import { ScreenHeader } from "@/components/assessment/ui/ScreenHeader";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import type { ConsentRecord } from "@/types/assessment";

/**
 * Consent step of the pre-check. Demographics (name, age, planning area)
 * are profile-owned and collected in onboarding — this screen records only
 * the per-session consent choices.
 */
export function ConsentScreen({
  consent,
  setConsent,
}: {
  consent: ConsentRecord;
  setConsent: React.Dispatch<React.SetStateAction<ConsentRecord>>;
}) {
  const { t } = useLanguage();

  function setResearchConsent(value: boolean) {
    setConsent((current) => ({
      ...current,
      researchConsent: value,
      consentedAt: new Date().toISOString(),
    }));
  }

  return (
    <section className="grid gap-6">
      <ScreenHeader support={t("consent.support")} title={t("consent.title")} />

      <ChoiceOption
        onSelect={() =>
          setConsent((current) => ({
            ...current,
            assessmentConsent: !current.assessmentConsent,
            consentedAt: new Date().toISOString(),
          }))
        }
        selected={consent.assessmentConsent}
      >
        {t("consent.assessment.label")}
      </ChoiceOption>

      <div className="grid gap-3">
        <h2 className="flex items-center gap-2 text-[length:var(--text-lead)] font-semibold">
          <BarChart3 aria-hidden className="text-[var(--primary)]" size={22} />
          {t("consent.research.title")}
        </h2>
        <p className="max-w-2xl text-[var(--muted)]">
          {t("consent.research.body")}
        </p>
        <div className="grid gap-3" role="radiogroup">
          <ChoiceOption
            onSelect={() => setResearchConsent(true)}
            selected={consent.researchConsent}
          >
            {t("consent.research.yes")}
          </ChoiceOption>
          <ChoiceOption
            onSelect={() => setResearchConsent(false)}
            selected={!consent.researchConsent}
          >
            {t("consent.research.no")}
          </ChoiceOption>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-4 text-[length:var(--text-label)] text-[var(--muted-strong)]">
        <ShieldOff
          aria-hidden
          className="mt-0.5 shrink-0 text-[var(--primary)]"
          size={18}
        />
        <p>{t("consent.privacyNote")}</p>
      </div>
    </section>
  );
}
