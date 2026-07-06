import { DECISION_SUPPORT_DISCLAIMER } from "@/config/clinical-config";
import { scoreFallsEfficacy } from "@/lib/questionnaire";
import { getDemoFloorRisingMetrics } from "@/lib/functional-tests/floor-rising";
import { getDemoMotionMetrics } from "@/lib/sensors/motion-summary";
import {
  getDemoChairStandMetrics,
  getDemoVisionMetrics,
} from "@/lib/vision/chair-stand";
import type { AssessmentSession } from "@/types/assessment";

/**
 * The demo session always carries every field — its metrics are legitimate
 * demo content keyed by the explicit `demo-mr-tan` id (never stripped by
 * `normalizeSession`). The narrowed type lets consumers read demo fields
 * without the optional-field guards real sessions require.
 */
export type DemoSession = AssessmentSession &
  Required<
    Pick<
      AssessmentSession,
      | "emergencyContact"
      | "demographics"
      | "questionnaire"
      | "chairStand"
      | "motion"
      | "floorRising"
      | "vision"
    >
  >;

export function createDemoSession(): DemoSession {
  const now = new Date().toISOString();
  const questionnaire = scoreFallsEfficacy({
    balanceConfidence: 5,
    balanceRecoveryConfidence: 4,
    safeFallingConfidence: 3,
    postFallRecoveryConfidence: 5,
  });

  return {
    id: "demo-mr-tan",
    schemaVersion: 2,
    createdAt: now,
    completedAt: now,
    consent: {
      assessmentConsent: true,
      researchConsent: false,
      consentedAt: now,
    },
    emergencyContact: {
      name: "Mrs Tan",
      phone: "+65 9000 0000",
      relationship: "Spouse",
    },
    demographics: {
      displayName: "Mr Tan",
      age: 78,
      livingSituation: "Lives with spouse",
      fallHistory: "near_fall",
    },
    safetyScreen: {
      dizziness: false,
      breathlessness: false,
      pain: false,
      recentFallOrInjury: false,
      needsSupervision: true,
      canProceed: true,
    },
    questionnaire,
    chairStand: getDemoChairStandMetrics(),
    motion: getDemoMotionMetrics(),
    floorRising: getDemoFloorRisingMetrics(),
    vision: getDemoVisionMetrics(),
    report: {
      id: "demo-report",
      generatedAt: now,
      disclaimer: DECISION_SUPPORT_DISCLAIMER,
    },
  };
}
