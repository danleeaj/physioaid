"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { ChoiceOption } from "@/components/assessment/ui/ChoiceOption";
import { TextField } from "@/components/assessment/ui/Fields";
import { TextSizeControl } from "@/components/dashboard/TextSizeControl";
import { LangSwitch } from "@/components/i18n/LangSwitch";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { PRODUCT_NAME } from "@/config/clinical-config";
import type { MessageKey } from "@/lib/i18n/messages";
import {
  AGE_GROUP_AGES,
  type AgeGroup,
  type UserProfile,
} from "@/lib/user-profile";

/**
 * First-run onboarding for real accounts — identifies the user before any
 * assessment. One question per screen, Mobbin-style: thin progress strip,
 * one dominant action, big targets. Demo sessions never see this.
 */

type StepId =
  | "welcome"
  | "name"
  | "age"
  | "living"
  | "language"
  | "textSize"
  | "contact"
  | "consentPrivacy"
  | "consentAI"
  | "consentCommunity";

const steps: StepId[] = [
  "welcome",
  "name",
  "age",
  "living",
  "language",
  "textSize",
  "contact",
  "consentPrivacy",
  "consentAI",
  "consentCommunity",
];

const ageGroups: { id: AgeGroup; labelKey: MessageKey }[] = [
  { id: "under60", labelKey: "onboarding.age.under60" },
  { id: "60s", labelKey: "onboarding.age.60s" },
  { id: "70s", labelKey: "onboarding.age.70s" },
  { id: "80plus", labelKey: "onboarding.age.80plus" },
];

// Stored as the human-readable strings Demographics.livingSituation expects.
const livingOptions: { value: string; labelKey: MessageKey }[] = [
  { value: "Lives alone", labelKey: "onboarding.living.alone" },
  { value: "Lives with spouse", labelKey: "onboarding.living.spouse" },
  { value: "Lives with family", labelKey: "onboarding.living.family" },
  { value: "Lives with helper or support", labelKey: "onboarding.living.support" },
];

