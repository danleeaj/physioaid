"use client";

import { useState } from "react";
import { GaitWalkDemo } from "@/components/assessment/demos/GaitWalkDemo";
import { MotionSensorStatus } from "@/components/assessment/MotionSensorStatus";
import { TestStartPanel } from "@/components/assessment/TestStartPanel";
import { FormGrid, TextField } from "@/components/assessment/ui/Fields";
import { permissionLabel } from "@/components/assessment/ui/permission-labels";
import { SafetyCallout } from "@/components/assessment/ui/SafetyCallout";
import { ScreenHeader } from "@/components/assessment/ui/ScreenHeader";
import { getDemoMotionMetrics } from "@/lib/sensors/motion-summary";
import type { AssessmentFlow } from "@/components/assessment/useAssessmentFlow";
import type { MotionSupportStatus } from "@/types/motion";

function DistanceSelector({
  onChange,
  value,
}: {
  onChange: (value: number) => void;
  value: number;
}) {
  const distances = [4, 5, 10];

  return (
    <div>
      <p className="mb-3 font-semibold">Walking distance</p>
      <div className="grid grid-cols-3 gap-3" role="radiogroup">
        {distances.map((distance) => {
          const selected = value === distance;
          return (
            <button
              aria-checked={selected}
              className="choice-option justify-center"
              data-selected={selected}
              key={distance}
              onClick={() => onChange(distance)}
              role="radio"
              type="button"
            >
              {distance}m
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function GaitScreen({ flow }: { flow: AssessmentFlow }) {
  const {
    gaitPhase,
    setGaitPhase,
    motion,
    setMotion,
    gaitDistanceMeters,
    setGaitDistanceMeters,
    chairStandGate,
    motionGate,
    markGaitStoppedOrUnstable,
    startGaitCountdown,
  } = flow;
  const [motionStatus, setMotionStatus] = useState<MotionSupportStatus>();

  if (gaitPhase === "demo") {
    return <GaitWalkDemo onContinue={() => setGaitPhase("start")} />;
  }

  if (gaitPhase === "start") {
    return (
      <TestStartPanel
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
        onPrimary={startGaitCountdown}
        primaryLabel="Start walk"
        resultItems={[
          {
            label: "Gait speed",
            value: `${motion.gaitSpeedMetersPerSecond ?? 0} m/s`,
          },
          {
            label: "Rhythm",
            value: `${Math.round(motion.rhythmConsistency * 100)}%`,
          },
          {
            label: "Stability",
            value: `${Math.round(motion.stabilityScore * 100)}%`,
          },
        ]}
        safetyInstruction="Walk at your usual safe pace with the phone held steadily or placed in your pocket."
        showMotionReadout
        statusItems={[
          {
            label: "Motion",
            value: permissionLabel(motionStatus?.permissionState),
          },
          { label: "Distance", value: `${gaitDistanceMeters}m` },
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
        <DistanceSelector
          onChange={setGaitDistanceMeters}
          value={gaitDistanceMeters}
        />
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
