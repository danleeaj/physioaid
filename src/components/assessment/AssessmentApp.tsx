"use client";

import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Download,
  HeartPulse,
  Link as LinkIcon,
  PersonStanding,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { careLinkageOptions } from "@/content/care-linkage";
import { fallsEfficacyQuestions, profileCopy } from "@/content/clinical-copy";
import {
  DECISION_SUPPORT_DISCLAIMER,
  PRODUCT_NAME,
  PRODUCT_POSITIONING,
  safetyQuestions,
} from "@/config/clinical-config";
import { analyseAssessment } from "@/lib/analytics/ability-confidence";
import { createDemoSession } from "@/lib/demo-session";
import {
  getDemoFloorRisingMetrics,
  getSkippedFloorRisingMetrics,
} from "@/lib/functional-tests/floor-rising";
import { scoreFallsEfficacy } from "@/lib/questionnaire";
import { getDemoMotionMetrics } from "@/lib/sensors/motion-summary";
import { getDemoChairStandMetrics } from "@/lib/vision/chair-stand";
import type {
  AssessmentStep,
  ChairStandMetrics,
  Demographics,
  EmergencyContact,
  FloorRisingMetrics,
  MotionMetrics,
  SafetyScreenResult,
} from "@/types/assessment";

const steps: AssessmentStep[] = [
  "landing",
  "safety",
  "emergency_contact",
  "demographics",
  "questionnaire",
  "chair_stand",
  "motion_gait",
  "floor_rising",
  "dashboard",
];

const stepLabels: Record<AssessmentStep, string> = {
  landing: "Start",
  safety: "Safety",
  emergency_contact: "Contact",
  demographics: "Details",
  questionnaire: "Confidence",
  chair_stand: "Chair stand",
  motion_gait: "Gait walk",
  floor_rising: "Floor rise",
  dashboard: "Dashboard",
  report: "Report",
};

type QuestionnaireDraft = {
  balanceConfidence: number;
  balanceRecoveryConfidence: number;
  safeFallingConfidence: number;
  postFallRecoveryConfidence: number;
};

