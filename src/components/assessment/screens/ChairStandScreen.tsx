"use client";

import { useState } from "react";
import { CameraSetup } from "@/components/assessment/CameraSetup";
import { ChairStandDemo } from "@/components/assessment/demos/ChairStandDemo";
import { MotionSensorStatus } from "@/components/assessment/MotionSensorStatus";
import { TestStartPanel } from "@/components/assessment/TestStartPanel";
import { FormGrid, TextField } from "@/components/assessment/ui/Fields";
import { permissionLabel } from "@/components/assessment/ui/permission-labels";
import { SafetyCallout } from "@/components/assessment/ui/SafetyCallout";
import { ScreenHeader } from "@/components/assessment/ui/ScreenHeader";
import { summarizeChairStandSamples } from "@/lib/sensors/chair-stand-detection";
import { getDemoChairStandMetrics } from "@/lib/vision/chair-stand";
import type { AssessmentFlow } from "@/components/assessment/useAssessmentFlow";
import type { CameraSupportStatus } from "@/lib/vision/camera";
import type { MotionSupportStatus } from "@/types/motion";

export function ChairStandScreen({ flow }: { flow: AssessmentFlow }) {
  const {
    chairStandPhase,
    setChairStandPhase,
    chairStand,
    setChairStand,
    blockedBySafety,
    markChairStoppedOrUnsafe,
  } = flow;
  const [motionStatus, setMotionStatus] = useState<MotionSupportStatus>();
  const [cameraStatus, setCameraStatus] = useState<CameraSupportStatus>();
  const [motionSampleCount, setMotionSampleCount] = useState<number>();

  if (chairStandPhase === "demo") {
    return (
      <ChairStandDemo onContinue={() => setChairStandPhase("start")} />
    );
  }

  if (chairStandPhase === "start") {
    return (
      <TestStartPanel
        autoCompleteSeconds={30}
        countdownCueWord="begin"
        fallbackActions={[
          {
            label: "Enter manually",
            onClick: () => setChairStandPhase("manual"),
          },
          {
            label: "Mark stopped or unsafe",
            onClick: markChairStoppedOrUnsafe,
          },
        ]}
        guidedPocketMode
        onPrimary={(samples, elapsedSeconds) => {
          setChairStand(
            summarizeChairStandSamples({ samples, durationSeconds: elapsedSeconds }),
          );
          setMotionSampleCount(samples.length);
        }}
        primaryLabel="Start 30s test"
        resultItems={[
          ["Reps", `${chairStand.repetitions}`],
          ["Seconds", `${chairStand.durationSeconds}`],
          [
            "Movement quality",
            chairStand.movementQuality?.replaceAll("_", " ") ??
              "not assessed",
          ],
          ...(motionSampleCount !== undefined
            ? ([["Motion samples captured", `${motionSampleCount}`]] as const)
            : []),
        ].map(([label, value]) => ({ label, value }))}
        safetyInstruction="Use a stable chair, keep both feet flat, and stop if you feel dizzy, breathless, or unsafe."
        showMotionReadout
        statusItems={[
          {
            label: "Motion",
            value: permissionLabel(motionStatus?.permissionState),
          },
          {
            label: "Camera",
            value:
              cameraStatus?.permissionState === "granted"
                ? "ready"
                : `optional · ${permissionLabel(cameraStatus?.permissionState)}`,
          },
        ]}
        title="Chair stand test"
      >
        {blockedBySafety && (
          <SafetyCallout tone="danger">
            Safety screening found a concern. Continue with demo data only or
            go to the dashboard.
          </SafetyCallout>
        )}
        <MotionSensorStatus onStatusChange={setMotionStatus} />
        <CameraSetup onStatusChange={setCameraStatus} />
      </TestStartPanel>
    );
  }

  return (
    <section className="grid gap-6">
      <ScreenHeader
        support="Use this fallback if the guided test cannot be completed with the available sensors."
        title="Enter chair stand result"
      />
      <CameraSetup />
      <FormGrid>
        <TextField
          label="Repetitions"
          onChange={(value) =>
            setChairStand((current) => ({
              ...current,
              completionStatus: "completed",
              repetitions: Number(value),
              source: "manual",
            }))
          }
          type="number"
          value={String(chairStand.repetitions)}
        />
        <TextField
          label="Duration in seconds"
          onChange={(value) =>
            setChairStand((current) => ({
              ...current,
              completionStatus: "completed",
              durationSeconds: Number(value),
              source: "manual",
            }))
          }
          type="number"
          value={String(chairStand.durationSeconds)}
        />
      </FormGrid>
      <div className="flex flex-wrap gap-3">
        <button
          className="secondary-action"
          onClick={() => setChairStandPhase("start")}
          type="button"
        >
          Back to guided start
        </button>
        <button
          className="secondary-action"
          onClick={() => setChairStand(getDemoChairStandMetrics())}
          type="button"
        >
          Use demo chair stand
        </button>
        <button
          className="secondary-action"
          onClick={markChairStoppedOrUnsafe}
          type="button"
        >
          Mark stopped or unsafe
        </button>
      </div>
    </section>
  );
}
