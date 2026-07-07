"use client";

import { useMemo, useState } from "react";
import {
  GaitScreen,
  type GaitScreenFlow,
} from "@/components/assessment/screens/GaitScreen";
import { TopBar } from "@/components/layout/TopBar";
import {
  createDirectGaitState,
  DIRECT_GAIT_TEST_VERSION,
  directGaitChairStandGate,
  summarizeDirectGaitRun,
} from "@/lib/assessment/direct-gait-flow";
import { getMotionGate } from "@/lib/functional-tests/gates";
import type { PhysicalTestPhase } from "@/components/assessment/useAssessmentFlow";
import type { MotionMetrics } from "@/types/assessment";
import type { MotionSample } from "@/types/motion";

const initialState = createDirectGaitState();

export function DirectGaitTestScreen() {
  const [gaitPhase, setGaitPhase] = useState<PhysicalTestPhase>(
    initialState.gaitPhase,
  );
  const [motion, setMotion] = useState<MotionMetrics>(initialState.motion);
  const motionGate = useMemo(() => getMotionGate(motion), [motion]);

  function startGaitCountdown(
    samples: MotionSample[] = [],
    elapsedSeconds = 0,
    stepLengthMeters?: number,
  ) {
    setMotion(
      summarizeDirectGaitRun({
        samples,
        durationSeconds: elapsedSeconds,
        stepLengthMeters,
      }),
    );
  }

  const flow: GaitScreenFlow = {
    gaitPhase,
    setGaitPhase,
    motion,
    setMotion,
    chairStandGate: directGaitChairStandGate,
    motionGate,
    startGaitCountdown,
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#f7f7f7]">
      <TopBar title="Direct gait test" />
      <div className="app-content flex-1">
        <div className="callout grid gap-2">
          <p>
            This standalone page opens the live gait walk test directly for
            testing. The main assessment flow still requires the sit-to-stand
            gate before gait walking.
          </p>
          <p className="text-[length:var(--text-caption)] font-bold text-[var(--muted)]">
            Version: {DIRECT_GAIT_TEST_VERSION}
          </p>
        </div>
        <GaitScreen flow={flow} />
      </div>
    </div>
  );
}
