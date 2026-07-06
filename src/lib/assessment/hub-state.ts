import { getChairStandGate, getMotionGate } from "@/lib/functional-tests/gates";
import {
  isQuestionnaireComplete,
  isRecordedMetric,
  QUESTIONNAIRE_LENGTH,
  type SessionDraft,
} from "@/lib/assessment/session-draft";
import type {
  SafetyScreenResult,
  TestId,
  TestItemState,
} from "@/types/assessment";

/** Everything that renders as a card on the assessment hub. */
export type HubCardId = TestId | "exercise";

export type LockedReason =
  | "consent_required"
  | "safety_check_required"
  | "safety_flagged"
  | "prerequisite"
  | "coming_soon";

export type HubCard = {
  id: HubCardId;
  /** "available" is exercise-only — it is never a test with progress. */
  state: TestItemState | "available";
  lockedReason?: LockedReason;
  /** Supporting line (gate reason, stop detail, recorded value). */
  detail?: string;
  /** True when the record counts as clinical evidence (completed, non-demo). */
  hasEvidence: boolean;
};

/**
 * Same predicate the linear flow used (useAssessmentFlow): any of the four
 * risk answers flags the participant. A null result means the safety check
 * has not been answered yet — that is "check required", not "flagged".
 */
export function isBlockedBySafety(safety: SafetyScreenResult | null): boolean {
  if (!safety) return false;
  return (
    safety.dizziness ||
    safety.breathlessness ||
    safety.pain ||
    safety.recentFallOrInjury
  );
}

/** Consent given and the safety questions answered (whatever the answers). */
export function isPrecheckComplete(draft: SessionDraft): boolean {
  return draft.consent.assessmentConsent && draft.safety !== null;
}

/** At least one test has a real record — the minimum to finish & save. */
export function canFinish(draft: SessionDraft): boolean {
  return (
    isQuestionnaireComplete(draft) ||
    isRecordedMetric(draft.chairStand, draft.demoLoaded) ||
    isRecordedMetric(draft.motion, draft.demoLoaded) ||
    isRecordedMetric(draft.floorRising, draft.demoLoaded)
  );
}

type PhysicalMetric = {
  completionStatus?: "completed" | "stopped" | "skipped" | "demo";
  source?: string;
};

/** Card state for a physical test that has passed all its locks. */
function physicalCardState(
  id: TestId,
  metric: PhysicalMetric | undefined,
  draft: SessionDraft,
): HubCard {
  if (!metric) {
    return {
      id,
      state: draft.openedTests.includes(id) ? "in_progress" : "not_started",
      hasEvidence: false,
    };
  }
  const isDemoMetric =
    metric.completionStatus === "demo" || metric.source === "demo";
  if (isDemoMetric && !draft.demoLoaded) {
    // A demo-sourced placeholder (guided-run injection) is not a record —
    // the participant still needs to enter or confirm a real result.
    return { id, state: "in_progress", hasEvidence: false };
  }
  if (metric.completionStatus === "stopped") {
    return {
      id,
      state: "skipped",
      detail: "Stopped for safety",
      hasEvidence: false,
    };
  }
  if (metric.completionStatus === "skipped") {
    return {
      id,
      state: "skipped",
      detail: "Skipped for safety",
      hasEvidence: false,
    };
  }
  // completed, or an explicit demo record after "Load sample answers".
  return { id, state: "completed", hasEvidence: !isDemoMetric };
}

function locked(id: HubCardId, reason: LockedReason, detail?: string): HubCard {
  return { id, state: "locked", lockedReason: reason, detail, hasEvidence: false };
}

/**
 * Derive every hub card from the draft — pure, no side effects. Rules:
 *
 * - self_confidence: consent-locked only; NEVER safety-locked (talking about
 *   confidence is always safe).
 * - physical tests: consent → safety check → safety flag, then the
 *   escalating-risk chain as `prerequisite` locks (walk needs a chair-stand
 *   record whose gate passes; floor rising needs the same from the walk).
 * - timed_up_and_go / functional_reach: always locked "coming soon".
 * - exercise: always available; never assessment evidence.
 */
export function deriveHubCards(
  draft: SessionDraft,
  opts?: { exerciseDoneToday?: boolean },
): HubCard[] {
  const consented = draft.consent.assessmentConsent;
  const safetyAnswered = draft.safety !== null;
  const safetyFlagged = isBlockedBySafety(draft.safety);

  function physicalLock(id: TestId): HubCard | null {
    if (!consented) return locked(id, "consent_required");
    if (!safetyAnswered) return locked(id, "safety_check_required");
    if (safetyFlagged) return locked(id, "safety_flagged");
    return null;
  }

  const cards: HubCard[] = [];

  // Self confidence — falls-efficacy questionnaire.
  if (!consented) {
    cards.push(locked("self_confidence", "consent_required"));
  } else if (draft.questionnaire === null) {
    cards.push({ id: "self_confidence", state: "not_started", hasEvidence: false });
  } else if (draft.questionnaireIndex >= QUESTIONNAIRE_LENGTH) {
    cards.push({
      id: "self_confidence",
      state: "completed",
      hasEvidence: !draft.demoLoaded,
    });
  } else {
    cards.push({
      id: "self_confidence",
      state: "in_progress",
      detail: `Question ${Math.min(draft.questionnaireIndex + 1, QUESTIONNAIRE_LENGTH)} of ${QUESTIONNAIRE_LENGTH}`,
      hasEvidence: false,
    });
  }

  // Sit to stand.
  cards.push(
    physicalLock("sit_to_stand") ??
      physicalCardState("sit_to_stand", draft.chairStand, draft),
  );

  // Walk — needs a chair-stand record whose gate passes.
  const walkLock = physicalLock("walk");
  if (walkLock) {
    cards.push(walkLock);
  } else if (!draft.chairStand) {
    cards.push(locked("walk", "prerequisite", "Do the Sit to stand test first"));
  } else {
    const chairGate = getChairStandGate(draft.chairStand, safetyFlagged);
    cards.push(
      chairGate.canProceed
        ? physicalCardState("walk", draft.motion, draft)
        : locked("walk", "prerequisite", chairGate.reason),
    );
  }

  // Floor rising — needs a walk record whose gate passes.
  const floorLock = physicalLock("floor_rising");
  if (floorLock) {
    cards.push(floorLock);
  } else if (!draft.motion) {
    cards.push(locked("floor_rising", "prerequisite", "Do the Walk test first"));
  } else {
    const motionGate = getMotionGate(draft.motion);
    cards.push(
      motionGate.canProceed
        ? physicalCardState("floor_rising", draft.floorRising, draft)
        : locked("floor_rising", "prerequisite", motionGate.reason),
    );
  }

  // Future tests — visible, honestly locked, no data path yet.
  cards.push(locked("timed_up_and_go", "coming_soon"));
  cards.push(locked("functional_reach", "coming_soon"));

  // Exercise — always open, never a test result.
  cards.push({
    id: "exercise",
    state: opts?.exerciseDoneToday ? "completed" : "available",
    hasEvidence: false,
  });

  return cards;
}
