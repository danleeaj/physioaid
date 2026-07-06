/**
 * Movement activity log — the user-owned record of "the user did something
 * physical", distinct from assessment evidence. Written by the assessment
 * flow (a completed check), the exercise hub card, manual walk logging, and
 * (future) community events / wearable integrations.
 */

/** What triggered the log entry. */
export type MovementSource =
  | "assessment"
  | "exercise"
  | "manual_walk"
  | "community_event"
  | "integration";

/** What kind of activity was logged. */
export type MovementActivityType =
  | "mobility_check"
  | "balance_practice"
  | "chair_exercise"
  | "walk"
  | "functional_reach"
  | "other";

/** Community sharing state for a single log entry — default "private". */
export type MovementVisibility = "private" | "community";

export type MovementActivityLog = {
  id: string;
  userId: string;
  source: MovementSource;
  activityType: MovementActivityType;
  title: string;
  durationMinutes: number | null;
  /** ISO timestamp of when the activity happened/completed. */
  completedAt: string;
  visibility: MovementVisibility;
  /** Present when the log was generated from a saved assessment session. */
  assessmentSessionId?: string;
  /** Present when the log ties back to a specific test result. */
  assessmentTestResultId?: string;
};

/**
 * Caller-supplied fields for a new log entry. `completedAt`/`visibility` are
 * optional — `recordMovementActivity` fills sensible defaults (now / private).
 */
export type MovementActivityInput = Omit<
  MovementActivityLog,
  "id" | "userId" | "completedAt" | "visibility"
> & {
  completedAt?: string;
  visibility?: MovementVisibility;
};
