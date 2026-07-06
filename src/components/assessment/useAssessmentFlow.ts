"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { analyseSessionIfPossible } from "@/lib/analytics/partial";
import {
  canFinish as deriveCanFinish,
  deriveHubCards,
  isBlockedBySafety,
  isPrecheckComplete,
  type HubCardId,
} from "@/lib/assessment/hub-state";
import {
  buildSessionFromDraft,
  clearDraft,
  createDefaultQuestionnaireDraft,
  createDefaultSafetyResult,
  createEmptyDraft,
  isQuestionnaireComplete,
  loadDraft,
  persistDraft,
  QUESTIONNAIRE_LENGTH,
  type QuestionnaireDraft,
  type SessionDraft,
} from "@/lib/assessment/session-draft";
import { createDemoSession } from "@/lib/demo-session";
import { getSkippedFloorRisingMetrics } from "@/lib/functional-tests/floor-rising";
import {
  getChairStandGate,
  getFloorRisingGate,
  getMotionGate,
} from "@/lib/functional-tests/gates";
import { scoreFallsEfficacy } from "@/lib/questionnaire";
import { summarizeMotionSamples } from "@/lib/sensors/motion-summary";
import type {
  ChairStandMetrics,
  ConsentRecord,
  FloorRisingMetrics,
  MotionMetrics,
  SafetyScreenResult,
  TestId,
} from "@/types/assessment";
import type { MotionSample } from "@/types/motion";

// Re-exported for compat — QuestionnaireScreen imports the type from here.
export type { QuestionnaireDraft };

export type PhysicalTestPhase = "demo" | "start" | "manual";

/** The hub's navigation states — replaces the old linear step index. */
export type AssessmentView =
  | "hub"
  | "precheck"
  | `test:${TestId}`
  | "exercise"
  | "result";

const lastQuestionIndex = QUESTIONNAIRE_LENGTH - 1;

/** Fixed check order the hub renders in — auto-advance walks this list. */
const TEST_ORDER: TestId[] = [
  "self_confidence",
  "sit_to_stand",
  "walk",
  "floor_rising",
  "timed_up_and_go",
  "functional_reach",
];

/** UI baselines for screens that render metrics before any exist. Every
 * setter path overwrites `completionStatus`/`source` before anything is
 * persisted, so these values never masquerade as results. */
function emptyChairStandMetrics(): ChairStandMetrics {
  return {
    completionStatus: "skipped",
    durationSeconds: 0,
    repetitions: 0,
    source: "manual",
  };
}

function emptyMotionMetrics(): MotionMetrics {
  return { stabilityScore: 0, rhythmConsistency: 0, source: "manual" };
}

function emptyFloorRisingMetrics(): FloorRisingMetrics {
  return { completionStatus: "skipped", requiredAssistance: false, source: "manual" };
}

function hydrateDraft(identity: string): SessionDraft {
  return loadDraft(identity) ?? createEmptyDraft();
}

/**
 * Assessment hub state machine. The draft (answers + test records) persists
 * to localStorage per identity with a 12h TTL; navigation and per-test
 * phases are in-memory only. A fresh draft is genuinely empty — no Mr Tan,
 * no demo metrics — until the explicit demo-mode sample load.
 */
