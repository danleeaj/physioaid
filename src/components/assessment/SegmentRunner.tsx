"use client";

import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChairStandScreen } from "@/components/assessment/screens/ChairStandScreen";
import { ConsentScreen } from "@/components/assessment/screens/ConsentScreen";
import { ContactScreen } from "@/components/assessment/screens/ContactScreen";
import { GaitScreen } from "@/components/assessment/screens/GaitScreen";
import { QuestionnaireScreen } from "@/components/assessment/screens/QuestionnaireScreen";
import { SafetyScreen } from "@/components/assessment/screens/SafetyScreen";
import type { AssessmentFlow } from "@/components/assessment/useAssessmentFlow";
import { LangSwitch } from "@/components/i18n/LangSwitch";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { TopBar } from "@/components/layout/TopBar";
import { fallsEfficacyQuestions } from "@/content/clinical-copy";
import type { AssessmentStep } from "@/types/assessment";

const lastQuestionIndex = fallsEfficacyQuestions.length - 1;

/**
 * Runs one hub segment (an ordered, contiguous subset of the flow's steps)
 * with the guided-flow chrome: sticky header, thin progress strip, one
 * screen at a time, sticky footer. Continue advances within the segment and
 * calls `onComplete` at the segment's end — the flow's own gate branches in
 * next() are never reached, so gating lives in the hub's lock derivation.
 */
export function SegmentRunner({
  flow,
  segmentSteps,
  title,
  onComplete,
  onExit,
}: {
  flow: AssessmentFlow;
  segmentSteps: AssessmentStep[];
  title: string;
  onComplete: () => void;
  onExit: () => void;
}) {
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();

  const { currentStep, questionIndex, currentPhysicalPhase, isPhysicalDemoScreen } =
    flow;

  const positionInSegment = Math.max(segmentSteps.indexOf(currentStep), 0);
  const isQuestionnaire = currentStep === "questionnaire";
  // Progress within THIS segment (questionnaire counts its questions).
  const progressTotal = isQuestionnaire
    ? fallsEfficacyQuestions.length
    : segmentSteps.length;
  const progressCurrent = isQuestionnaire ? questionIndex + 1 : positionInSegment + 1;

  const atSegmentStart =
    positionInSegment === 0 && (!isQuestionnaire || questionIndex === 0);
  const atSegmentEnd =
    positionInSegment === segmentSteps.length - 1 &&
    (!isQuestionnaire || questionIndex === lastQuestionIndex);

  const screenKey = `${currentStep}-${questionIndex}-${currentPhysicalPhase ?? ""}`;

  function handleContinue() {
    if (atSegmentEnd) {
      onComplete();
    } else {
      flow.next();
    }
  }

  function handleBack() {
    if (atSegmentStart) {
      onExit();
    } else {
      // Segments are contiguous slices of the flow's steps, so back() stays
      // inside the segment (and walks questionnaire questions backwards).
      flow.back();
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar
        backLabel={t("nav.back")}
        onBack={handleBack}
        right={
          <button className="link-action shrink-0" onClick={onExit} type="button">
            <X aria-hidden size={18} />
            {t("shell.flow.exit")}
          </button>
        }
        title={title}
      />
      <div className="px-5 pt-3">
        <div aria-hidden className="progress-track" style={{ height: 4 }}>
          <div
            className="progress-fill"
            style={{
              width: `${Math.round((progressCurrent / progressTotal) * 100)}%`,
            }}
          />
        </div>
      </div>
      <div className="overflow-x-auto px-5 pt-3">
        <LangSwitch />
      </div>

      <div className="app-content flex-1">
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
                blockedBySafety={flow.blockedBySafety}
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
            onClick={handleContinue}
            type="button"
          >
            {isPhysicalDemoScreen ? t("nav.continueAbove") : t("nav.next")}
            <ArrowRight aria-hidden size={22} />
          </button>
        </div>
      </footer>
    </div>
  );
}
