"use client";

import { useMemo, useState } from "react";
import { fallsEfficacyQuestions } from "@/content/clinical-copy";
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
import type {
  AssessmentStep,
  ChairStandMetrics,
  Demographics,
  EmergencyContact,
  FloorRisingMetrics,
  MotionMetrics,
  SafetyScreenResult,
} from "@/types/assessment";

export const steps: AssessmentStep[] = [
  "landing",
  "safety",
  "emergency_contact",
  "questionnaire",
  "chair_stand",
  "motion_gait",
  "floor_rising",
  "dashboard",
];

export type QuestionnaireDraft = {
  balanceConfidence: number;
  balanceRecoveryConfidence: number;
  safeFallingConfidence: number;
  postFallRecoveryConfidence: number;
};

export type PhysicalTestPhase = "demo" | "start" | "manual";

const lastQuestionIndex = fallsEfficacyQuestions.length - 1;

export function useAssessmentFlow() {
  const [stepIndex, setStepIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
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
      if (questionIndex < lastQuestionIndex) {
        setQuestionIndex(questionIndex + 1);
        return;
      }
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
    if (currentStep === "questionnaire" && questionIndex > 0) {
      setQuestionIndex(questionIndex - 1);
      return;
    }
    if (steps[stepIndex - 1] === "questionnaire") {
      setQuestionIndex(lastQuestionIndex);
    }
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
    setQuestionIndex(0);
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

  return {
    steps,
    stepIndex,
    currentStep,
    questionIndex,
    demoLoaded,
    chairStandPhase,
    setChairStandPhase,
    gaitPhase,
    setGaitPhase,
    floorRisingPhase,
    setFloorRisingPhase,
    gaitDistanceMeters,
    setGaitDistanceMeters,
    safety,
    setSafety,
    contact,
    setContact,
    demographics,
    setDemographics,
    questionnaire,
    setQuestionnaire,
    chairStand,
    setChairStand,
    motion,
    setMotion,
    floorRising,
    setFloorRising,
    scoredQuestionnaire,
    analytics,
    blockedBySafety,
    chairStandGate,
    motionGate,
    floorRisingGate,
    stoppedBeforeHigherRisk,
    currentPhysicalPhase,
    isPhysicalDemoScreen,
    next,
    back,
    loadDemo,
    skipToDashboardWithFloorSkipped,
    markChairStoppedOrUnsafe,
    markGaitStoppedOrUnstable,
    startGaitCountdown,
  };
}

export type AssessmentFlow = ReturnType<typeof useAssessmentFlow>;
