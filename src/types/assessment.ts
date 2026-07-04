export type AbilityBand = "good" | "reduced" | "poor";
export type ConfidenceBand = "good" | "low";
export type RiskCategory = "low" | "moderate" | "high";

export type AbilityConfidenceProfile =
  | "stable_profile"
  | "under_confidence"
  | "possible_risk_taking"
  | "high_vulnerability";

export type AssessmentStep =
  | "landing"
  | "safety"
  | "emergency_contact"
  | "demographics"
  | "questionnaire"
  | "chair_stand"
  | "motion_gait"
  | "floor_rising"
  | "dashboard"
  | "report";

export type ConsentRecord = {
  assessmentConsent: boolean;
  researchConsent: boolean;
  consentedAt?: string;
};

export type EmergencyContact = {
  name: string;
  phone: string;
  relationship: string;
};

export type Demographics = {
  displayName: string;
  age: number;
  livingSituation: string;
  fallHistory: "none" | "near_fall" | "fall";
};

export type SafetyScreenResult = {
  dizziness: boolean;
  breathlessness: boolean;
  pain: boolean;
  recentFallOrInjury: boolean;
  needsSupervision: boolean;
  canProceed: boolean;
};

export type FallsEfficacyResult = {
  balanceConfidence: number;
  balanceRecoveryConfidence: number;
  safeFallingConfidence: number;
  postFallRecoveryConfidence: number;
  averageScore: number;
};

export type ChairStandMetrics = {
  completionStatus: "completed" | "stopped" | "demo";
  durationSeconds: number;
  repetitions: number;
  movementQuality?: "steady" | "variable" | "unsafe";
  source: "manual" | "demo" | "camera";
};

export type MotionMetrics = {
  stabilityScore: number;
  rhythmConsistency: number;
  gaitSpeedMetersPerSecond?: number;
  completionStatus?: "completed" | "stopped" | "demo";
  source: "accelerometer" | "manual" | "demo";
};

export type FloorRisingMetrics = {
  completionStatus: "completed" | "stopped" | "skipped" | "demo";
  durationSeconds?: number;
  requiredAssistance: boolean;
  source: "manual" | "demo";
};

export type VisionMetrics = {
  detectedRepetitions: number;
  estimatedDurationSeconds: number;
  source: "camera" | "manual" | "demo";
};

export type Recommendation = {
  id: string;
  title: string;
  body: string;
  type:
    | "maintain_activity"
    | "confidence_building"
    | "balance_recovery"
    | "strengthening"
    | "supervised_practice"
    | "community_linkage"
    | "physiotherapy_review"
    | "urgent_safety_advice";
};

export type AbilityConfidenceResult = {
  abilityBand: AbilityBand;
  confidenceBand: ConfidenceBand;
  profile: AbilityConfidenceProfile;
  riskCategory: RiskCategory;
  interpretation: string;
  recommendations: Recommendation[];
};

export type ReportSummary = {
  id: string;
  generatedAt: string;
  disclaimer: string;
};

export type AssessmentSession = {
  id: string;
  consent: ConsentRecord;
  emergencyContact: EmergencyContact;
  demographics: Demographics;
  safetyScreen: SafetyScreenResult;
  questionnaire: FallsEfficacyResult;
  chairStand: ChairStandMetrics;
  motion?: MotionMetrics;
  floorRising?: FloorRisingMetrics;
  vision?: VisionMetrics;
  analytics?: AbilityConfidenceResult;
  report?: ReportSummary;
  createdAt: string;
};
