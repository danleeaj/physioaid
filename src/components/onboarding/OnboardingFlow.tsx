"use client";

import { useState } from "react";
import { useUserProfile } from "@/components/auth/UserProfileProvider";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { shellCopy } from "@/components/layout/copy";
import { AboutYouStep } from "@/components/onboarding/steps/AboutYouStep";
import { ConsentStep } from "@/components/onboarding/steps/ConsentStep";
import { ReadyStep } from "@/components/onboarding/steps/ReadyStep";
import { SupportContactStep } from "@/components/onboarding/steps/SupportContactStep";
import { WelcomeStep } from "@/components/onboarding/steps/WelcomeStep";
import type { UserProfile } from "@/types/profile";

const STEPS = [
  "welcome",
  "aboutYou",
  "supportContact",
  "consent",
  "ready",
] as const;

export type OnboardingStep = (typeof STEPS)[number];

/**
 * First-run profile setup for signed-in Firebase users. AppShell renders this
 * instead of the app until `onboardingStatus === "complete"` (demo mode never
 * gets here — demoProfile is onboarding-complete).
 *
 * Progress is written to the profile after every step, so a killed tab
 * resumes at the step after `onboarding.lastCompletedStep`. Back moves
 * locally only and never rewrites `lastCompletedStep` backwards.
 */
export function OnboardingFlow() {
  const { profile, updateProfile } = useUserProfile();
  const { lang } = useLanguage();
  const copy = shellCopy[lang].onboarding;
  const [stepIndex, setStepIndex] = useState(() => {
    const last = profile?.onboarding.lastCompletedStep ?? null;
    const resumeAt = last ? STEPS.indexOf(last) + 1 : 0;
    return Math.min(Math.max(resumeAt, 0), STEPS.length - 1);
  });

  const step = STEPS[stepIndex];

  async function completeStep(
    current: OnboardingStep,
    fields: Partial<UserProfile> = {},
  ) {
    await updateProfile({
      ...fields,
      onboarding: {
        status: "in_progress",
        lastCompletedStep: current,
        completedAt: null,
      },
    });
    setStepIndex((index) => Math.min(index + 1, STEPS.length - 1));
  }

  async function finish() {
    // The provider flips onboardingStatus to "complete" optimistically and
    // AppShell swaps this flow out for the app.
    await updateProfile({
      onboarding: {
        status: "complete",
        lastCompletedStep: "ready",
        completedAt: new Date().toISOString(),
      },
    });
  }

  function back() {
    setStepIndex((index) => Math.max(index - 1, 0));
  }

  return (
    <div className="app-content min-h-dvh pb-[calc(20px+env(safe-area-inset-bottom))] pt-10">
      <header className="grid gap-2">
        <p className="eyebrow">{copy.eyebrow}</p>
        <p className="text-[length:var(--text-label)] text-[var(--muted)]">
          {copy.step(stepIndex + 1, STEPS.length)}
        </p>
        <div aria-hidden className="flex gap-1.5">
          {STEPS.map((name, index) => (
            <span
              className={`h-2 w-2 rounded-full ${
                index <= stepIndex ? "bg-[var(--primary)]" : "bg-[var(--line)]"
              }`}
              key={name}
            />
          ))}
        </div>
      </header>

      {step === "welcome" && (
        <WelcomeStep onContinue={() => completeStep("welcome")} />
      )}
      {step === "aboutYou" && (
        <AboutYouStep
          onBack={back}
          onContinue={(fields) => completeStep("aboutYou", fields)}
          profile={profile}
        />
      )}
      {step === "supportContact" && (
        <SupportContactStep
          onBack={back}
          onContinue={(contact) =>
            completeStep("supportContact", { supportContact: contact })
          }
          profile={profile}
        />
      )}
      {step === "consent" && (
        <ConsentStep
          onBack={back}
          onContinue={(consents) => completeStep("consent", { consents })}
          profile={profile}
        />
      )}
      {step === "ready" && (
        <ReadyStep onBack={back} onStart={finish} profile={profile} />
      )}
    </div>
  );
}