export function useAssessmentFlow(options: {
  /** Draft namespace — `uid` for signed-in users, "demo" for demo mode. */
  identity: string;
  demoMode: boolean;
  /** From the movement log — drives the exercise card's "Done today" state. */
  exerciseDoneToday?: boolean;
}) {
  const { identity, demoMode, exerciseDoneToday } = options;

  const [draftState, setDraftState] = useState(() => ({
    identity,
    draft: hydrateDraft(identity),
  }));
  const [view, setView] = useState<AssessmentView>("hub");
  const [chairStandPhase, setChairStandPhase] =
    useState<PhysicalTestPhase>("demo");
  const [gaitPhase, setGaitPhase] = useState<PhysicalTestPhase>("demo");
  const [floorRisingPhase, setFloorRisingPhase] =
    useState<PhysicalTestPhase>("demo");
  const [gaitDistanceMeters, setGaitDistanceMeters] = useState(4);

  // Identity changed while mounted (sign-in/out edge) — re-hydrate during
  // render so another account's draft is never shown (React's sanctioned
  // "adjust state during render" pattern).
  if (draftState.identity !== identity) {
    setDraftState({ identity, draft: hydrateDraft(identity) });
    setView("hub");
  }

  const draft = draftState.draft;

  function setDraft(update: SetStateAction<SessionDraft>) {
    setDraftState((current) => ({
      identity: current.identity,
      draft:
        typeof update === "function" ? update(current.draft) : update,
    }));
  }

  // Persist the draft on every change so a tab kill/reload resumes exactly
  // where the participant left off (within the TTL).
  useEffect(() => {
    persistDraft(draftState.identity, draftState.draft);
  }, [draftState]);

  // --- Draft field accessors (screen-level compat) -------------------------

  const consent = draft.consent;
  const setConsent: Dispatch<SetStateAction<ConsentRecord>> = (update) => {
    setDraft((current) => ({
      ...current,
      consent:
        typeof update === "function" ? update(current.consent) : update,
    }));
  };

  const safety = draft.safety;
  const setSafety: Dispatch<SetStateAction<SafetyScreenResult>> = (update) => {
    setDraft((current) => {
      const base = current.safety ?? createDefaultSafetyResult();
      return {
        ...current,
        safety: typeof update === "function" ? update(base) : update,
      };
    });
  };

  /** Stamp the safety answers as given (all-"No" defaults if untouched). */
  function completeSafety() {
    setDraft((current) => ({
      ...current,
      safety: current.safety ?? createDefaultSafetyResult(),
    }));
  }

  const questionnaire = draft.questionnaire;
  const setQuestionnaire: Dispatch<SetStateAction<QuestionnaireDraft>> = (
    update,
  ) => {
    setDraft((current) => {
      const base = current.questionnaire ?? createDefaultQuestionnaireDraft();
      return {
        ...current,
        questionnaire: typeof update === "function" ? update(base) : update,
      };
    });
  };

  const questionIndex = Math.min(draft.questionnaireIndex, lastQuestionIndex);

  const chairStand = draft.chairStand ?? emptyChairStandMetrics();
  const setChairStand: Dispatch<SetStateAction<ChairStandMetrics>> = (
    update,
  ) => {
    setDraft((current) => ({
      ...current,
      chairStand:
        typeof update === "function"
          ? update(current.chairStand ?? emptyChairStandMetrics())
          : update,
    }));
  };

  const motion = draft.motion ?? emptyMotionMetrics();
  const setMotion: Dispatch<SetStateAction<MotionMetrics>> = (update) => {
    setDraft((current) => ({
      ...current,
      motion:
        typeof update === "function"
          ? update(current.motion ?? emptyMotionMetrics())
          : update,
    }));
  };

  const floorRising = draft.floorRising ?? emptyFloorRisingMetrics();
  const setFloorRising: Dispatch<SetStateAction<FloorRisingMetrics>> = (
    update,
  ) => {
    setDraft((current) => ({
      ...current,
      floorRising:
        typeof update === "function"
          ? update(current.floorRising ?? emptyFloorRisingMetrics())
          : update,
    }));
  };

  // --- Derived state --------------------------------------------------------

  const blockedBySafety = isBlockedBySafety(draft.safety);
  const chairStandGate = draft.chairStand
    ? getChairStandGate(draft.chairStand, blockedBySafety)
    : {
        canProceed: false,
        reason: "The sit-to-stand test has not been done yet.",
      };
  const motionGate = draft.motion
    ? getMotionGate(draft.motion)
    : { canProceed: false, reason: "The walk test has not been done yet." };
  const floorRisingGate = draft.floorRising
    ? getFloorRisingGate(draft.floorRising)
    : { canProceed: true, reason: "Floor-rising not attempted." };
  const stoppedBeforeHigherRisk =
    blockedBySafety ||
    (draft.chairStand !== undefined && !chairStandGate.canProceed) ||
    (draft.motion !== undefined && !motionGate.canProceed) ||
    (draft.floorRising !== undefined && !floorRisingGate.canProceed);

  const scoredQuestionnaire = useMemo(
    () =>
      draft.questionnaire && isQuestionnaireComplete(draft)
        ? scoreFallsEfficacy(draft.questionnaire)
        : undefined,
    [draft],
  );

  // Analytics only when there is enough real input (questionnaire + a usable
  // chair-stand record); demo records qualify only in demo mode.
  const analytics = useMemo(
    () =>
      analyseSessionIfPossible(
        buildSessionFromDraft(draft),
        { allowDemo: demoMode && draft.demoLoaded },
      ),
    [draft, demoMode],
  );

  const hubCards = useMemo(
    () => deriveHubCards(draft, { exerciseDoneToday }),
    [draft, exerciseDoneToday],
  );
  const precheckComplete = isPrecheckComplete(draft);
  const canFinish = deriveCanFinish(draft);

  // --- Navigation ------------------------------------------------------------

  function returnToHub() {
    setView("hub");
  }

  function openPrecheck() {
    setView("precheck");
  }

  /** Shared open logic once a card is known to be unlocked. */
  function openTestById(id: TestId) {
    if (id === "self_confidence") {
      setDraft((current) => ({
        ...current,
        questionnaire:
          current.questionnaire ?? createDefaultQuestionnaireDraft(),
        // Redo walks through the existing answers from the first question.
        questionnaireIndex:
          current.questionnaireIndex >= QUESTIONNAIRE_LENGTH
            ? 0
            : current.questionnaireIndex,
        openedTests: current.openedTests.includes(id)
          ? current.openedTests
          : [...current.openedTests, id],
      }));
      setView("test:self_confidence");
      return;
    }

    // Physical tests restart at their instruction/demo phase each visit.
    if (id === "sit_to_stand") setChairStandPhase("demo");
    if (id === "walk") setGaitPhase("demo");
    if (id === "floor_rising") setFloorRisingPhase("demo");
    setDraft((current) => ({
      ...current,
      openedTests: current.openedTests.includes(id)
        ? current.openedTests
        : [...current.openedTests, id],
    }));
    setView(`test:${id}`);
  }

  function openCard(id: HubCardId) {
    if (id === "exercise") {
      setView("exercise");
      return;
    }
    const card = hubCards.find((item) => item.id === id);
    if (!card || card.state === "locked") return;
    openTestById(id as TestId);
  }

  /**
   * Next check the participant still needs to do, walking the fixed order
   * from `afterIndex` (exclusive) using `forDraft` — passed explicitly
   * rather than reading the hook's `draft` so callers that just mutated the
   * draft (setDraft is async) see the up-to-date lock/complete state.
   */
  function findNextTest(afterIndex: number, forDraft: SessionDraft): TestId | null {
    const cards = deriveHubCards(forDraft, { exerciseDoneToday });
    for (let i = afterIndex + 1; i < TEST_ORDER.length; i++) {
      const id = TEST_ORDER[i];
      const card = cards.find((item) => item.id === id);
      if (card && (card.state === "not_started" || card.state === "in_progress")) {
        return id;
      }
    }
    return null;
  }

  /** Read-only peek used by test screens to decide their footer label. */
  function nextTestAfter(id: TestId): TestId | null {
    return findNextTest(TEST_ORDER.indexOf(id), draft);
  }

  /**
   * Completed `id` — open the next check that still needs doing, or pause
   * at the hub if nothing does (chain finished, or the rest are locked).
   */
  function continueFromTest(id: TestId, forDraft: SessionDraft = draft) {
    const next = findNextTest(TEST_ORDER.indexOf(id), forDraft);
    if (next) {
      openTestById(next);
    } else {
      setView("hub");
    }
  }

  // --- Questionnaire stepping -------------------------------------------------

  function advanceQuestion() {
    const nextIndex = Math.min(
      draft.questionnaireIndex + 1,
      QUESTIONNAIRE_LENGTH,
    );
    setDraft((current) => ({ ...current, questionnaireIndex: nextIndex }));
    if (draft.questionnaireIndex >= lastQuestionIndex) {
      // Confirmed the last answer — auto-advance to the next open check.
      continueFromTest("self_confidence", {
        ...draft,
        questionnaireIndex: nextIndex,
      });
    }
  }

  function backQuestion() {
    if (draft.questionnaireIndex <= 0) {
      setView("hub");
      return;
    }
    setDraft((current) => ({
      ...current,
      questionnaireIndex: Math.max(current.questionnaireIndex - 1, 0),
    }));
  }

  // --- Test mutations (kept from the linear flow, minus the index jumps) ----

  function markChairStoppedOrUnsafe() {
    setChairStand((current) => ({
      ...current,
      completionStatus: "stopped",
      movementQuality: "unsafe",
    }));
    returnToHub();
  }

  function markGaitStoppedOrUnstable() {
    setMotion((current) => ({
      ...current,
      completionStatus: "stopped",
      stabilityScore: 0.3,
      rhythmConsistency: 0.35,
      source: "manual",
    }));
    returnToHub();
  }

  /** Record floor-rising as deliberately skipped and go back to the hub. */
  function skipFloorRising() {
    setDraft((current) => ({
      ...current,
      floorRising: getSkippedFloorRisingMetrics(),
    }));
    returnToHub();
  }

  /**
   * Fires when the guided walk finishes. Uses the real devicemotion samples
   * captured during the run when the browser exposed them; falls back to a
   * fixed placeholder on devices/browsers without motion sensor access.
   */
  function startGaitCountdown(samples: MotionSample[] = [], elapsedSeconds = 0) {
    if (samples.length > 0) {
      setMotion(
        summarizeMotionSamples({
          samples,
          distanceMeters: gaitDistanceMeters,
          durationSeconds: elapsedSeconds,
        }),
      );
      return;
    }

    setMotion({
      stabilityScore: 0.62,
      rhythmConsistency: 0.58,
      gaitSpeedMetersPerSecond: Number((gaitDistanceMeters / 5).toFixed(2)),
      completionStatus: "completed",
      source: "accelerometer",
    });
  }

  // --- Demo, finish, start over ----------------------------------------------

  /** Demo-mode only: load the Mr Tan sample answers into the draft. */
  function loadDemo() {
    if (!demoMode) return;
    const demo = createDemoSession();
    setDraft((current) => ({
      ...current,
      demoLoaded: true,
      consent: demo.consent,
      safety: demo.safetyScreen,
      questionnaire: {
        balanceConfidence: demo.questionnaire.balanceConfidence,
        balanceRecoveryConfidence: demo.questionnaire.balanceRecoveryConfidence,
        safeFallingConfidence: demo.questionnaire.safeFallingConfidence,
        postFallRecoveryConfidence:
          demo.questionnaire.postFallRecoveryConfidence,
      },
      questionnaireIndex: QUESTIONNAIRE_LENGTH,
      chairStand: demo.chairStand,
      motion: demo.motion,
      floorRising: demo.floorRising,
    }));
    setChairStandPhase("demo");
    setGaitPhase("demo");
    setFloorRisingPhase("demo");
  }

  /**
   * Finish & review. When a safety flag or a failed gate stopped the
   * escalating-risk chain and floor-rising was never attempted, stamp it as
   * deliberately skipped — matching what the linear flow saved.
   */
  function finish() {
    if (!canFinish) return;
    const stoppedChain =
      blockedBySafety ||
      (draft.chairStand !== undefined && !chairStandGate.canProceed) ||
      (draft.motion !== undefined && !motionGate.canProceed);
    if (!draft.floorRising && stoppedChain) {
      setDraft((current) => ({
        ...current,
        floorRising: getSkippedFloorRisingMetrics(),
      }));
    }
    setView("result");
  }

  /** Clear the persisted draft and begin a brand-new empty one. */
  function startOver() {
    clearDraft(identity);
    setDraft(createEmptyDraft());
    setChairStandPhase("demo");
    setGaitPhase("demo");
    setFloorRisingPhase("demo");
    setView("hub");
  }

  return {
    identity,
    demoMode,
    draft,
    view,
    hubCards,
    precheckComplete,
    canFinish,
    demoLoaded: draft.demoLoaded,
    // Precheck.
    consent,
    setConsent,
    safety,
    setSafety,
    completeSafety,
    // Questionnaire.
    questionnaire,
    setQuestionnaire,
    questionIndex,
    advanceQuestion,
    backQuestion,
    // Physical test phases + metrics (screen compat).
    chairStandPhase,
    setChairStandPhase,
    gaitPhase,
    setGaitPhase,
    floorRisingPhase,
    setFloorRisingPhase,
    gaitDistanceMeters,
    setGaitDistanceMeters,
    chairStand,
    setChairStand,
    motion,
    setMotion,
    floorRising,
    setFloorRising,
    // Derived.
    scoredQuestionnaire,
    analytics,
    blockedBySafety,
    chairStandGate,
    motionGate,
    floorRisingGate,
    stoppedBeforeHigherRisk,
    // Actions.
    openCard,
    openPrecheck,
    returnToHub,
    nextTestAfter,
    continueFromTest,
    finish,
    startOver,
    loadDemo,
    markChairStoppedOrUnsafe,
    markGaitStoppedOrUnstable,
    skipFloorRising,
    startGaitCountdown,
  };
}

export type AssessmentFlow = ReturnType<typeof useAssessmentFlow>;
