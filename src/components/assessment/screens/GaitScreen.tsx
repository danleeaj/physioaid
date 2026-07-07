"use client";

import { useState } from "react";
import { GaitWalkDemo } from "@/components/assessment/demos/GaitWalkDemo";
import { MotionSensorStatus } from "@/components/assessment/MotionSensorStatus";
import { TestStartPanel } from "@/components/assessment/TestStartPanel";
import { FormGrid, TextField } from "@/components/assessment/ui/Fields";
import { permissionLabel } from "@/components/assessment/ui/permission-labels";
import { SafetyCallout } from "@/components/assessment/ui/SafetyCallout";
import { ScreenHeader } from "@/components/assessment/ui/ScreenHeader";
import { useUserProfile } from "@/components/auth/UserProfileProvider";
import {
  analysisModeLabel,
  gaitSpeedLabel,
  shapeResultItem,
  speedSourceLabel,
} from "@/components/assessment/screens/gait-display";
import {
  analyzeGaitCalibration,
  nextSessionCalibration,
  type GaitCalibrationRejectReason,
  type GaitCalibrationResult,
  type GaitSessionCalibration,
} from "@/lib/sensors/gait-calibration";
import { gaitProtocol } from "@/lib/sensors/gait-protocol";
import { getDemoMotionMetrics } from "@/lib/sensors/motion-summary";
import {
  DEFAULT_HEIGHT_METERS,
  estimateStepLengthMeters,
} from "@/lib/sensors/step-detection";
import type { AssessmentFlow } from "@/components/assessment/useAssessmentFlow";
import type { FunctionalTestGate } from "@/lib/functional-tests/gates";
import type { MotionMetrics } from "@/types/assessment";
import type { MotionSupportStatus } from "@/types/motion";

function formatOptionalNumber(value: number | undefined, suffix: string) {
  return value === undefined ? "Not measured" : `${value}${suffix}`;
}

type CalibrationView = "walk" | "setup" | "capture";
type StepLengthEstimateMethod = "height_regression" | "calibration_walk";

const calibrationReasonCopy: Record<GaitCalibrationRejectReason, string> = {
  invalid_distance: "Use a marked distance from 3 m to 20 m.",
  insufficient_samples:
    "Motion capture was too short or too sparse. Try again with the phone in the front pocket.",
  insufficient_steps:
    "Not enough walking steps were detected for that distance. Try a longer marked path if available.",
  no_clean_finish:
    "Stop at the marked line, stand still for a few seconds, then remove the phone.",
  implausible_step_length:
    "The detected step length was outside the supported range. Check the entered distance and try again.",
  low_quality:
    "The motion signal was too variable for calibration. Try again at a usual safe pace.",
};

export type GaitScreenFlow = Pick<
  AssessmentFlow,
  | "gaitPhase"
  | "setGaitPhase"
  | "setMotion"
  | "markGaitStoppedOrUnstable"
  | "startGaitCountdown"
> & {
  chairStandGate: FunctionalTestGate;
  motion: MotionMetrics;
  motionGate: FunctionalTestGate;
};