export function AssessmentApp() {
  const [stepIndex, setStepIndex] = useState(0);
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [safety, setSafety] = useState<SafetyScreenResult>({
    dizziness: false,
    breathlessness: false,
    pain: false,
    recentFallOrInjury: false,
    needsSupervision: false,
    canProceed: true,
  });
  const [contact, setContact] = useState<EmergencyContact>({
    name: "",
    phone: "",
    relationship: "",
  });
  const [demographics, setDemographics] = useState<Demographics>({
    displayName: "Mr Tan",
    age: 78,
    livingSituation: "Lives with spouse",
    fallHistory: "near_fall",
  });
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireDraft>({
    balanceConfidence: 5,
    balanceRecoveryConfidence: 4,
    safeFallingConfidence: 3,
    postFallRecoveryConfidence: 5,
  });
  const [chairStand, setChairStand] = useState<ChairStandMetrics>({
    completionStatus: "demo",
    durationSeconds: 16,
    repetitions: 5,
    movementQuality: "variable",
    source: "demo",
  });
  const [motion, setMotion] = useState<MotionMetrics>(getDemoMotionMetrics());
  const [floorRising, setFloorRising] = useState<FloorRisingMetrics>(
    getDemoFloorRisingMetrics(),
  );

  const currentStep = steps[stepIndex];
  const scoredQuestionnaire = useMemo(
    () => scoreFallsEfficacy(questionnaire),
    [questionnaire],
  );
  const analytics = analyseAssessment({
    questionnaire: scoredQuestionnaire,
    chairStand,
    motion,
  });
  const blockedBySafety =
    safety.dizziness ||
    safety.breathlessness ||
    safety.pain ||
    safety.recentFallOrInjury;
  const chairStandGate = getChairStandGate(chairStand, blockedBySafety);
  const motionGate = getMotionGate(motion);
  const floorRisingGate = getFloorRisingGate(floorRising);
  const stoppedBeforeHigherRisk =
    blockedBySafety ||
    !chairStandGate.canProceed ||
    !motionGate.canProceed ||
    !floorRisingGate.canProceed;

  function next() {
    if (currentStep === "safety" && blockedBySafety) {
      setFloorRising(getSkippedFloorRisingMetrics());
      setStepIndex(steps.indexOf("dashboard"));
      return;
    }

    if (currentStep === "chair_stand" && !chairStandGate.canProceed) {
      setFloorRising(getSkippedFloorRisingMetrics());
      setStepIndex(steps.indexOf("dashboard"));
      return;
    }

    if (currentStep === "motion_gait" && !motionGate.canProceed) {
      setFloorRising(getSkippedFloorRisingMetrics());
      setStepIndex(steps.indexOf("dashboard"));
      return;
    }

    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  }

  function back() {
    setStepIndex((index) => Math.max(index - 1, 0));
  }

  function loadDemo() {
    const demo = createDemoSession();
    setDemoLoaded(true);
    setSafety(demo.safetyScreen);
    setContact(demo.emergencyContact);
    setDemographics(demo.demographics);
    setQuestionnaire({
      balanceConfidence: demo.questionnaire.balanceConfidence,
      balanceRecoveryConfidence: demo.questionnaire.balanceRecoveryConfidence,
      safeFallingConfidence: demo.questionnaire.safeFallingConfidence,
      postFallRecoveryConfidence:
        demo.questionnaire.postFallRecoveryConfidence,
    });
    setChairStand(demo.chairStand);
    setMotion(demo.motion ?? getDemoMotionMetrics());
    setFloorRising(demo.floorRising ?? getDemoFloorRisingMetrics());
  }

  return (
    <main className="min-h-dvh pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-4 sm:gap-7 sm:px-5 sm:py-6 md:px-8">
        <header className="flex flex-col gap-4 border-b border-[var(--line)] pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-base font-semibold text-[var(--primary-dark)]">
              {PRODUCT_NAME}
            </p>
            <h1 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              Ability-confidence screening for community-ready care.
            </h1>
          </div>
          <button
            className="primary-action"
            onClick={loadDemo}
            type="button"
          >
            <ClipboardList aria-hidden size={22} />
            Load Mr Tan demo
          </button>
        </header>

        <Progress currentStep={currentStep} />

        {currentStep === "landing" && (
          <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm">
              <p className="mb-4 text-xl text-[var(--muted)]">
                {PRODUCT_POSITIONING}
              </p>
              <p className="mb-6 text-2xl font-semibold leading-snug">
                Understand movement, confidence, and care needs before a fall
                happens.
              </p>
              <p className="mb-6 text-base text-[var(--muted)]">
                {DECISION_SUPPORT_DISCLAIMER}
              </p>
              <button className="primary-action" onClick={next} type="button">
                Start assessment <ArrowRight aria-hidden size={22} />
              </button>
            </div>
            <PathwayPreview />
          </section>
        )}

        {currentStep === "safety" && (
          <StepPanel
            description="Before we start, we need to check that it is safe for you to do a simple chair stand movement test today."
            icon={<ShieldCheck aria-hidden size={26} />}
            title="Check that movement testing is safe today"
          >
            <div className="grid gap-3">
              {safetyQuestions.map((question) => (
                <label
                  className="flex min-h-16 items-center gap-3 rounded-md border border-[var(--line)] bg-white p-4"
                  key={question.id}
                >
                  <input
                    checked={Boolean(safety[question.id])}
                    className="h-6 w-6"
                    onChange={(event) =>
                      setSafety((current) => ({
                        ...current,
                        [question.id]: event.target.checked,
                      }))
                    }
                    type="checkbox"
                  />
                  <span>{question.label}</span>
                </label>
              ))}
            </div>
            {blockedBySafety && (
              <SafetyNotice>
                Please do not continue with the movement test right now.
                Consider asking someone to support you or seek advice from a
                community or healthcare professional. You may continue in demo
                mode only.
              </SafetyNotice>
            )}
          </StepPanel>
        )}

        {currentStep === "emergency_contact" && (
          <StepPanel
            description="Please add someone who can be contacted if you feel unsafe during the movement test."
            icon={<HeartPulse aria-hidden size={26} />}
            title="Emergency contact"
          >
            <FormGrid>
              <TextField
                label="Name"
                onChange={(value) =>
                  setContact((current) => ({ ...current, name: value }))
                }
                value={contact.name}
              />
              <TextField
                label="Phone"
                onChange={(value) =>
                  setContact((current) => ({ ...current, phone: value }))
                }
                value={contact.phone}
              />
              <TextField
                label="Relationship"
                onChange={(value) =>
                  setContact((current) => ({
                    ...current,
                    relationship: value,
                  }))
                }
                value={contact.relationship}
              />
            </FormGrid>
          </StepPanel>
        )}

        {currentStep === "demographics" && (
          <StepPanel
            description="These details help the team read the screening summary in context."
            icon={<ClipboardList aria-hidden size={26} />}
            title="Basic information"
          >
            <FormGrid>
              <TextField
                label="Display name"
                onChange={(value) =>
                  setDemographics((current) => ({
                    ...current,
                    displayName: value,
                  }))
                }
                value={demographics.displayName}
              />
              <TextField
                label="Age"
                onChange={(value) =>
                  setDemographics((current) => ({
                    ...current,
                    age: Number(value),
                  }))
                }
                type="number"
                value={String(demographics.age)}
              />
              <TextField
                label="Living situation"
                onChange={(value) =>
                  setDemographics((current) => ({
                    ...current,
                    livingSituation: value,
                  }))
                }
                value={demographics.livingSituation}
              />
            </FormGrid>
          </StepPanel>
        )}

        {currentStep === "questionnaire" && (
          <StepPanel
            description="Choose a confidence score from 0 to 10 for each area."
            icon={<Activity aria-hidden size={26} />}
            title="Falls efficacy questionnaire"
          >
            <div className="grid gap-4">
              {fallsEfficacyQuestions.map((question) => (
                <label
                  className="rounded-md border border-[var(--line)] bg-white p-4"
                  key={question.id}
                >
                  <span className="block text-base font-semibold text-[var(--primary-dark)]">
                    {question.domain}
                  </span>
                  <span className="mb-4 block">{question.prompt}</span>
                  <span className="flex items-center gap-4">
                    <input
                      className="w-full"
                      max={question.max}
                      min={question.min}
                      onChange={(event) =>
                        setQuestionnaire((current) => ({
                          ...current,
                          [question.id]: Number(event.target.value),
                        }))
                      }
                      type="range"
                      value={questionnaire[question.id]}
                    />
                    <strong className="min-w-10 text-center text-2xl">
                      {questionnaire[question.id]}
                    </strong>
                  </span>
                </label>
              ))}
            </div>
          </StepPanel>
        )}

        {currentStep === "chair_stand" && (
          <StepPanel
            description="Use a stable chair, clear the surrounding area, and stop if you feel unwell. Camera and sensor modules can replace this demo input later."
            icon={<Activity aria-hidden size={26} />}
            title="Chair stand assessment"
          >
            {blockedBySafety && (
              <SafetyNotice>
                Safety screening found a concern. This screen is showing demo
                data only.
              </SafetyNotice>
            )}
            <FormGrid>
              <TextField
                label="Repetitions"
                onChange={(value) =>
                  setChairStand((current) => ({
                    ...current,
                    repetitions: Number(value),
                    source: "manual",
                  }))
                }
                type="number"
                value={String(chairStand.repetitions)}
              />
              <TextField
                label="Duration in seconds"
                onChange={(value) =>
                  setChairStand((current) => ({
                    ...current,
                    durationSeconds: Number(value),
                    source: "manual",
                  }))
                }
                type="number"
                value={String(chairStand.durationSeconds)}
              />
            </FormGrid>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="secondary-action"
                onClick={() => setChairStand(getDemoChairStandMetrics())}
                type="button"
              >
                Use demo chair stand
              </button>
              <button
                className="secondary-action"
                onClick={() =>
                  setChairStand((current) => ({
                    ...current,
                    completionStatus: "stopped",
                    movementQuality: "unsafe",
                  }))
                }
                type="button"
              >
                Mark stopped or unsafe
              </button>
            </div>
          </StepPanel>
        )}

        {currentStep === "motion_gait" && (
          <StepPanel
            description="Walk at a usual safe pace with the phone carried steadily. Daniel's accelerometer module can replace these demo gait metrics."
            icon={<PersonStanding aria-hidden size={26} />}
            title="Motion sensor gait walking test"
          >
            {!chairStandGate.canProceed && (
              <SafetyNotice>
                Chair stand screening suggests this participant should not
                continue to gait walking today. Higher-risk testing will be
                skipped.
              </SafetyNotice>
            )}
            <FormGrid>
              <TextField
                label="Gait speed in metres per second"
                onChange={(value) =>
                  setMotion((current) => ({
                    ...current,
                    gaitSpeedMetersPerSecond: Number(value),
                    completionStatus: "completed",
                    source: "manual",
                  }))
                }
                type="number"
                value={String(motion.gaitSpeedMetersPerSecond ?? 0)}
              />
              <TextField
                label="Stability score"
                onChange={(value) =>
                  setMotion((current) => ({
                    ...current,
                    stabilityScore: Number(value),
                    completionStatus: "completed",
                    source: "manual",
                  }))
                }
                type="number"
                value={String(motion.stabilityScore)}
              />
            </FormGrid>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="secondary-action"
                onClick={() => setMotion(getDemoMotionMetrics())}
                type="button"
              >
                Use demo gait walk
              </button>
              <button
                className="secondary-action"
                onClick={() =>
                  setMotion((current) => ({
                    ...current,
                    completionStatus: "stopped",
                    stabilityScore: 0.3,
                    rhythmConsistency: 0.35,
                    source: "manual",
                  }))
                }
                type="button"
              >
                Mark stopped or unstable
              </button>
            </div>
            {!motionGate.canProceed && (
              <SafetyNotice>
                Gait walking suggests caution. The floor-rising test is the
                highest-risk test and should not be attempted in this flow.
              </SafetyNotice>
            )}
          </StepPanel>
        )}

        {currentStep === "floor_rising" && (
          <StepPanel
            description="Only proceed if earlier screening steps were safe. This is the highest-risk functional test in the MVP."
            icon={<AlertTriangle aria-hidden size={26} />}
            title="Floor-rising test"
          >
            {!motionGate.canProceed && (
              <SafetyNotice>
                Motion gait screening did not pass the safety gate. Floor-rising
                should be skipped and the dashboard should explain why.
              </SafetyNotice>
            )}
            <FormGrid>
              <TextField
                label="Time to rise from floor in seconds"
                onChange={(value) =>
                  setFloorRising((current) => ({
                    ...current,
                    completionStatus: "completed",
                    durationSeconds: Number(value),
                    source: "manual",
                  }))
                }
                type="number"
                value={String(floorRising.durationSeconds ?? 0)}
              />
              <label className="flex min-h-16 items-center gap-3 rounded-md border border-[var(--line)] bg-white p-4">
                <input
                  checked={floorRising.requiredAssistance}
                  className="h-6 w-6"
                  onChange={(event) =>
                    setFloorRising((current) => ({
                      ...current,
                      requiredAssistance: event.target.checked,
                      completionStatus: event.target.checked
                        ? "stopped"
                        : current.completionStatus,
                      source: "manual",
                    }))
                  }
                  type="checkbox"
                />
                <span>Required assistance or could not complete safely</span>
              </label>
            </FormGrid>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="secondary-action"
                onClick={() => setFloorRising(getDemoFloorRisingMetrics())}
                type="button"
              >
                Use demo floor-rising
              </button>
              <button
                className="secondary-action"
                onClick={() => setFloorRising(getSkippedFloorRisingMetrics())}
                type="button"
              >
                Skip floor-rising
              </button>
            </div>
          </StepPanel>
        )}

        {currentStep === "dashboard" && (
          <section className="grid gap-5">
            {stoppedBeforeHigherRisk && (
              <SafetyNotice>
                The assessment stopped before one or more higher-risk tests.
                The dashboard uses completed and demo-safe screening data only.
              </SafetyNotice>
            )}
            <div className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
              <p className="text-base font-semibold text-[var(--primary-dark)]">
                Ability-confidence dashboard
              </p>
              <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
                {demographics.displayName || "Demo participant"},{" "}
                {demographics.age}
              </h2>
              <p className="mt-3 max-w-3xl text-[var(--muted)]">
                {analytics.interpretation}
              </p>
            </div>
            <SummaryGrid
              items={[
                ["Confidence average", scoredQuestionnaire.averageScore.toFixed(1)],
                [
                  "Chair stand",
                  `${chairStand.repetitions} reps in ${chairStand.durationSeconds}s`,
                ],
                [
                  "Motion gait",
                  `${motion.gaitSpeedMetersPerSecond ?? 0} m/s`,
                ],
                ["Floor-rising", floorRising.completionStatus],
              ]}
            />
            <SummaryGrid
              items={[
                ["Ability", analytics.abilityBand],
                ["Confidence", analytics.confidenceBand],
                ["Profile", profileCopy[analytics.profile].title],
                ["Functional-falls risk", analytics.riskCategory],
              ]}
            />
            <div className="grid gap-5 lg:grid-cols-2">
              <DashboardSection title="Care recommendations">
                {analytics.recommendations.map((recommendation) => (
                  <div
                    className="rounded-md border border-[var(--line)] p-4"
                    key={recommendation.id}
                  >
                    <p className="font-semibold">{recommendation.title}</p>
                    <p className="text-base text-[var(--muted)]">
                      {recommendation.body}
                    </p>
                  </div>
                ))}
              </DashboardSection>
              <DashboardSection title="Care linkage">
                {careLinkageOptions.map((option) => (
                  <div
                    className="flex gap-3 rounded-md border border-[var(--line)] p-4"
                    key={option.id}
                  >
                    <LinkIcon
                      aria-hidden
                      className="mt-1 shrink-0 text-[var(--primary)]"
                      size={22}
                    />
                    <div>
                      <p className="font-semibold">{option.title}</p>
                      <p className="text-base text-[var(--muted)]">
                        {option.description}
                      </p>
                    </div>
                  </div>
                ))}
              </DashboardSection>
            </div>
            <div className="rounded-lg border border-[var(--line)] bg-white p-5">
              <p className="mb-4 text-base text-[var(--muted)]">
                {DECISION_SUPPORT_DISCLAIMER}
              </p>
              <Link className="primary-action w-fit" href="/report/demo">
                <Download aria-hidden size={22} />
                Open report
              </Link>
            </div>
          </section>
        )}

        <footer className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-3 border-t border-[var(--line)] bg-[var(--background)] px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:px-0">
          <button
            className="secondary-action"
            disabled={stepIndex === 0}
            onClick={back}
            type="button"
          >
            <ArrowLeft aria-hidden size={22} />
            Back
          </button>
          <div className="order-first text-center text-base text-[var(--muted)] sm:order-none">
            {demoLoaded
              ? "Demo data loaded."
              : "Use demo data for a fast walkthrough."}
          </div>
          <button
            className="primary-action"
            disabled={stepIndex === steps.length - 1}
            onClick={next}
            type="button"
          >
            Next <ArrowRight aria-hidden size={22} />
          </button>
        </footer>
      </div>
    </main>
  );
}

