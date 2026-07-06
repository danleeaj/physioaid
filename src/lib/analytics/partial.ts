import { analyseAssessment } from "@/lib/analytics/ability-confidence";
import { metricRecordStatus } from "@/lib/assessment/test-status";
import type {
  AbilityConfidenceResult,
  AssessmentSession,
} from "@/types/assessment";

/**
 * Run the (untouched) scoring engine only when the session carries enough
 * real inputs: a questionnaire plus a chair-stand record that is
 * "completed" or "stopped" ("stopped" is deliberate evidence — the engine
 * scores it high-risk). Demo chair-stand records qualify only when the
 * caller explicitly opts in (`allowDemo`, demo mode). Returns undefined
 * otherwise so callers can render an honest "not computed" state.
 */
export function analyseSessionIfPossible(
  session: AssessmentSession,
  options?: { allowDemo?: boolean },
): AbilityConfidenceResult | undefined {
  const { questionnaire, chairStand } = session;
  if (!questionnaire || !chairStand) return undefined;

  const status = metricRecordStatus(chairStand);
  const usable =
    status === "completed" ||
    status === "stopped" ||
    (options?.allowDemo === true && status === "demo");
  if (!usable) return undefined;

  return analyseAssessment({
    questionnaire,
    chairStand,
    motion: session.motion,
  });
}
