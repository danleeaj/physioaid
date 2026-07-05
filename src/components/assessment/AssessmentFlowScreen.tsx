"use client";

import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { ChairStandScreen } from "@/components/assessment/screens/ChairStandScreen";
import { ConsentScreen } from "@/components/assessment/screens/ConsentScreen";
import { ContactScreen } from "@/components/assessment/screens/ContactScreen";
import { FloorRisingScreen } from "@/components/assessment/screens/FloorRisingScreen";
import { GaitScreen } from "@/components/assessment/screens/GaitScreen";
import { QuestionnaireScreen } from "@/components/assessment/screens/QuestionnaireScreen";
import { SafetyScreen } from "@/components/assessment/screens/SafetyScreen";
import { useAssessmentFlow } from "@/components/assessment/useAssessmentFlow";
import { AssessmentResultScreen } from "@/components/dashboard/AssessmentResultScreen";
import type { AssessmentSession } from "@/types/assessment";
import { ConfirmDialog } from "@/components/layout/ConfirmDialog";
import { TopBar } from "@/components/layout/TopBar";
import { shellCopy } from "@/components/layout/copy";
import { LangSwitch } from "@/components/i18n/LangSwitch";
import { useLanguage } from "@/components/i18n/LanguageProvider";

/**
 * Guided Assessment Flow — the existing safety-gated step machine
 * (consent → safety → contact → confidence → chair stand → gait → floor
 * rising → result) rendered one focused screen at a time inside the app
 * shell. All step screens, gates and scoring are the pre-existing logic.
 */
export function AssessmentFlowScreen({
  demoMode,
  onExit,
  onSaved,
  onViewResources,
}: {
  demoMode: boolean;
  onExit: () => void;
  onSaved: (session: AssessmentSession) => void;
  onViewResources: () => void;
}) {
  const flow = useAssessmentFlow({ initialStep: "consent" });
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();
  const [confirmExit, setConfirmExit] = useState(false);

  const {
    steps,
    stepIndex,
    currentStep,
    questionIndex,
    currentPhysicalPhase,
    isPhysicalDemoScreen,
    blockedBySafety,
    demoLoaded,
    next,
    back,
    loadDemo,
  } = flow;

  const isResult = currentStep === "dashboard";
  const firstStepIndex = steps.indexOf("consent");
  const atFirstScreen = stepIndex === firstStepIndex;
  // Landing and result are excluded from the "Step X of Y" count (unchanged).
  const totalProgressSteps = steps.length - 2;
  const screenKey = `${currentStep}-${questionIndex}-${currentPhysicalPhase ?? ""}`;
  const hasAnswers = flow.consent.assessmentConsent || stepIndex > firstStepIndex;

  const nextLabel =
    currentStep === "safety" && blockedBySafety
      ? t("nav.goToSummary")
      : isPhysicalDemoScreen
        ? t("nav.continueAbove")
        : t("nav.next");

  function requestExit() {
    if (hasAnswers) {
      setConfirmExit(true);
    } else {
      onExit();
    }
  }

  function handleBack() {
    if (atFirstScreen) {
      requestExit();
    } else {
      back();
    }
  }

  if (isResult) {
    return (
      <>
        <TopBar backLabel={t("nav.back")} onBack={onExit} title={shellCopy.result.title} />
        <AssessmentResultScreen
          demoMode={demoMode}
          flow={flow}
          onBackToAssessment={onExit}
          onSaveToHistory={onSaved}
          onViewResources={onViewResources}
        />
      </>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar
        backLabel={t("nav.back")}
        onBack={handleBack}
        right={
          <button className="link-action shrink-0" onClick={requestExit} type="button">
            <X aria-hidden size={18} />
            {shellCopy.flow.exit}
          </button>
        }
        title={t("progress.step", { current: stepIndex, total: totalProgressSteps })}
      />
      {/* Thin progress strip per the mobile flow contract */}
      <div className="px-5 pt-3">
        <div
          aria-hidden
          className="progress-track"
          style={{ height: 4 }}
        >
          <div
            className="progress-fill"
            style={{ width: `${Math.round((stepIndex / totalProgressSteps) * 100)}%` }}
          />
        </div>
      </div>
      {/* Language switcher on its own scrollable row — four languages never fit the top bar */}
      <div className="overflow-x-auto px-5 pt-3">
        <LangSwitch />
      </div>

      <div className="app-content flex-1">
        {/* Sample answers are opt-in — a new assessment always starts fresh */}
        {demoMode && currentStep === "consent" && (
          <div>
            {demoLoaded ? (
              <p
                aria-live="polite"
                className="text-[length:var(--text-label)] text-[var(--muted-strong)]"
              >
                {shellCopy.flow.sampleLoaded}
              </p>
            ) : (
              <button className="link-action" onClick={loadDemo} type="button">
                {shellCopy.flow.loadSample}
              </button>
            )}
          </div>
        )}
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={reducedMotion ? { opacity: 1 } : { opacity: 0, x: -24 }}
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, x: 24 }}
            key={screenKey}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            {currentStep === "consent" && (
              <ConsentScreen
                consent={flow.consent}
                demographics={flow.demographics}
                setConsent={flow.setConsent}
                setDemographics={flow.setDemographics}
              />
            )}
            {currentStep === "safety" && (
              <SafetyScreen
                blockedBySafety={blockedBySafety}
                safety={flow.safety}
                setSafety={flow.setSafety}
              />
            )}
            {currentStep === "emergency_contact" && (
              <ContactScreen
                contact={flow.contact}
                demographics={flow.demographics}
                setContact={flow.setContact}
                setDemographics={flow.setDemographics}
              />
            )}
            {currentStep === "questionnaire" && (
              <QuestionnaireScreen
                questionIndex={questionIndex}
                questionnaire={flow.questionnaire}
                setQuestionnaire={flow.setQuestionnaire}
              />
            )}
            {currentStep === "chair_stand" && <ChairStandScreen flow={flow} />}
            {currentStep === "motion_gait" && <GaitScreen flow={flow} />}
            {currentStep === "floor_rising" && <FloorRisingScreen flow={flow} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="flow-footer">
        <div className="flex items-center gap-3">
          <button className="link-action shrink-0" onClick={handleBack} type="button">
            <ArrowLeft aria-hidden size={18} />
            {t("nav.back")}
          </button>
          <button
            className="primary-action w-full flex-1"
            disabled={
              isPhysicalDemoScreen ||
              (currentStep === "consent" && !flow.consent.assessmentConsent)
            }
            onClick={next}
            type="button"
          >
            {nextLabel} <ArrowRight aria-hidden size={22} />
          </button>
        </div>
      </footer>

      {confirmExit && (
        <ConfirmDialog
          body={shellCopy.flow.exitBody}
          cancelLabel={shellCopy.flow.exitCancel}
          confirmLabel={shellCopy.flow.exitConfirm}
          onCancel={() => setConfirmExit(false)}
          onConfirm={onExit}
          title={shellCopy.flow.exitTitle}
        />
      )}
    </div>
  );
}
