/**
 * Stable identifiers for every assessment test the product knows about.
 * `timed_up_and_go` and `functional_reach` are future tests — no data is
 * recorded for them yet, but ids are reserved so hub cards / reports can
 * show them as "coming soon" without a later schema change.
 */
export type TestId =
  | "self_confidence"
  | "sit_to_stand"
  | "walk"
  | "floor_rising"
  | "timed_up_and_go"
  | "functional_reach";

/** Status of a stored per-test record inside a saved session. */
export type TestRecordStatus =
  | "completed"
  | "stopped"
  | "skipped"
  | "demo"
  | "missing";

/** UI state of a test card in the assessment hub. */
export type TestItemState =
  | "not_started"
  | "in_progress"
  | "completed"
  | "skipped"
  | "locked";

export type AbilityBand = "good" | "reduced" | "poor";
export type ConfidenceBand = "good" | "low";
export type RiskCategory = "low" | "moderate" | "high";

export type AbilityConfidenceProfile =
  | "stable_profile"
  | "under_confidence"
  | "possible_risk_taking"
  | "high_vulnerability";

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
  /**
   * Optional since schema 2: demographics are stamped from the user profile
   * at save time, and the profile stores a coarse age group — never a numeric
   * age — so honest sessions may omit it.
   */
  age?: number;
  livingSituation: string;
  /** Optional since schema 2 — the profile does not collect fall history. */
  fallHistory?: "none" | "near_fall" | "fall";
  /**
   * Coarse, self-reported planning area — collected only with research
   * consent for aggregate programme planning. Never derived from GPS.
   */
  planningArea?: string;
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
  completionStatus: "completed" | "stopped" | "skipped" | "demo";
  durationSeconds: number;
  repetitions: number;
  movementQuality?: "steady" | "variable" | "unsafe";
  source: "manual" | "demo" | "camera" | "accelerometer";
};

export type MotionMetrics = {
  stabilityScore: number;
  rhythmConsistency: number;
  gaitSpeedMetersPerSecond?: number;
  completionStatus?: "completed" | "stopped" | "skipped" | "demo";
  source: "accelerometer" | "manual" | "demo";
};

export type FloorRisingMetrics = {
  completionStatus: "completed" | "stopped" | "skipped" | "demo";
  durationSeconds?: number;
  requiredAssistance: boolean;
  movementQuality?: "steady" | "variable" | "unsafe" | "not_assessed";
  source: "manual" | "demo" | "camera";
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
  /**
   * Schema 2 sessions record only what actually happened: tests are optional
   * and absent fields mean "not attempted". Sessions without a schemaVersion
   * are v1 (demo-seeded flow) and must pass through `normalizeSession` on
   * read — never trust their metrics directly.
   */
  schemaVersion?: 2;
  consent: ConsentRecord;
  emergencyContact?: EmergencyContact;
  demographics?: Demographics;
  safetyScreen: SafetyScreenResult;
  questionnaire?: FallsEfficacyResult;
  chairStand?: ChairStandMetrics;
  motion?: MotionMetrics;
  floorRising?: FloorRisingMetrics;
  vision?: VisionMetrics;
  analytics?: AbilityConfidenceResult;
  report?: ReportSummary;
  createdAt: string;
  /** When the participant finished/saved the assessment (ISO). */
  completedAt?: string;
};
