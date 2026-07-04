"use client";

import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  HeartPulse,
  Link as LinkIcon,
  PersonStanding,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CameraSetup } from "@/components/assessment/CameraSetup";
import { ChairStandDemo } from "@/components/assessment/demos/ChairStandDemo";
import { FloorRisingDemo } from "@/components/assessment/demos/FloorRisingDemo";
import { GaitWalkDemo } from "@/components/assessment/demos/GaitWalkDemo";
import { MotionSensorStatus } from "@/components/assessment/MotionSensorStatus";
import { TestStartPanel } from "@/components/assessment/TestStartPanel";
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
import {
  getChairStandGate,
  getFloorRisingGate,
  getMotionGate,
} from "@/lib/functional-tests/gates";
import { scoreFallsEfficacy } from "@/lib/questionnaire";
import { getDemoMotionMetrics } from "@/lib/sensors/motion-summary";
import { getDemoChairStandMetrics } from "@/lib/vision/chair-stand";
import { getCameraFloorRisingPlaceholder } from "@/lib/vision/floor-rising";
import type {
  AssessmentStep,
  AbilityConfidenceProfile,
  ChairStandMetrics,
  Demographics,
  EmergencyContact,
  FloorRisingMetrics,
  MotionMetrics,
  RiskCategory,
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

type PhysicalTestPhase = "demo" | "start" | "manual";

export function AssessmentApp() {
  const [stepIndex, setStepIndex] = useState(0);
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [chairStandPhase, setChairStandPhase] =
    useState<PhysicalTestPhase>("demo");
  const [gaitPhase, setGaitPhase] = useState<PhysicalTestPhase>("demo");
  const [floorRisingPhase, setFloorRisingPhase] =
    useState<PhysicalTestPhase>("demo");
  const [gaitDistanceMeters, setGaitDistanceMeters] = useState(4);
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
  const currentPhysicalPhase =
    currentStep === "chair_stand"
      ? chairStandPhase
      : currentStep === "motion_gait"
        ? gaitPhase
        : currentStep === "floor_rising"
          ? floorRisingPhase
          : undefined;
  const isPhysicalDemoScreen = currentPhysicalPhase === "demo";

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

    if (currentStep === "questionnaire") {
      setChairStandPhase("demo");
    }

    if (currentStep === "chair_stand") {
      setGaitPhase("demo");
    }

    if (currentStep === "motion_gait") {
      setFloorRisingPhase("demo");
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
    setChairStandPhase("demo");
    setGaitPhase("demo");
    setFloorRisingPhase("demo");
  }

  function skipToDashboardWithFloorSkipped() {
    setFloorRising(getSkippedFloorRisingMetrics());
    setStepIndex(steps.indexOf("dashboard"));
  }

  function markChairStoppedOrUnsafe() {
    setChairStand((current) => ({
      ...current,
      completionStatus: "stopped",
      movementQuality: "unsafe",
    }));
    skipToDashboardWithFloorSkipped();
  }

  function markGaitStoppedOrUnstable() {
    setMotion((current) => ({
      ...current,
      completionStatus: "stopped",
      stabilityScore: 0.3,
      rhythmConsistency: 0.35,
      source: "manual",
    }));
    skipToDashboardWithFloorSkipped();
  }

  function startGaitCountdown() {
    setMotion({
      stabilityScore: 0.62,
      rhythmConsistency: 0.58,
      gaitSpeedMetersPerSecond: Number((gaitDistanceMeters / 5).toFixed(2)),
      completionStatus: "demo",
      source: "demo",
    });
  }

  return (
    <main className="min-h-dvh pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-4 sm:gap-7 sm:px-5 sm:py-6 md:px-8">
        <header className="flex flex-col gap-4 border-b border-[var(--line)] pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow">{PRODUCT_NAME}</p>
            <h1 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              Ability-confidence screening for community-ready care.
            </h1>
            <p className="mt-3 max-w-2xl text-base text-[var(--muted)] sm:text-lg">
              A guided, safety-gated assessment for movement ability,
              confidence, and practical follow-up.
            </p>
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
            <div className="panel-card p-6 sm:p-7">
              <p className="mb-4 text-xl text-[var(--muted)]">
                {PRODUCT_POSITIONING}
              </p>
              <p className="mb-6 text-2xl font-semibold leading-snug sm:text-3xl">
                Understand movement, confidence, and care needs before a fall
                happens.
              </p>
              <div className="mb-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["Safe", "screen first"],
                  ["Guided", "one step at a time"],
                  ["Actionable", "care linkage"],
                ].map(([label, value]) => (
                  <div className="quiet-card p-4" key={label}>
                    <p className="text-base font-bold text-[var(--primary-dark)]">
                      {label}
                    </p>
                    <p className="text-base text-[var(--muted)]">{value}</p>
                  </div>
                ))}
              </div>
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

        {currentStep === "chair_stand" && chairStandPhase === "demo" && (
          <ChairStandDemo
            onContinue={() => setChairStandPhase("start")}
            onUseDemo={() => {
              setChairStand(getDemoChairStandMetrics());
              setChairStandPhase("start");
            }}
          />
        )}

        {currentStep === "chair_stand" && chairStandPhase === "start" && (
          <TestStartPanel
            fallbackActions={[
              {
                label: "Enter manually",
                onClick: () => setChairStandPhase("manual"),
              },
              {
                label: "Use demo",
                onClick: () => setChairStand(getDemoChairStandMetrics()),
              },
              {
                label: "Mark stopped or unsafe",
                onClick: markChairStoppedOrUnsafe,
              },
            ]}
            onPrimary={() => setChairStand(getDemoChairStandMetrics())}
            primaryLabel="Start 30s test"
            resultItems={[
              ["Reps", `${chairStand.repetitions}`],
              ["Seconds", `${chairStand.durationSeconds}`],
              [
                "Movement quality",
                chairStand.movementQuality?.replaceAll("_", " ") ??
                  "not assessed",
              ],
            ].map(([label, value]) => ({ label, value }))}
            safetyInstruction="Use a stable chair, keep both feet flat, and stop if you feel dizzy, breathless, or unsafe."
            statusItems={[
              { label: "Sensor", value: "Sensor ready" },
              { label: "Camera", value: "Camera optional" },
            ]}
            title="Chair stand start"
          >
            {blockedBySafety && (
              <SafetyNotice>
                Safety screening found a concern. Continue with demo data only
                or go to the dashboard.
              </SafetyNotice>
            )}
          </TestStartPanel>
        )}

        {currentStep === "chair_stand" && chairStandPhase === "manual" && (
          <StepPanel
            description="Use this fallback if the guided test cannot be completed with the available sensors."
            icon={<Activity aria-hidden size={26} />}
            title="Enter chair stand result"
          >
            <CameraSetup />
            <FormGrid>
              <TextField
                label="Repetitions"
                onChange={(value) =>
                  setChairStand((current) => ({
                    ...current,
                    completionStatus: "completed",
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
                    completionStatus: "completed",
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
                onClick={() => setChairStandPhase("start")}
                type="button"
              >
                Back to guided start
              </button>
              <button
                className="secondary-action"
                onClick={() => setChairStand(getDemoChairStandMetrics())}
                type="button"
              >
                Use demo chair stand
              </button>
              <button
                className="secondary-action"
                onClick={markChairStoppedOrUnsafe}
                type="button"
              >
                Mark stopped or unsafe
              </button>
            </div>
          </StepPanel>
        )}

        {currentStep === "motion_gait" && gaitPhase === "demo" && (
          <GaitWalkDemo
            onContinue={() => setGaitPhase("start")}
            onUseDemo={() => {
              setMotion(getDemoMotionMetrics());
              setGaitPhase("start");
            }}
          />
        )}

        {currentStep === "motion_gait" && gaitPhase === "start" && (
          <TestStartPanel
            fallbackActions={[
              {
                label: "Enter manually",
                onClick: () => setGaitPhase("manual"),
              },
              {
                label: "Use demo",
                onClick: () => setMotion(getDemoMotionMetrics()),
              },
              {
                label: "Mark stopped or unstable",
                onClick: markGaitStoppedOrUnstable,
              },
            ]}
            onPrimary={startGaitCountdown}
            primaryLabel="Start countdown"
            resultItems={[
              {
                label: "Gait speed",
                value: `${motion.gaitSpeedMetersPerSecond ?? 0} m/s`,
              },
              {
                label: "Rhythm",
                value: `${Math.round(motion.rhythmConsistency * 100)}%`,
              },
              {
                label: "Stability",
                value: `${Math.round(motion.stabilityScore * 100)}%`,
              },
            ]}
            safetyInstruction="Walk at your usual safe pace with the phone held steadily or placed in your pocket."
            statusItems={[
              { label: "Motion", value: "Motion sensor ready" },
              { label: "Distance", value: `${gaitDistanceMeters}m selected` },
            ]}
            title="Gait walk start"
          >
            {!chairStandGate.canProceed && (
              <SafetyNotice>
                Chair stand screening suggests this participant should not
                continue to gait walking today. Higher-risk testing will be
                skipped.
              </SafetyNotice>
            )}
            <MotionSensorStatus />
            <DistanceSelector
              onChange={setGaitDistanceMeters}
              value={gaitDistanceMeters}
            />
          </TestStartPanel>
        )}

        {currentStep === "motion_gait" && gaitPhase === "manual" && (
          <StepPanel
            description="Use this fallback if motion sensing is denied or unavailable."
            icon={<PersonStanding aria-hidden size={26} />}
            title="Enter gait walk result"
          >
            <MotionSensorStatus />
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
                onClick={() => setGaitPhase("start")}
                type="button"
              >
                Back to guided start
              </button>
              <button
                className="secondary-action"
                onClick={() => setMotion(getDemoMotionMetrics())}
                type="button"
              >
                Use demo gait walk
              </button>
              <button
                className="secondary-action"
                onClick={markGaitStoppedOrUnstable}
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

        {currentStep === "floor_rising" && floorRisingPhase === "demo" && (
          <FloorRisingDemo
            onContinue={() => setFloorRisingPhase("start")}
            onSkip={skipToDashboardWithFloorSkipped}
            onUseDemo={() => {
              setFloorRising(getDemoFloorRisingMetrics());
              setFloorRisingPhase("start");
            }}
          />
        )}

        {currentStep === "floor_rising" && floorRisingPhase === "start" && (
          <TestStartPanel
            fallbackActions={[
              {
                label: "Skip this test",
                onClick: skipToDashboardWithFloorSkipped,
                tone: "primary",
              },
              {
                label: "Enter manually",
                onClick: () => setFloorRisingPhase("manual"),
              },
              {
                label: "Use demo",
                onClick: () => setFloorRising(getDemoFloorRisingMetrics()),
              },
            ]}
            onPrimary={() => setFloorRising(getCameraFloorRisingPlaceholder())}
            primaryLabel="Start when ready"
            resultItems={[
              ["Completed", floorRising.completionStatus],
              [
                "Seconds",
                floorRising.durationSeconds !== undefined
                  ? `${floorRising.durationSeconds}`
                  : "not recorded",
              ],
              [
                "Assistance",
                floorRising.requiredAssistance ? "required" : "not required",
              ],
            ].map(([label, value]) => ({ label, value }))}
            safetyInstruction="Only continue if someone is nearby, your full body is visible, and the floor area is clear."
            statusItems={[
              { label: "Camera", value: "Preview scaffold visible" },
              { label: "Safety option", value: "Skip available" },
            ]}
            title="Floor-rising start"
          >
            {!motionGate.canProceed && (
              <SafetyNotice>
                Motion gait screening did not pass the safety gate. Floor-rising
                should be skipped and the dashboard should explain why.
              </SafetyNotice>
            )}
            <CameraSetup />
          </TestStartPanel>
        )}

        {currentStep === "floor_rising" && floorRisingPhase === "manual" && (
          <StepPanel
            description="Use this fallback if camera setup is denied or unavailable. Skipping remains available."
            icon={<AlertTriangle aria-hidden size={26} />}
            title="Enter floor-rising result"
          >
            <CameraSetup />
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
                        : "completed",
                      movementQuality: event.target.checked
                        ? "unsafe"
                        : "not_assessed",
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
                onClick={() => setFloorRisingPhase("start")}
                type="button"
              >
                Back to guided start
              </button>
              <button
                className="secondary-action"
                onClick={() => setFloorRising(getDemoFloorRisingMetrics())}
                type="button"
              >
                Use demo floor-rising
              </button>
              <button
                className="secondary-action"
                onClick={skipToDashboardWithFloorSkipped}
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
            <div className="panel-card grid gap-5 p-6 sm:p-7 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <p className="eyebrow">Ability-confidence dashboard</p>
                <h2 className="mt-2 text-3xl font-semibold leading-tight md:text-4xl">
                  {demographics.displayName || "Demo participant"},{" "}
                  {demographics.age}
                </h2>
                <p className="mt-3 max-w-3xl text-[var(--muted)]">
                  {analytics.interpretation}
                </p>
              </div>
              <div className="quiet-card bg-[var(--surface-muted)] p-5">
                <p className="text-base font-semibold text-[var(--muted-strong)]">
                  Functional-falls risk
                </p>
                <p className="mt-2 text-4xl font-semibold capitalize leading-none">
                  {analytics.riskCategory}
                </p>
                <p className="mt-3 text-base text-[var(--muted)]">
                  {getRiskSupportCopy(analytics.riskCategory)}
                </p>
              </div>
            </div>
            <SummaryGrid
              items={[
                ["Ability", analytics.abilityBand],
                ["Confidence", analytics.confidenceBand],
                ["Confidence average", scoredQuestionnaire.averageScore.toFixed(1)],
                [
                  "Chair stand",
                  `${chairStand.repetitions} reps / ${chairStand.durationSeconds}s`,
                ],
              ]}
            />
            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <DashboardSection title="Ability-confidence profile">
                <ProfileMatrix activeProfile={analytics.profile} />
              </DashboardSection>
              <DashboardSection title={profileCopy[analytics.profile].title}>
                <p className="text-[var(--muted)]">{analytics.interpretation}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <MetricRow
                    label="Motion gait"
                    value={`${motion.gaitSpeedMetersPerSecond ?? 0} m/s`}
                  />
                  <MetricRow
                    label="Floor-rising"
                    value={floorRising.completionStatus}
                  />
                </div>
              </DashboardSection>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <DashboardSection title="Care recommendations">
                {analytics.recommendations.map((recommendation) => (
                  <div
                    className="quiet-card p-4"
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
                    className="quiet-card flex gap-3 p-4"
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
            <div className="quiet-card p-5">
              <p className="mb-4 text-base text-[var(--muted)]">
                {DECISION_SUPPORT_DISCLAIMER}
              </p>
              <Link className="primary-action w-fit" href="/report/demo">
                <FileText aria-hidden size={22} />
                Open report
                <Download aria-hidden size={20} />
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
            disabled={stepIndex === steps.length - 1 || isPhysicalDemoScreen}
            onClick={next}
            type="button"
          >
            {isPhysicalDemoScreen ? "Continue above" : "Next"}{" "}
            <ArrowRight aria-hidden size={22} />
          </button>
        </footer>
      </div>
    </main>
  );
}

function Progress({ currentStep }: { currentStep: AssessmentStep }) {
  const currentIndex = steps.indexOf(currentStep);

  return (
    <nav aria-label="Assessment progress" className="overflow-x-auto">
      <ol className="flex min-w-max gap-2">
        {steps.map((step, index) => (
          <li
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-base ${
              step === currentStep
                ? "border-[var(--primary)] bg-white font-semibold text-[var(--primary-dark)]"
                : index < currentIndex
                  ? "border-[var(--line)] bg-[var(--primary-soft)] text-[var(--primary-dark)]"
                  : "border-[var(--line)] bg-white/70 text-[var(--muted)]"
            }`}
            key={step}
          >
            <span className="sr-only">Step {index + 1}: </span>
            {index < currentIndex ? (
              <CheckCircle2 aria-hidden size={18} />
            ) : (
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-full bg-current opacity-55"
              />
            )}
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
    <section className="panel-card p-4 sm:p-5 md:p-7">
      <div className="mb-6 flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[var(--primary-soft)] text-[var(--primary)]">
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
    <div className="panel-card p-5">
      <p className="eyebrow">Guided assessment pathway</p>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2">
        {pathway.map((item, index) => (
          <li
            className="quiet-card flex items-start gap-3 p-3"
            key={item}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--primary-soft)] text-base font-bold text-[var(--primary-dark)]">
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
    <div className="quiet-card p-5">
      <h3 className="mb-3 text-2xl font-semibold">{title}</h3>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="quiet-card p-4">
      <p className="text-base font-semibold text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-xl font-semibold capitalize leading-tight">
        {value.replaceAll("_", " ")}
      </p>
    </div>
  );
}

function ProfileMatrix({
  activeProfile,
}: {
  activeProfile: AbilityConfidenceProfile;
}) {
  const cells: {
    ability: string;
    confidence: string;
    profile: AbilityConfidenceProfile;
  }[] = [
    {
      ability: "Good ability",
      confidence: "Good confidence",
      profile: "stable_profile",
    },
    {
      ability: "Good ability",
      confidence: "Low confidence",
      profile: "under_confidence",
    },
    {
      ability: "Reduced ability",
      confidence: "Good confidence",
      profile: "possible_risk_taking",
    },
    {
      ability: "Reduced ability",
      confidence: "Low confidence",
      profile: "high_vulnerability",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cells.map((cell) => {
        const isActive = cell.profile === activeProfile;

        return (
          <div
            className={`rounded-md border p-4 ${
              isActive
                ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                : "border-[var(--line)] bg-white"
            }`}
            key={cell.profile}
          >
            <p className="flex items-center gap-2 text-base font-semibold">
              {isActive && <CheckCircle2 aria-hidden size={18} />}
              {profileCopy[cell.profile].title}
            </p>
            <p className="mt-2 text-base text-[var(--muted)]">
              {cell.ability}, {cell.confidence}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function getRiskSupportCopy(riskCategory: RiskCategory) {
  if (riskCategory === "high") {
    return "Pause higher-risk testing and consider supported review.";
  }

  if (riskCategory === "moderate") {
    return "Community or supervised support may help preserve safe mobility.";
  }

  return "Maintain activity and monitor changes over time.";
}

function SummaryGrid({ items }: { items: [string, string][] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(([label, value]) => (
        <div
          className="quiet-card p-4"
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
        className="input-field"
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

function DistanceSelector({
  onChange,
  value,
}: {
  onChange: (value: number) => void;
  value: number;
}) {
  const distances = [4, 5, 10];

  return (
    <div>
      <p className="mb-3 font-semibold">Walking distance</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {distances.map((distance) => (
          <button
            aria-pressed={value === distance}
            className={`secondary-action ${
              value === distance
                ? "border-[var(--primary)] bg-[#e8f5f2] text-[var(--primary-dark)]"
                : ""
            }`}
            key={distance}
            onClick={() => onChange(distance)}
            type="button"
          >
            {distance}m
          </button>
        ))}
      </div>
    </div>
  );
}

function SafetyNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 flex gap-3 rounded-md border border-[#f1d6a8] bg-[var(--warning-soft)] p-4 text-[var(--warning)]">
      <AlertTriangle aria-hidden className="mt-1 shrink-0" size={24} />
      <p>{children}</p>
    </div>
  );
}
