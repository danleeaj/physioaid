"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { ConsentScreen } from "@/components/assessment/screens/ConsentScreen";
import { SafetyScreen } from "@/components/assessment/screens/SafetyScreen";
import type { AssessmentFlow } from "@/components/assessment/useAssessmentFlow";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { TopBar } from "@/components/layout/TopBar";
import { shellCopy } from "@/components/layout/copy";
import { createDefaultSafetyResult } from "@/lib/assessment/session-draft";

const copy = shellCopy.precheck;

type PrecheckStep = "consent" | "safety";

/**
 * Two-step pre-check wizard: consent, then the safety questions. No contact
 * or demographics screens — those are profile-owned (onboarding). A safety
 * flag does not dead-end the flow: the warning shows inline and the
 * participant returns to the hub, where physical tests are locked but the
 * confidence questions stay open.
 */
export function PrecheckScreen({
  flow,
  onClose,
}: {
  flow: AssessmentFlow;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  // Resume at the safety questions when consent is already given.
  const [step, setStep] = useState<PrecheckStep>(() =>
    flow.consent.assessmentConsent && flow.safety === null
      ? "safety"
      : "consent",
  );

  const onConsentStep = step === "consent";
  const nextDisabled = onConsentStep && !flow.consent.assessmentConsent;
  const nextLabel = onConsentStep
    ? copy.next
    : flow.blockedBySafety
      ? copy.backToHub
      : copy.done;

  function handleNext() {
    if (onConsentStep) {
      setStep("safety");
      return;
    }
    // Confirms the answers as given (all-"No" defaults if untouched).
    flow.completeSafety();
    onClose();
  }

  function handleBack() {
    if (onConsentStep) {
      onClose();
    } else {
      setStep("consent");
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar backLabel={t("nav.back")} onBack={handleBack} title={copy.title} />

      <div className="app-content flex-1">
        {onConsentStep ? (
          <ConsentScreen consent={flow.consent} setConsent={flow.setConsent} />
        ) : (
          <SafetyScreen
            blockedBySafety={flow.blockedBySafety}
            safety={flow.safety ?? createDefaultSafetyResult()}
            setSafety={flow.setSafety}
          />
        )}
      </div>

      <footer className="flow-footer">
        <div className="flex items-center gap-3">
          <button className="link-action shrink-0" onClick={handleBack} type="button">
            <ArrowLeft aria-hidden size={18} />
            {t("nav.back")}
          </button>
          <button
            className="primary-action w-full flex-1"
            disabled={nextDisabled}
            onClick={handleNext}
            type="button"
          >
            {nextLabel} <ArrowRight aria-hidden size={22} />
          </button>
        </div>
      </footer>
    </div>
  );
}
