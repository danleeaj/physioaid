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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[length:var(--text-caption)] text-[var(--muted)]">
          <p>Direct gait test route</p>
          <p className="font-bold">Version: {DIRECT_GAIT_TEST_VERSION}</p>
        </div>
        <GaitScreen flow={flow} />
      </div>
    </div>
  );
}
