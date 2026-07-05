"use client";

import { BarChart3, ShieldOff } from "lucide-react";
import { ChoiceOption } from "@/components/assessment/ui/ChoiceOption";
import { ScreenHeader } from "@/components/assessment/ui/ScreenHeader";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { PLANNING_AREAS, saveChosenArea } from "@/lib/planning-areas";
import type { ConsentRecord, Demographics } from "@/types/assessment";

export function ConsentScreen({
  consent,
  setConsent,
  demographics,
  setDemographics,
}: {
  consent: ConsentRecord;
  setConsent: React.Dispatch<React.SetStateAction<ConsentRecord>>;
  demographics: Demographics;
  setDemographics: React.Dispatch<React.SetStateAction<Demographics>>;
}) {
  const { t } = useLanguage();

  function setResearchConsent(value: boolean) {
    setConsent((current) => ({
      ...current,
      researchConsent: value,
      consentedAt: new Date().toISOString(),
    }));
    if (!value) {
      setDemographics((current) => ({ ...current, planningArea: undefined }));
    }
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

      {consent.researchConsent && (
        <label className="grid max-w-md gap-2">
          <span className="text-[length:var(--text-label)] font-bold">
            {t("consent.area.label")}
          </span>
          <span className="text-[length:var(--text-label)] text-[var(--muted)]">
            {t("consent.area.help")}
          </span>
          <select
            className="input-field"
            onChange={(event) => {
              const area = event.target.value || undefined;
              setDemographics((current) => ({
                ...current,
                planningArea: area,
              }));
              if (area) {
                saveChosenArea(area);
              }
            }}
            value={demographics.planningArea ?? ""}
          >
            <option value="">—</option>
            {PLANNING_AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </label>
      )}

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