export function GaitScreen({ flow }: { flow: GaitScreenFlow }) {
  const {
    gaitPhase,
    setGaitPhase,
    motion,
    setMotion,
    chairStandGate,
    motionGate,
    markGaitStoppedOrUnstable,
    startGaitCountdown,
  } = flow;
  const { profile } = useUserProfile();
  const [motionStatus, setMotionStatus] = useState<MotionSupportStatus>();
  const heightCm = profile?.heightCm ?? Math.round(DEFAULT_HEIGHT_METERS * 100);
  const heightStepLengthMeters = estimateStepLengthMeters(heightCm / 100);
  const [calibrationView, setCalibrationView] =
    useState<CalibrationView>("walk");
  const [calibrationDistanceMeters, setCalibrationDistanceMeters] =
    useState("6");
  const [sessionCalibration, setSessionCalibration] =
    useState<GaitSessionCalibration>();
  const [calibrationResult, setCalibrationResult] =
    useState<GaitCalibrationResult>();
  const normalStepLengthMeters =
    sessionCalibration?.calibratedStepLengthMeters ?? heightStepLengthMeters;
  const normalStepLengthMethod: StepLengthEstimateMethod = sessionCalibration
    ? "calibration_walk"
    : "height_regression";
  const parsedCalibrationDistanceMeters = Number(calibrationDistanceMeters);
  const canUseCalibration = chairStandGate.canProceed;
  const shapeItem = shapeResultItem(motion);

  if (gaitPhase === "demo") {
    return <GaitWalkDemo onContinue={() => setGaitPhase("start")} />;
  }

  if (gaitPhase === "start" && !canUseCalibration) {
    return (
      <section className="grid gap-6">
        <ScreenHeader
          support="Chair stand screening suggests this participant should not continue to gait walking today."
          title="Gait walk not available"
        />
        <SafetyCallout tone="danger">
          Higher-risk walking tests are skipped in this flow.
        </SafetyCallout>
        <button
          className="secondary-action"
          onClick={markGaitStoppedOrUnstable}
          type="button"
        >
          Skip gait walking
        </button>
      </section>
    );
  }

  if (gaitPhase === "start" && calibrationView === "setup") {
    return (
      <section className="grid gap-6">
        <ScreenHeader
          eyebrow="Optional calibration"
          support="Use a marked straight path to calibrate step length for this gait screen only."
          title="Use measured distance"
        />
        <SafetyCallout>
          Walk to the marked line. At the line, stop walking and stand still.
          Then take out the phone and press Stop.
        </SafetyCallout>
        <FormGrid>
          <TextField
            label="Marked distance in metres"
            onChange={setCalibrationDistanceMeters}
            type="number"
            value={calibrationDistanceMeters}
          />
        </FormGrid>
        <div className="flex flex-wrap gap-2">
          {[4, 6, 10].map((distance) => (
            <button
              className="secondary-action"
              key={distance}
              onClick={() => setCalibrationDistanceMeters(String(distance))}
              type="button"
            >
              {distance} m
            </button>
          ))}
        </div>
        {calibrationResult?.status === "accepted" && (
          <div className="quiet-card grid gap-2 p-5">
            <p className="text-[length:var(--text-label)] font-bold text-[var(--muted)]">
              Calibration accepted
            </p>
            <p>
              Step length:{" "}
              {calibrationResult.calibration.calibratedStepLengthMeters.toFixed(
                2,
              )}{" "}
              m
            </p>
            <p>
              Quality:{" "}
              {Math.round(
                calibrationResult.calibration.calibrationQualityScore * 100,
              )}
              %
            </p>
          </div>
        )}
        {calibrationResult?.status === "rejected" && (
          <SafetyCallout>
            {calibrationReasonCopy[calibrationResult.reason]}
          </SafetyCallout>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            className="primary-action"
            onClick={() => setCalibrationView("capture")}
            type="button"
          >
            Start calibration walk
          </button>
          <button
            className="secondary-action"
            onClick={() => setCalibrationView("walk")}
            type="button"
          >
            Timed walk without calibration
          </button>
        </div>
      </section>
    );
  }

  if (gaitPhase === "start" && calibrationView === "capture") {
    return (
      <TestStartPanel
        countdownCueWord="start walking"
        fallbackActions={[
          {
            label: "Cancel calibration",
            onClick: () => setCalibrationView("setup"),
          },
        ]}
        guidedPocketMode
        onPrimary={(samples, elapsedSeconds) => {
          const result = analyzeGaitCalibration({
            samples,
            elapsedSeconds,
            enteredDistanceMeters: parsedCalibrationDistanceMeters,
          });
          setCalibrationResult(result);
          setSessionCalibration((current) =>
            nextSessionCalibration(current, result),
          );
          setCalibrationView(result.status === "accepted" ? "walk" : "setup");
        }}
        primaryLabel="Start calibration walk"
        resultItems={[]}
        safetyInstruction="Walk the marked distance at your usual safe pace. Stop at the line, stand still, then remove the phone and press Stop."
        showMotionReadout
        statusItems={[
          {
            label: "Motion",
            value: permissionLabel(motionStatus?.permissionState),
          },
          {
            label: "Distance",
            value: Number.isFinite(parsedCalibrationDistanceMeters)
              ? `${parsedCalibrationDistanceMeters} m`
              : "Check distance",
          },
        ]}
        title="Calibration walk"
      >
        <MotionSensorStatus onStatusChange={setMotionStatus} />
      </TestStartPanel>
    );
  }

  if (gaitPhase === "start") {
    return (
      <TestStartPanel
        autoCompleteSeconds={gaitProtocol.targetDurationSeconds}
        countdownCueWord="go"
        fallbackActions={[
          ...(canUseCalibration
            ? [
                {
                  label: "Use measured distance",
                  onClick: () => setCalibrationView("setup"),
                },
              ]
            : []),
          {
            label: "Enter manually",
            onClick: () => setGaitPhase("manual"),
          },
          {
            label: "Mark stopped or unstable",
            onClick: markGaitStoppedOrUnstable,
          },
        ]}
        guidedPocketMode
        onPrimary={(samples, elapsedSeconds) =>
          startGaitCountdown(
            samples,
            elapsedSeconds,
            normalStepLengthMeters,
            normalStepLengthMethod,
          )
        }
        primaryLabel="Start 25 sec walk"
        resultItems={[
          {
            label: gaitSpeedLabel(motion),
            value: `${motion.gaitSpeedMetersPerSecond ?? 0} m/s`,
          },
          {
            label: "Cadence",
            value: formatOptionalNumber(
              motion.cadenceStepsPerMinute,
              " steps/min",
            ),
          },
          {
            label: "Steps",
            value:
              motion.stepCount === undefined
                ? "Not measured"
                : String(motion.stepCount),
          },
          {
            label: "Rhythm",
            value: `${Math.round(motion.rhythmConsistency * 100)}%`,
          },
          {
            label: "Stability",
            value: `${Math.round(motion.stabilityScore * 100)}%`,
          },
          {
            label: "Quality",
            value: `${Math.round((motion.cycleQualityScore ?? 0) * 100)}%`,
          },
          {
            label: "Mode",
            value: analysisModeLabel(motion.analysisMode),
          },
          ...(shapeItem ? [shapeItem] : []),
        ]}
        safetyInstruction="Walk at your usual safe pace for 25 seconds with the phone placed in a front pocket."
        showMotionReadout
        statusItems={[
          {
            label: "Motion",
            value: permissionLabel(motionStatus?.permissionState),
          },
          {
            label: "Duration",
            value: `${gaitProtocol.targetDurationSeconds}s`,
          },
          {
            label: "Speed",
            value: sessionCalibration
              ? "Calibration walk"
              : speedSourceLabel(motion),
          },
        ]}
        title="Gait walk test"
      >
        {sessionCalibration && (
          <div className="quiet-card grid gap-2 p-5">
            <p className="text-[length:var(--text-label)] font-bold text-[var(--muted)]">
              Calibration walk ready
            </p>
            <p>
              Step length:{" "}
              {sessionCalibration.calibratedStepLengthMeters.toFixed(2)} m
            </p>
            <p>
              Quality:{" "}
              {Math.round(sessionCalibration.calibrationQualityScore * 100)}%
            </p>
          </div>
        )}
        <MotionSensorStatus onStatusChange={setMotionStatus} />
      </TestStartPanel>
    );
  }

  return (
    <section className="grid gap-6">
      <ScreenHeader
        support="Use this fallback if motion sensing is denied or unavailable."
        title="Enter gait walk result"
      />
      <MotionSensorStatus />
      <FormGrid>
        <TextField
          label="Gait speed in metres per second"
          onChange={(value) =>
            setMotion((current) => ({
              ...current,
              gaitSpeedMetersPerSecond: Number(value),
              completionStatus: "completed",
              source: "manual",
            }))
          }
          type="number"
          value={String(motion.gaitSpeedMetersPerSecond ?? 0)}
        />
        <TextField
          label="Stability score"
          onChange={(value) =>
            setMotion((current) => ({
              ...current,
              stabilityScore: Number(value),
              completionStatus: "completed",
              source: "manual",
            }))
          }
          type="number"
          value={String(motion.stabilityScore)}
        />
      </FormGrid>
      <div className="flex flex-wrap gap-3">
        <button
          className="secondary-action"
          onClick={() => setGaitPhase("start")}
          type="button"
        >
          Back to guided start
        </button>
        <button
          className="secondary-action"
          onClick={() => setMotion(getDemoMotionMetrics())}
          type="button"
        >
          Use demo gait walk
        </button>
        <button
          className="secondary-action"
          onClick={markGaitStoppedOrUnstable}
          type="button"
        >
          Mark stopped or unstable
        </button>
      </div>
      {!motionGate.canProceed && (
        <SafetyCallout tone="danger">
          Gait walking suggests caution. The floor-rising test is the
          highest-risk test and should not be attempted in this flow.
        </SafetyCallout>
      )}
    </section>
  );
}
