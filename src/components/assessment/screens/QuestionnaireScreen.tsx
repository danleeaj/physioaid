"use client";

import { NumberScale } from "@/components/assessment/ui/NumberScale";
import { ScreenHeader } from "@/components/assessment/ui/ScreenHeader";
import { DraftTranslationNote } from "@/components/i18n/DraftTranslationNote";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { clinicalText } from "@/lib/i18n/clinical-drafts";
import { fallsEfficacyQuestions } from "@/content/clinical-copy";
import type { QuestionnaireDraft } from "@/components/assessment/useAssessmentFlow";

/** UI-owned supporting lines — not clinical copy. */
const whyThisMatters: Record<string, string> = {
  balanceConfidence:
    "Everyday confidence shapes how much you move — and moving keeps you strong.",
  balanceRecoveryConfidence:
    "Knowing you can steady yourself helps you stay active without fear.",
  safeFallingConfidence:
    "Knowing how to protect yourself reduces injury and worry.",
  postFallRecoveryConfidence:
    "A plan for getting help keeps a stumble from becoming a crisis.",
};

export function QuestionnaireScreen({
  questionIndex,
  questionnaire,
  setQuestionnaire,
}: {
  questionIndex: number;
  questionnaire: QuestionnaireDraft;
  setQuestionnaire: React.Dispatch<React.SetStateAction<QuestionnaireDraft>>;
}) {
  const { t, lang } = useLanguage();
  const question = fallsEfficacyQuestions[questionIndex];
  const prompt = clinicalText(
    lang,
    `feq.${question.id}.prompt`,
    question.prompt,
  );
  const domain = clinicalText(
    lang,
    `feq.${question.id}.domain`,
    question.domain,
  );

  return (
    <section className="grid gap-6">
      <p className="text-[length:var(--text-label)] font-bold text-[var(--muted-strong)]">
        {t("questionnaire.progress", {
          current: questionIndex + 1,
          total: fallsEfficacyQuestions.length,
        })}
      </p>
      <ScreenHeader
        eyebrow={domain}
        support={whyThisMatters[question.id]}
        title={prompt}
      />
      <DraftTranslationNote />
      <NumberScale
        highLabel={t("questionnaire.scaleHigh")}
        lowLabel={t("questionnaire.scaleLow")}
        max={question.max}
        min={question.min}
        onChange={(value) =>
          setQuestionnaire((current) => ({
            ...current,
            [question.id]: value,
          }))
        }
        value={questionnaire[question.id]}
      />
    </section>
  );
}