export function OnboardingScreen({
  initialProfile,
  onComplete,
}: {
  initialProfile: UserProfile;
  onComplete: (profile: UserProfile) => void;
}) {
  const { t, lang } = useLanguage();
  const reducedMotion = useReducedMotion();
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<UserProfile>(initialProfile);

  const step = steps[stepIndex];
  const totalQuestions = steps.length - 1; // welcome excluded from the count
  const isLast = stepIndex === steps.length - 1;

  function patch(partial: Partial<UserProfile>) {
    setDraft((current) => ({ ...current, ...partial }));
  }

  const continueDisabled =
    (step === "name" && draft.name.trim() === "") ||
    (step === "age" && draft.ageGroup === null) ||
    (step === "living" && draft.livingSituation === "") ||
    (step === "consentPrivacy" && !draft.consents.privacy);

  function next() {
    if (isLast) {
      onComplete({
        ...draft,
        name: draft.name.trim(),
        preferred_language: lang,
        onboardedAt: new Date().toISOString(),
      });
      return;
    }
    setStepIndex((index) => index + 1);
  }

  function back() {
    setStepIndex((index) => Math.max(index - 1, 0));
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="top-bar">
        <h1 className="top-bar__title">
          {stepIndex === 0
            ? PRODUCT_NAME
            : t("onboarding.progress", { current: stepIndex, total: totalQuestions })}
        </h1>
      </header>
      <div className="px-5 pt-3">
        <div aria-hidden className="progress-track" style={{ height: 4 }}>
          <div
            className="progress-fill"
            style={{ width: `${Math.round((stepIndex / totalQuestions) * 100)}%` }}
          />
        </div>
      </div>

      <div className="app-content flex-1">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
            className="grid grid-cols-1 gap-4"
            exit={reducedMotion ? { opacity: 1 } : { opacity: 0, x: -24 }}
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, x: 24 }}
            key={step}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            {step === "welcome" && (
              <>
                <h2 className="flow-question">{t("onboarding.welcome.title")}</h2>
                <p className="text-[var(--muted)]">{t("onboarding.welcome.body")}</p>
              </>
            )}

            {step === "name" && (
              <>
                <h2 className="flow-question">{t("onboarding.name.title")}</h2>
                <p className="text-[var(--muted)]">{t("onboarding.name.support")}</p>
                <TextField
                  label={t("contact.displayName")}
                  onChange={(value) => patch({ name: value })}
                  value={draft.name}
                />
              </>
            )}

            {step === "age" && (
              <>
                <h2 className="flow-question">{t("onboarding.age.title")}</h2>
                <p className="text-[var(--muted)]">{t("onboarding.age.support")}</p>
                <div className="grid gap-3" role="radiogroup">
                  {ageGroups.map((group) => (
                    <ChoiceOption
                      key={group.id}
                      onSelect={() =>
                        patch({ ageGroup: group.id, age: AGE_GROUP_AGES[group.id] })
                      }
                      selected={draft.ageGroup === group.id}
                    >
                      {t(group.labelKey)}
                    </ChoiceOption>
                  ))}
                </div>
              </>
            )}

            {step === "living" && (
              <>
                <h2 className="flow-question">{t("onboarding.living.title")}</h2>
                <div className="grid gap-3" role="radiogroup">
                  {livingOptions.map((option) => (
                    <ChoiceOption
                      key={option.value}
                      onSelect={() => patch({ livingSituation: option.value })}
                      selected={draft.livingSituation === option.value}
                    >
                      {t(option.labelKey)}
                    </ChoiceOption>
                  ))}
                </div>
              </>
            )}

            {step === "language" && (
              <>
                <h2 className="flow-question">{t("onboarding.language.title")}</h2>
                <p className="text-[var(--muted)]">{t("onboarding.language.support")}</p>
                <div className="-mx-5 overflow-x-auto px-5">
                  <LangSwitch />
                </div>
              </>
            )}

            {step === "textSize" && (
              <>
                <h2 className="flow-question">{t("onboarding.textSize.title")}</h2>
                <p className="text-[var(--muted)]">{t("onboarding.textSize.support")}</p>
                <TextSizeControl onChange={(textSize) => patch({ textSize })} />
              </>
            )}

            {step === "contact" && (
              <>
                <h2 className="flow-question">{t("onboarding.contact.title")}</h2>
                <p className="text-[var(--muted)]">{t("onboarding.contact.support")}</p>
                <TextField
                  label={t("contact.name")}
                  onChange={(value) =>
                    patch({
                      emergencyContact: { ...draft.emergencyContact, name: value },
                    })
                  }
                  value={draft.emergencyContact.name}
                />
                <TextField
                  label={t("contact.phone")}
                  onChange={(value) =>
                    patch({
                      emergencyContact: { ...draft.emergencyContact, phone: value },
                    })
                  }
                  type="tel"
                  value={draft.emergencyContact.phone}
                />
                <TextField
                  label={t("contact.relationship")}
                  onChange={(value) =>
                    patch({
                      emergencyContact: {
                        ...draft.emergencyContact,
                        relationship: value,
                      },
                    })
                  }
                  value={draft.emergencyContact.relationship}
                />
                <button className="link-action justify-self-start" onClick={next} type="button">
                  {t("onboarding.skip")}
                </button>
              </>
            )}

            {step === "consentPrivacy" && (
              <>
                <h2 className="flow-question">{t("onboarding.consentPrivacy.title")}</h2>
                <p className="text-[var(--muted)]">{t("onboarding.consentPrivacy.body")}</p>
                <ChoiceOption
                  onSelect={() =>
                    patch({
                      consents: {
                        ...draft.consents,
                        privacy: !draft.consents.privacy,
                      },
                    })
                  }
                  selected={draft.consents.privacy}
                >
                  {t("onboarding.consentPrivacy.agree")}
                </ChoiceOption>
              </>
            )}

            {step === "consentAI" && (
              <>
                <h2 className="flow-question">{t("onboarding.consentAI.title")}</h2>
                <p className="text-[var(--muted)]">{t("onboarding.consentAI.body")}</p>
                <div className="grid gap-3" role="radiogroup">
                  <ChoiceOption
                    onSelect={() =>
                      patch({ consents: { ...draft.consents, aiInsights: true } })
                    }
                    selected={draft.consents.aiInsights}
                  >
                    {t("onboarding.consentAI.yes")}
                  </ChoiceOption>
                  <ChoiceOption
                    onSelect={() =>
                      patch({ consents: { ...draft.consents, aiInsights: false } })
                    }
                    selected={!draft.consents.aiInsights}
                  >
                    {t("onboarding.consentAI.no")}
                  </ChoiceOption>
                </div>
              </>
            )}

            {step === "consentCommunity" && (
              <>
                <h2 className="flow-question">
                  {t("onboarding.consentCommunity.title")}
                </h2>
                <p className="text-[var(--muted)]">
                  {t("onboarding.consentCommunity.body")}
                </p>
                <div className="grid gap-3" role="radiogroup">
                  <ChoiceOption
                    onSelect={() =>
                      patch({
                        consents: { ...draft.consents, communityVisibility: true },
                      })
                    }
                    selected={draft.consents.communityVisibility}
                  >
                    {t("onboarding.consentCommunity.yes")}
                  </ChoiceOption>
                  <ChoiceOption
                    onSelect={() =>
                      patch({
                        consents: { ...draft.consents, communityVisibility: false },
                      })
                    }
                    selected={!draft.consents.communityVisibility}
                  >
                    {t("onboarding.consentCommunity.no")}
                  </ChoiceOption>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="flow-footer">
        <div className="flex items-center gap-3">
          {stepIndex > 0 && (
            <button className="link-action shrink-0" onClick={back} type="button">
              <ArrowLeft aria-hidden size={18} />
              {t("onboarding.back")}
            </button>
          )}
          <button
            className="primary-action w-full flex-1"
            disabled={continueDisabled}
            onClick={next}
            type="button"
          >
            {step === "welcome"
              ? t("onboarding.welcome.start")
              : isLast
                ? t("onboarding.finish")
                : t("onboarding.continue")}
            <ArrowRight aria-hidden size={22} />
          </button>
        </div>
      </footer>
    </div>
  );
}
