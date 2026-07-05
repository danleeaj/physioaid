"use client";

import { useState } from "react";
import { CameraSetup } from "@/components/assessment/CameraSetup";
import { FloorRisingDemo } from "@/components/assessment/demos/FloorRisingDemo";
import { TestStartPanel } from "@/components/assessment/TestStartPanel";
import { FormGrid, TextField } from "@/components/assessment/ui/Fields";
import { permissionLabel } from "@/components/assessment/ui/permission-labels";
import { SafetyCallout } from "@/components/assessment/ui/SafetyCallout";
import { ScreenHeader } from "@/components/assessment/ui/ScreenHeader";
import {
  getDemoFloorRisingMetrics,
} from "@/lib/functional-tests/floor-rising";
import { getCameraFloorRisingPlaceholder } from "@/lib/vision/floor-rising";
import type { AssessmentFlow } from "@/components/assessment/useAssessmentFlow";
import type { CameraSupportStatus } from "@/lib/vision/camera";

export function FloorRisingScreen({ flow }: { flow: AssessmentFlow }) {
  const {
    floorRisingPhase,
    setFloorRisingPhase,
    floorRising,
    setFloorRising,
    motionGate,
    skipToDashboardWithFloorSkipped,
  } = flow;
  const [cameraStatus, setCameraStatus] = useState<CameraSupportStatus>();

  if (floorRisingPhase === "demo") {
    return (
      <FloorRisingDemo
        onContinue={() => setFloorRisingPhase("start")}
        onSkip={skipToDashboardWithFloorSkipped}
        onUseDemo={() => {
          setFloorRising(getDemoFloorRisingMetrics());
          setFloorRisingPhase("start");
        }}
      />
    );
  }

  if (floorRisingPhase === "start") {
    return (
      <TestStartPanel
        fallbackActions={[
          {
            label: "Skip this test",
            onClick: skipToDashboardWithFloorSkipped,
            tone: "primary",
          },
          {
            label: "Enter manually",
            onClick: () => setFloorRisingPhase("manual"),
          },
          {
            label: "Use demo",
            onClick: () => setFloorRising(getDemoFloorRisingMetrics()),
          },
        ]}
        onPrimary={() => setFloorRising(getCameraFloorRisingPlaceholder())}
        primaryLabel="Start when ready"
        resultItems={[
          ["Completed", floorRising.completionStatus],
          [
            "Seconds",
            floorRising.durationSeconds !== undefined
              ? `${floorRising.durationSeconds}`
              : "not recorded",
          ],
          [
            "Assistance",
            floorRising.requiredAssistance ? "required" : "not required",
          ],
        ].map(([label, value]) => ({ label, value }))}
        safetyInstruction="Only continue if someone is nearby, your full body is visible, and the floor area is clear."
        statusItems={[
          {
            label: "Camera",
            value: permissionLabel(cameraStatus?.permissionState),
          },
          { label: "Safety option", value: "skip available" },
        ]}
        title="Floor-rising test"
      >
        {!motionGate.canProceed && (
          <SafetyCallout tone="danger">
            Motion gait screening did not pass the safety gate. Floor-rising
            should be skipped and the dashboard should explain why.
          </SafetyCallout>
        )}
        <CameraSetup onStatusChange={setCameraStatus} />
      </TestStartPanel>
    );
  }

  return (
    <section className="grid gap-6">
      <ScreenHeader
        support="Use this fallback if camera setup is denied or unavailable. Skipping remains available."
        title="Enter floor-rising result"
      />
      <CameraSetup />
      <FormGrid>
        <TextField
          label="Time to rise from floor in seconds"
          onChange={(value) =>
            setFloorRising((current) => ({
              ...current,
              completionStatus: "completed",
              durationSeconds: Number(value),
              source: "manual",
            }))
          }
          type="number"
          value={String(floorRising.durationSeconds ?? 0)}
        />
        <label className="choice-option" data-selected={floorRising.requiredAssistance}>
          <input
            checked={floorRising.requiredAssistance}
            className="h-6 w-6 accent-[var(--primary)]"
            onChange={(event) =>
              setFloorRising((current) => ({
                ...current,
                requiredAssistance: event.target.checked,
                completionStatus: event.target.checked
                  ? "stopped"
                  : "completed",
                movementQuality: event.target.checked
                  ? "unsafe"
                  : "not_assessed",
                source: "manual",
              }))
            }
            type="checkbox"
          />
          <span className="text-[length:var(--text-body)]">
            Required assistance or could not complete safely
          </span>
        </label>
      </FormGrid>
      <div className="flex flex-wrap gap-3">
        <button
          className="secondary-action"
          onClick={() => setFloorRisingPhase("start")}
          type="button"
        >
          Back to guided start
        </button>
        <button
          className="secondary-action"
          onClick={() => setFloorRising(getDemoFloorRisingMetrics())}
          type="button"
        >
          Use demo floor-rising
        </button>
        <button
          className="secondary-action"
          onClick={skipToDashboardWithFloorSkipped}
          type="button"
        >
          Skip floor-rising
        </button>
      </div>
    </section>
  );
}
