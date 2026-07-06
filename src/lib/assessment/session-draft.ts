import { fallsEfficacyQuestions } from "@/content/clinical-copy";
import { DECISION_SUPPORT_DISCLAIMER } from "@/config/clinical-config";
import { CURRENT_SESSION_SCHEMA } from "@/lib/assessment/normalize-session";
import { scoreFallsEfficacy } from "@/lib/questionnaire";
import type {
  AbilityConfidenceResult,
  AssessmentSession,
  ChairStandMetrics,
  ConsentRecord,
  Demographics,
  EmergencyContact,
  FloorRisingMetrics,
  MotionMetrics,
  SafetyScreenResult,
  TestId,
} from "@/types/assessment";

/**
 * The four falls-efficacy answers while the questionnaire is being filled in.
 * (Moved here from useAssessmentFlow.ts, which re-exports it for compat.)
 */
export type QuestionnaireDraft = {
  balanceConfidence: number;
  balanceRecoveryConfidence: number;
  safeFallingConfidence: number;
  postFallRecoveryConfidence: number;
};

/**
 * An assessment in progress. Genuinely empty until the participant acts:
 * `safety: null` means "not answered yet", `questionnaire: null` means
 * "not started", and absent test metrics mean "not attempted" — there are
 * no demo seeds anywhere in a fresh draft.
 */
export type SessionDraft = {
  id: string;
  /** ISO timestamp when this draft was created — drives the 12h TTL. */
  startedAt: string;
  consent: ConsentRecord;
  safety: SafetyScreenResult | null;
  questionnaire: QuestionnaireDraft | null;
  /**
   * Cursor through the falls-efficacy questions. Equal to the question count
   * once the participant has confirmed every answer (= questionnaire done).
   */
  questionnaireIndex: number;
  chairStand?: ChairStandMetrics;
  motion?: MotionMetrics;
  floorRising?: FloorRisingMetrics;
  /** Tests the participant has opened at least once ("in progress" signal). */
  openedTests: TestId[];
  /** True only after the explicit demo-mode "Load sample answers" action. */
  demoLoaded: boolean;
};

export const QUESTIONNAIRE_LENGTH = fallsEfficacyQuestions.length;

/**
 * Drafts expire 12 hours after they were started: safety answers must be
 * fresh, but older adults get interrupted — losing consent plus a completed
 * test to a reload would force needless re-testing.
 */
export const DRAFT_TTL_MS = 12 * 60 * 60 * 1000;

export function draftStorageKey(identity: string): string {
  return `physioaid.assessmentDraft.${identity}`;
}

function newDraftId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `draft-${Date.now()}`;
}

export function createEmptyDraft(options?: {
  profileConsentGiven?: boolean;
}): SessionDraft {
  return {
    id: newDraftId(),
    startedAt: new Date().toISOString(),
    consent: {
      assessmentConsent: options?.profileConsentGiven ?? false,
      researchConsent: false,
      consentedAt: options?.profileConsentGiven
        ? new Date().toISOString()
        : undefined,
    },
    safety: null,
    questionnaire: null,
    questionnaireIndex: 0,
    openedTests: [],
    demoLoaded: false,
  };
}

/** All-"No" safety answers — what the safety screen shows before any toggle. */
export function createDefaultSafetyResult(): SafetyScreenResult {
  return {
    dizziness: false,
    breathlessness: false,
    pain: false,
    recentFallOrInjury: false,
    needsSupervision: false,
    canProceed: true,
  };
}

/** Mid-scale starting answers shown when the questionnaire is first opened. */
export function createDefaultQuestionnaireDraft(): QuestionnaireDraft {
  const midpoints = fallsEfficacyQuestions.map((question) =>
    Math.round((question.min + question.max) / 2),
  );
  return {
    balanceConfidence: midpoints[0] ?? 5,
    balanceRecoveryConfidence: midpoints[1] ?? 5,
    safeFallingConfidence: midpoints[2] ?? 5,
    postFallRecoveryConfidence: midpoints[3] ?? 5,
  };
}

/** Done only once the participant has stepped past the last question. */
export function isQuestionnaireComplete(draft: SessionDraft): boolean {
  return (
    draft.questionnaire !== null &&
    draft.questionnaireIndex >= QUESTIONNAIRE_LENGTH
  );
}

