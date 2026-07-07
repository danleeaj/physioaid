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
  gaitResultItems,
  speedSourceLabel,
} from "@/components/assessment/screens/gait-display";
import { GaitResultReview } from "@/components/assessment/screens/GaitResultReview";
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

type GaitView =
  | "start"
  | "calibration_setup"
  | "calibration_capture"
  | "manual"
  | "result";
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
  "gaitPhase" | "setGaitPhase" | "setMotion" | "startGaitCountdown"
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
    startGaitCountdown,
  } = flow;
  const { profile } = useUserProfile();
  const [motionStatus, setMotionStatus] = useState<MotionSupportStatus>();
  const heightCm = profile?.heightCm ?? Math.round(DEFAULT_HEIGHT_METERS * 100);
  const heightStepLengthMeters = estimateStepLengthMeters(heightCm / 100);
  const [gaitView, setGaitView] = useState<GaitView>("start");
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

  function showGaitStart() {
    setGaitPhase("start");
    setGaitView("start");
  }

  function showManualEntry() {
    updateManualMotion({});
    setGaitPhase("start");
    setGaitView("manual");
  }

  function showResult() {
    setGaitPhase("start");
    setGaitView("result");
  }

  function markStoppedInScreen() {
    setMotion((current) => ({
      ...current,
      completionStatus: "stopped",
      rhythmConsistency: 0.35,
      source: "manual",
      stabilityScore: 0.3,
    }));
    showResult();
  }

  function useDemoGaitResult() {
    setMotion(getDemoMotionMetrics());
    showResult();
  }

  function updateManualMotion(patch: Partial<MotionMetrics>) {
    setMotion((current) => ({
      absoluteEstimateMethod: "none",
      completionStatus: "completed",
      gaitSpeedMetersPerSecond:
        patch.gaitSpeedMetersPerSecond ??
        (current.source === "manual"
          ? current.gaitSpeedMetersPerSecond
          : undefined),
      rhythmConsistency:
        patch.rhythmConsistency ??
        (current.source === "manual" ? current.rhythmConsistency : 0),
      source: "manual",
      stabilityScore:
        patch.stabilityScore ??
        (current.source === "manual" ? current.stabilityScore : 0),
    }));
  }

  if (gaitPhase === "demo") {
    return <GaitWalkDemo onContinue={showGaitStart} />;
  }

  if (gaitView === "result") {
    return <GaitResultReview motion={motion} onBack={showGaitStart} />;
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
          onClick={markStoppedInScreen}
          type="button"
        >
          Skip gait walking
        </button>
      </section>
    );
  }

  if (gaitPhase === "start" && gaitView === "calibration_setup") {
    return (
      <section className="grid gap-6">
        <ScreenHeader
          eyebrow="Optional calibration"
          support="Use a marked straight path to calibrate step length for this gait screen only."
          title="Use measured distance"
        />
        <SafetyCallout>
          Walk to the marked line. At the line, stop walking and stand still.
          The calibration will finish after about three seconds of stillness.
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
            onClick={() => setGaitView("calibration_capture")}
            type="button"
          >
            Start calibration walk
          </button>
          <button
            className="secondary-action"
            onClick={() => setGaitView("start")}
            type="button"
          >
            Timed walk without calibration
          </button>
        </div>
      </section>
    );
  }

  if (gaitPhase === "start" && gaitView === "calibration_capture") {
    return (
      <TestStartPanel
        autoStopOnStandstill={{
          stillSeconds: 3,
          completionCue: "Calibration complete.",
        }}
        countdownCueWord="start walking"
        fallbackActions={[
          {
            label: "Cancel calibration",
            onClick: () => setGaitView("calibration_setup"),
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
          setGaitView(
            result.status === "accepted" ? "start" : "calibration_setup",
          );
        }}
        primaryLabel="Start calibration walk"
        resultItems={[]}
        guidedActiveCue="Start walking. At the marked line, stop and stand still until you hear calibration complete."
        guidedBaselineCue="Stand still. Start walking when you hear start walking."
        safetyInstruction="Walk the marked distance at your usual safe pace. Stop at the line and stand still until you hear calibration complete."
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

  if (gaitView === "manual" || gaitPhase === "manual") {
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
              updateManualMotion({
                gaitSpeedMetersPerSecond: Number(value),
              })
            }
            type="number"
            value={String(motion.gaitSpeedMetersPerSecond ?? 0)}
          />
          <TextField
            label="Stability score"
            onChange={(value) =>
              updateManualMotion({
                stabilityScore: Number(value),
              })
            }
            type="number"
            value={String(motion.stabilityScore)}
          />
        </FormGrid>
        <div className="flex flex-wrap gap-3">
          <button
            className="primary-action"
            onClick={showResult}
            type="button"
          >
            Review result
          </button>
          <button
            className="secondary-action"
            onClick={showGaitStart}
            type="button"
          >
            Back to gait test
          </button>
          <button
            className="secondary-action"
            onClick={useDemoGaitResult}
            type="button"
          >
            Use demo gait walk
          </button>
          <button
            className="secondary-action"
            onClick={markStoppedInScreen}
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
                  onClick: () => setGaitView("calibration_setup"),
                },
              ]
            : []),
          {
            label: "Enter manually",
            onClick: showManualEntry,
          },
          {
            label: "Mark stopped or unstable",
            onClick: markStoppedInScreen,
          },
        ]}
        guidedPocketMode
        onPrimary={(samples, elapsedSeconds) => {
          startGaitCountdown(
            samples,
            elapsedSeconds,
            normalStepLengthMeters,
            normalStepLengthMethod,
          );
          showResult();
        }}
        primaryLabel="Start 25 sec walk"
        resultItems={gaitResultItems(motion)}
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

  return null;
}
