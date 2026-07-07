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
  const stepLengthMeters = estimateStepLengthMeters(heightCm / 100);

  if (gaitPhase === "demo") {
    return <GaitWalkDemo onContinue={() => setGaitPhase("start")} />;
  }

  if (gaitPhase === "start") {
    return (
      <TestStartPanel
        autoCompleteSeconds={gaitProtocol.targetDurationSeconds}
        countdownCueWord="go"
        fallbackActions={[
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
          startGaitCountdown(samples, elapsedSeconds, stepLengthMeters)
        }
        primaryLabel="Start 25 sec walk"
        resultItems={[
          {
            label: "Gait speed",
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
            value:
              motion.gaitSpeedEstimateSource === "course_distance"
                ? "Course distance"
                : "Step estimate",
          },
        ]}
        title="Gait walk test"
      >
        {!chairStandGate.canProceed && (
          <SafetyCallout tone="danger">
            Chair stand screening suggests this participant should not continue
            to gait walking today. Higher-risk testing will be skipped.
          </SafetyCallout>
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