/**
 * Whether a test metric counts as a real record of this draft. Demo metrics
 * count only after the explicit demo-mode sample load — a demo-sourced
 * metric on a real user's draft (e.g. from a guided-run placeholder) is not
 * a record of anything the participant did.
 */
export function isRecordedMetric(
  metric:
    | { completionStatus?: string; source?: string }
    | undefined,
  demoLoaded: boolean,
): boolean {
  if (!metric) return false;
  if (metric.completionStatus === "demo" || metric.source === "demo") {
    return demoLoaded;
  }
  return true;
}

export function loadDraft(identity: string): SessionDraft | null {
  if (typeof window === "undefined") return null;
  const key = draftStorageKey(identity);
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionDraft> | null;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.id !== "string" ||
      typeof parsed.startedAt !== "string" ||
      !parsed.consent ||
      typeof parsed.consent !== "object"
    ) {
      window.localStorage.removeItem(key);
      return null;
    }
    const startedAt = Date.parse(parsed.startedAt);
    if (!Number.isFinite(startedAt) || Date.now() - startedAt > DRAFT_TTL_MS) {
      window.localStorage.removeItem(key);
      return null;
    }
    // Merge over an empty draft so older/partial payloads never crash the UI.
    return {
      ...createEmptyDraft(),
      ...parsed,
      id: parsed.id,
      startedAt: parsed.startedAt,
      safety: parsed.safety ?? null,
      questionnaire: parsed.questionnaire ?? null,
      questionnaireIndex:
        typeof parsed.questionnaireIndex === "number"
          ? parsed.questionnaireIndex
          : 0,
      openedTests: Array.isArray(parsed.openedTests) ? parsed.openedTests : [],
      demoLoaded: parsed.demoLoaded === true,
    };
  } catch {
    return null;
  }
}

export function persistDraft(identity: string, draft: SessionDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      draftStorageKey(identity),
      JSON.stringify(draft),
    );
  } catch {
    // Storage unavailable (private mode) — the draft lives in memory only.
  }
}

export function clearDraft(identity: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(draftStorageKey(identity));
  } catch {
    // Nothing to clear.
  }
}

/**
 * Turn a draft into a saveable schema-2 session. Only what actually happened
 * is included: the questionnaire is scored only when complete, test metrics
 * are stamped only when they are real records (see `isRecordedMetric`), and
 * profile-owned extras (demographics / emergency contact) plus analytics are
 * included only when provided. Undefined tests stay absent — `saveAssessment`
 * additionally strips undefined keys before the Firestore write.
 */
export function buildSessionFromDraft(
  draft: SessionDraft,
  extras: {
    demographics?: Demographics;
    emergencyContact?: EmergencyContact;
    analytics?: AbilityConfidenceResult;
  } = {},
): AssessmentSession {
  const now = new Date().toISOString();
  const questionnaire =
    draft.questionnaire && isQuestionnaireComplete(draft)
      ? scoreFallsEfficacy(draft.questionnaire)
      : undefined;

  return {
    id: draft.id,
    schemaVersion: CURRENT_SESSION_SCHEMA,
    createdAt: draft.startedAt,
    completedAt: now,
    consent: draft.consent,
    // `canProceed: false` when the safety check was never answered — the
    // participant was not cleared for physical tests in this session.
    safetyScreen: draft.safety ?? {
      ...createDefaultSafetyResult(),
      canProceed: false,
    },
    questionnaire,
    chairStand: isRecordedMetric(draft.chairStand, draft.demoLoaded)
      ? draft.chairStand
      : undefined,
    motion: isRecordedMetric(draft.motion, draft.demoLoaded)
      ? draft.motion
      : undefined,
    floorRising: isRecordedMetric(draft.floorRising, draft.demoLoaded)
      ? draft.floorRising
      : undefined,
    demographics: extras.demographics,
    emergencyContact: extras.emergencyContact,
    analytics: extras.analytics,
    report: {
      id: "report",
      generatedAt: now,
      disclaimer: DECISION_SUPPORT_DISCLAIMER,
    },
  };
}
