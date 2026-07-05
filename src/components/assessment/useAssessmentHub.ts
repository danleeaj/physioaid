"use client";

import { useState } from "react";
import {
  useAssessmentFlow,
  type AssessmentFlow,
} from "@/components/assessment/useAssessmentFlow";
import { getSkippedFloorRisingMetrics } from "@/lib/functional-tests/floor-rising";
import { loadPracticeLog, markPracticedToday, practisedToday } from "@/lib/streak";
import type { UserProfile } from "@/lib/user-profile";
import type { AssessmentStep, Demographics } from "@/types/assessment";

/**
 * Assessment Hub session — checklist items over the untouched linear flow
 * state machine. One flow instance holds all answers; each item runs a
 * "segment" (ordered subset of the flow's steps). Completion is EXPLICIT:
 * a checkmark means the user finished that segment and valid test data was
 * saved — never inferred from prefilled defaults.
 */

export type HubItemId =
  | "confidence"
  | "walk"
  | "sitToStand"
  | "tug"
  | "exercise"
  | "functionalReach";

export type HubItemStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "skipped"
  | "locked";

/** Items that run flow segments (the rest are activity/locked cards). */
export type SegmentItemId = "confidence" | "sitToStand" | "walk";

const SEGMENTS: Record<SegmentItemId, AssessmentStep[]> = {
  confidence: ["questionnaire"],
  sitToStand: ["chair_stand"],
  walk: ["motion_gait"],
};

/** Consent + safety questions — run before the first movement test each
 * session (CONSTITUTION: safety screening before movement testing). */
function safetyPreambleSteps(profileHasContact: boolean): AssessmentStep[] {
  return profileHasContact
    ? ["consent", "safety"]
    : ["consent", "safety", "emergency_contact"];
}