function getChairStandGate(
  chairStand: ChairStandMetrics,
  blockedBySafety: boolean,
) {
  const unsafe =
    blockedBySafety ||
    chairStand.completionStatus === "stopped" ||
    chairStand.movementQuality === "unsafe" ||
    chairStand.repetitions < 5 ||
    chairStand.durationSeconds > 20;

  return {
    canProceed: !unsafe,
    reason: unsafe
      ? "Chair stand result does not support moving to the gait walking test."
      : "Chair stand gate passed.",
  };
}

function getMotionGate(motion: MotionMetrics) {
  const unsafe =
    motion.completionStatus === "stopped" ||
    motion.stabilityScore < 0.45 ||
    motion.rhythmConsistency < 0.5;

  return {
    canProceed: !unsafe,
    reason: unsafe
      ? "Motion gait result does not support moving to floor-rising."
      : "Motion gait gate passed.",
  };
}

function getFloorRisingGate(floorRising: FloorRisingMetrics) {
  const unsafe =
    floorRising.completionStatus === "stopped" ||
    floorRising.requiredAssistance;

  return {
    canProceed: !unsafe,
    reason: unsafe
      ? "Floor-rising was stopped or required assistance."
      : "Floor-rising gate passed or skipped safely.",
  };
}

function Progress({ currentStep }: { currentStep: AssessmentStep }) {
  return (
    <nav aria-label="Assessment progress" className="overflow-x-auto">
      <ol className="flex min-w-max gap-2">
        {steps.map((step, index) => (
          <li
            className={`rounded-md border px-3 py-2 text-base ${
              step === currentStep
                ? "border-[var(--primary)] bg-white font-semibold text-[var(--primary-dark)]"
                : "border-[var(--line)] text-[var(--muted)]"
            }`}
            key={step}
          >
            <span className="sr-only">Step {index + 1}: </span>
            {stepLabels[step]}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function StepPanel({
  children,
  description,
  icon,
  title,
}: {
  children: React.ReactNode;
  description: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm sm:p-5 md:p-7">
      <div className="mb-6 flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[#e8f5f2] text-[var(--primary)]">
          {icon}
        </div>
        <div>
          <h2 className="text-2xl font-semibold leading-tight sm:text-3xl">
            {title}
          </h2>
          <p className="mt-2 text-[var(--muted)]">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function PathwayPreview() {
  const pathway = [
    "Safety + consent",
    "Emergency contact",
    "Demographics",
    "Falls efficacy / confidence",
    "Chair stand test",
    "Motion sensor gait walking",
    "Floor-rising test",
    "Ability-confidence dashboard",
  ];

  return (
    <div className="rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
      <p className="text-base font-semibold text-[var(--primary-dark)]">
        Guided assessment pathway
      </p>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2">
        {pathway.map((item, index) => (
          <li
            className="flex items-start gap-3 rounded-md border border-[var(--line)] p-3"
            key={item}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#e8f5f2] text-base font-bold text-[var(--primary-dark)]">
              {index + 1}
            </span>
            <span className="text-base font-semibold leading-snug">{item}</span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-base text-[var(--muted)]">
        Higher-risk tests are skipped when an earlier screen suggests it is not
        safe to continue.
      </p>
    </div>
  );
}

function DashboardSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-white p-5">
      <h3 className="mb-3 text-2xl font-semibold">{title}</h3>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function SummaryGrid({ items }: { items: [string, string][] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(([label, value]) => (
        <div
          className="rounded-lg border border-[var(--line)] bg-white p-4"
          key={label}
        >
          <p className="text-base font-semibold text-[var(--muted)]">{label}</p>
          <p className="mt-2 min-w-0 text-xl font-semibold capitalize leading-tight sm:text-2xl">
            {value.replaceAll("_", " ")}
          </p>
        </div>
      ))}
    </div>
  );
}

function TextField({
  label,
  onChange,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="font-semibold">{label}</span>
      <input
        className="min-h-14 rounded-md border border-[var(--line)] bg-white px-4"
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}

function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function SafetyNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 flex gap-3 rounded-md border border-[#f1d6a8] bg-[#fff8ea] p-4 text-[var(--warning)]">
      <AlertTriangle aria-hidden className="mt-1 shrink-0" size={24} />
      <p>{children}</p>
    </div>
  );
}
