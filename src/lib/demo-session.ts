import { DECISION_SUPPORT_DISCLAIMER } from "@/config/clinical-config";
import { scoreFallsEfficacy } from "@/lib/questionnaire";
import { getDemoFloorRisingMetrics } from "@/lib/functional-tests/floor-rising";
import { getDemoMotionMetrics } from "@/lib/sensors/motion-summary";
import {
  getDemoChairStandMetrics,
  getDemoVisionMetrics,
} from "@/lib/vision/chair-stand";
import type { AssessmentSession } from "@/types/assessment";

export function createDemoSession(): AssessmentSession {
  const now = new Date().toISOString();
  const questionnaire = scoreFallsEfficacy({
    balanceConfidence: 5,
    balanceRecoveryConfidence: 4,
    safeFallingConfidence: 3,
    postFallRecoveryConfidence: 5,
  });

  return {
    id: "demo-mr-tan",
    createdAt: now,
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
