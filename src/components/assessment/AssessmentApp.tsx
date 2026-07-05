"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ProgressBar } from "@/components/assessment/ProgressBar";
import { ChairStandScreen } from "@/components/assessment/screens/ChairStandScreen";
import { ContactScreen } from "@/components/assessment/screens/ContactScreen";
import { DashboardScreen } from "@/components/assessment/screens/DashboardScreen";
import { FloorRisingScreen } from "@/components/assessment/screens/FloorRisingScreen";
import { GaitScreen } from "@/components/assessment/screens/GaitScreen";
import { LandingScreen } from "@/components/assessment/screens/LandingScreen";
import { QuestionnaireScreen } from "@/components/assessment/screens/QuestionnaireScreen";
import { SafetyScreen } from "@/components/assessment/screens/SafetyScreen";
import { useAssessmentFlow } from "@/components/assessment/useAssessmentFlow";
import { LangSwitch } from "@/components/i18n/LangSwitch";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { PRODUCT_NAME } from "@/config/clinical-config";

export function AssessmentApp() {
  const flow = useAssessmentFlow();
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();

  const {
    steps,
    stepIndex,
    currentStep,
    questionIndex,
    currentPhysicalPhase,
    isPhysicalDemoScreen,
    blockedBySafety,
    next,
    back,
    loadDemo,
    demoLoaded,
  } = flow;

  const isLanding = currentStep === "landing";
  const isDashboard = currentStep === "dashboard";
  const showChrome = !isLanding;
  const showFooter = !isLanding && !isDashboard;
  // Landing and dashboard are excluded from the "Step X of Y" count.
  const totalProgressSteps = steps.length - 2;
  const screenKey = `${currentStep}-${questionIndex}-${currentPhysicalPhase ?? ""}`;

  const nextLabel =
    currentStep === "safety" && blockedBySafety
      ? t("nav.goToSummary")
      : isPhysicalDemoScreen
        ? t("nav.continueAbove")
        : t("nav.next");

  return (
    <main className="min-h-dvh pb-[env(safe-area-inset-bottom)]">
      <div
        className={`mx-auto flex w-full flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 ${
          isLanding || isDashboard ? "max-w-4xl" : "max-w-2xl"
        }`}
      >
        {showChrome && (
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
            <p className="eyebrow">{PRODUCT_NAME}</p>
            <LangSwitch />
          </header>
        )}

        {showFooter && (
          <ProgressBar current={stepIndex} total={totalProgressSteps} />
        )}

        <AnimatePresence initial={false} mode="wait">
          <motion.div
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={reducedMotion ? { opacity: 1 } : { opacity: 0, x: -24 }}
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, x: 24 }}
            key={screenKey}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            {currentStep === "landing" && (
              <LandingScreen
                demoLoaded={demoLoaded}
                onLoadDemo={loadDemo}
                onStart={next}
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
            {currentStep === "dashboard" && <DashboardScreen flow={flow} />}
          </motion.div>
        </AnimatePresence>

        {isDashboard && (
          <footer className="flex justify-start border-t border-[var(--line)] pt-4">
            <button className="link-action" onClick={back} type="button">
              <ArrowLeft aria-hidden size={18} />
              {t("nav.back")}
            </button>
          </footer>
        )}
      </div>

      {showFooter && (
        <footer className="sticky bottom-0 z-10 border-t border-[var(--line)] bg-[var(--background)]">
          <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:px-6">
            <button className="link-action shrink-0" onClick={back} type="button">
              <ArrowLeft aria-hidden size={18} />
              {t("nav.back")}
            </button>
            <button
              className="primary-action w-full flex-1"
              disabled={isPhysicalDemoScreen}
              onClick={next}
              type="button"
            >
              {nextLabel} <ArrowRight aria-hidden size={22} />
            </button>
          </div>
        </footer>
      )}
    </main>
  );
}
