"use client";

import { CameraSetup } from "@/components/assessment/CameraSetup";
import { ChairStandDemo } from "@/components/assessment/demos/ChairStandDemo";
import { TestStartPanel } from "@/components/assessment/TestStartPanel";
import { FormGrid, TextField } from "@/components/assessment/ui/Fields";
import { SafetyCallout } from "@/components/assessment/ui/SafetyCallout";
import { ScreenHeader } from "@/components/assessment/ui/ScreenHeader";
import { getDemoChairStandMetrics } from "@/lib/vision/chair-stand";
import type { AssessmentFlow } from "@/components/assessment/useAssessmentFlow";

export function ChairStandScreen({ flow }: { flow: AssessmentFlow }) {
  const {
    chairStandPhase,
    setChairStandPhase,
    chairStand,
    setChairStand,
    blockedBySafety,
    markChairStoppedOrUnsafe,
  } = flow;

  if (chairStandPhase === "demo") {
    return (
      <ChairStandDemo
        onContinue={() => setChairStandPhase("start")}
        onUseDemo={() => {
          setChairStand(getDemoChairStandMetrics());
          setChairStandPhase("start");
        }}
      />
    );
  }

  if (chairStandPhase === "start") {
    return (
      <TestStartPanel
        autoCompleteSeconds={30}
        fallbackActions={[
          {
            label: "Enter manually",
            onClick: () => setChairStandPhase("manual"),
          },
          {
            label: "Use demo",
            onClick: () => setChairStand(getDemoChairStandMetrics()),
          },
          {
            label: "Mark stopped or unsafe",
            onClick: markChairStoppedOrUnsafe,
          },
        ]}
        onPrimary={() => setChairStand(getDemoChairStandMetrics())}
        primaryLabel="Start 30s test"
        resultItems={[
          ["Reps", `${chairStand.repetitions}`],
          ["Seconds", `${chairStand.durationSeconds}`],
          [
            "Movement quality",
            chairStand.movementQuality?.replaceAll("_", " ") ??
              "not assessed",
          ],
        ].map(([label, value]) => ({ label, value }))}
        safetyInstruction="Use a stable chair, keep both feet flat, and stop if you feel dizzy, breathless, or unsafe."
        statusItems={[
          { label: "Sensor", value: "ready" },
          { label: "Camera", value: "optional" },
        ]}
        title="Chair stand test"
      >
        {blockedBySafety && (
          <SafetyCallout tone="danger">
            Safety screening found a concern. Continue with demo data only or
            go to the dashboard.
          </SafetyCallout>
        )}
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