export function useAssessmentHub({
  demoMode,
  profile,
}: {
  demoMode: boolean;
  profile: UserProfile | null;
}) {
  const profileHasContact = Boolean(
    profile?.emergencyContact.name && profile?.emergencyContact.phone,
  );

  const initialDemographics: Demographics | undefined =
    !demoMode && profile
      ? {
          displayName: profile.name,
          age: profile.age ?? 75,
          livingSituation: profile.livingSituation || "—",
          // Not collected at onboarding; previously hardcoded "near_fall"
          // (a Mr Tan leak). Flagged to the clinical owner.
          fallHistory: "none",
          planningArea: profile.neighbourhood,
        }
      : undefined;

  const flow = useAssessmentFlow({
    initialStep: "consent",
    initialDemographics,
    initialContact:
      !demoMode && profileHasContact ? profile?.emergencyContact : undefined,
  });

  const [done, setDone] = useState<Record<SegmentItemId, boolean>>({
    confidence: false,
    sitToStand: false,
    walk: false,
  });
  const [started, setStarted] = useState<Record<SegmentItemId, boolean>>({
    confidence: false,
    sitToStand: false,
    walk: false,
  });
  const [stopped, setStopped] = useState<Record<SegmentItemId, boolean>>({
    confidence: false,
    sitToStand: false,
    walk: false,
  });
  const [safetyDone, setSafetyDone] = useState(false);
  const [activeItem, setActiveItem] = useState<SegmentItemId | null>(null);
  const [inPreamble, setInPreamble] = useState(false);
  const [exerciseDone, setExerciseDone] = useState(() =>
    typeof window === "undefined" ? false : practisedToday(loadPracticeLog()),
  );
  const [showResult, setShowResult] = useState(false);

  const isMovement = (id: SegmentItemId) => id !== "confidence";

  // Mid-test stop actions inside ChairStand/Gait screens jump the flow to its
  // "dashboard" step (skipToDashboardWithFloorSkipped). Treat that as the
  // segment ending with a stop — render-time state adjustment converges on
  // the next pass because activeItem is cleared.
  if (
    activeItem &&
    !inPreamble &&
    !showResult &&
    flow.currentStep === "dashboard"
  ) {
    setStopped((current) => ({ ...current, [activeItem]: true }));
    setDone((current) => ({ ...current, [activeItem]: true }));
    setActiveItem(null);
  }

  const segmentSteps: AssessmentStep[] = activeItem
    ? inPreamble
      ? safetyPreambleSteps(profileHasContact)
      : SEGMENTS[activeItem]
    : [];

  function startItem(id: SegmentItemId) {
    setStarted((current) => ({ ...current, [id]: true }));
    setActiveItem(id);
    if (isMovement(id) && !safetyDone) {
      setInPreamble(true);
      flow.goToStep("consent");
    } else {
      setInPreamble(false);
      flow.goToStep(SEGMENTS[id][0]);
    }
  }

  /** The active segment finished normally (last step's Continue). */
  function completeActiveSegment() {
    if (!activeItem) return;
    if (inPreamble) {
      setSafetyDone(true);
      setInPreamble(false);
      if (flow.blockedBySafety) {
        // Flagged safety answer: movement stays locked — back to the hub
        // with a supportive message instead of the test.
        setActiveItem(null);
        return;
      }
      flow.goToStep(SEGMENTS[activeItem][0]);
      return;
    }
    setDone((current) => ({ ...current, [activeItem]: true }));
    setActiveItem(null);
  }

  function exitItem() {
    setInPreamble(false);
    setActiveItem(null);
  }

  function markExerciseDone() {
    markPracticedToday();
    setExerciseDone(true);
  }

  function loadDemoAll() {
    flow.loadDemo();
    setSafetyDone(true);
    setDone({ confidence: true, sitToStand: true, walk: true });
    setStarted({ confidence: true, sitToStand: true, walk: true });
  }

  // ---- status derivation ----
  // A checkmark means the segment was explicitly finished and its data saved
  // into the flow — never inferred from prefilled defaults. The test screens
  // gate their own phases (Continue is disabled until the participant acts on
  // the demo/instruction panel), and choosing the demo/manual fallback is a
  // legitimate, honestly-labelled data source per the clinical constitution.
  const chairDataValid = done.sitToStand;
  const walkDataValid = done.walk;

  function segmentStatus(id: SegmentItemId): HubItemStatus {
    if (isMovement(id)) {
      if (safetyDone && flow.blockedBySafety) return "locked";
      if (id === "walk") {
        // Gate order: Walk unlocks after Sit to Stand passes its gate.
        if (!done.sitToStand) return "locked";
        if (!flow.chairStandGate.canProceed) return "locked";
      }
    }
    if (stopped[id]) return "skipped";
    if (id === "confidence" && done.confidence) return "completed";
    if (id === "sitToStand" && chairDataValid) return "completed";
    if (id === "walk" && walkDataValid) return "completed";
    if (started[id]) return "in_progress";
    return "not_started";
  }

  const statuses: Record<HubItemId, HubItemStatus> = {
    confidence: segmentStatus("confidence"),
    sitToStand: segmentStatus("sitToStand"),
    walk: segmentStatus("walk"),
    exercise: exerciseDone ? "completed" : "not_started",
    tug: "locked",
    functionalReach: "locked",
  };

  const blockedBySafety = safetyDone && flow.blockedBySafety;
  const canFinish =
    done.confidence && (blockedBySafety || (done.sitToStand && done.walk));
  const hasProgress =
    started.confidence || started.sitToStand || started.walk || safetyDone;

  function finish() {
    // Floor rise has no hub card in this pass — record it as skipped, exactly
    // what the linear flow's gate branches stamped (flagged to clinical owner).
    if (
      flow.floorRising.completionStatus === "demo" &&
      flow.floorRising.source === "demo" &&
      !flow.demoLoaded
    ) {
      flow.setFloorRising(getSkippedFloorRisingMetrics());
    }
    flow.goToStep("dashboard");
    setShowResult(true);
  }

  function backFromResult() {
    setShowResult(false);
  }

  return {
    flow: flow as AssessmentFlow,
    activeItem,
    inPreamble,
    segmentSteps,
    statuses,
    blockedBySafety,
    safetyDone,
    startItem,
    completeActiveSegment,
    exitItem,
    markExerciseDone,
    exerciseDone,
    loadDemoAll,
    canFinish,
    hasProgress,
    finish,
    showResult,
    backFromResult,
  };
}

export type AssessmentHub = ReturnType<typeof useAssessmentHub>;
