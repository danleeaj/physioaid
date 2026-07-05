"use client";

import { ScreenHeader } from "@/components/assessment/ui/ScreenHeader";
import { SafetyCallout } from "@/components/assessment/ui/SafetyCallout";
import { DraftTranslationNote } from "@/components/i18n/DraftTranslationNote";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { clinicalText } from "@/lib/i18n/clinical-drafts";
import { safetyQuestions } from "@/config/clinical-config";
import type { SafetyScreenResult } from "@/types/assessment";

const SAFETY_INTRO =
  "Before we start, we need to check that it is safe for you to do a simple chair stand movement test today.";

const SAFETY_STOP =
  "Please do not continue with the movement test right now. Consider asking someone to support you or seek advice from a community or healthcare professional. You may continue in demo mode only.";

export function SafetyScreen({
  safety,
  setSafety,
  blockedBySafety,
}: {
  safety: SafetyScreenResult;
  setSafety: React.Dispatch<React.SetStateAction<SafetyScreenResult>>;
  blockedBySafety: boolean;
}) {
  const { t, lang } = useLanguage();
  const intro = clinicalText(lang, "safety.intro", SAFETY_INTRO);

  return (
    <section className="grid gap-6">
      <ScreenHeader support={intro} title={t("safety.title")} />
      <DraftTranslationNote />

      <div className="grid gap-5">
        {safetyQuestions.map((question) => {
          const answeredYes = Boolean(safety[question.id]);
          const label = clinicalText(
            lang,
            `safety.${question.id}`,
            question.label,
          );

          return (
            <fieldset className="grid gap-3" key={question.id}>
              <legend className="mb-3 text-[length:var(--text-lead)] font-semibold">
                {label}
              </legend>
              <div className="grid grid-cols-2 gap-3" role="radiogroup">
                {([
                  [false, t("safety.answer.no")],
                  [true, t("safety.answer.yes")],
                ] as const).map(([value, answerLabel]) => {
                  const selected = answeredYes === value;
                  return (
                    <button
                      aria-checked={selected}
                      className="choice-option justify-center"
                      data-selected={selected}
                      key={String(value)}
                      onClick={() =>
                        setSafety((current) => ({
                          ...current,
                          [question.id]: value,
                        }))
                      }
                      role="radio"
                      type="button"
                    >
                      {answerLabel}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>

      {blockedBySafety && (
        <SafetyCallout tone="danger">
          {clinicalText(lang, "safetyStop.body", SAFETY_STOP)}
        </SafetyCallout>
      )}
    </section>
  );
}
