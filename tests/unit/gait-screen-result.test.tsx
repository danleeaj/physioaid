import { describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import type { MotionMetrics } from "../../src/types/assessment";

mock.module("@/components/assessment/ui/ScreenHeader", () => ({
  ScreenHeader({
    support,
    title,
  }: {
    support?: string;
    title: string;
  }) {
    return (
      <header>
        <h1>{title}</h1>
        {support && <p>{support}</p>}
      </header>
    );
  },
}));

mock.module("@/components/assessment/ui/SafetyCallout", () => ({
  SafetyCallout({ children }: { children: ReactNode }) {
    return <div>{children}</div>;
  },
}));

function motion(patch: Partial<MotionMetrics>): MotionMetrics {
  return {
    stabilityScore: 0.73,
    rhythmConsistency: 0.68,
    source: "accelerometer",
    ...patch,
  };
}

describe("GaitResultReview", () => {
  test("renders stopped results with only the back action", async () => {
    const { GaitResultReview } = await import(
      "../../src/components/assessment/screens/GaitResultReview"
    );

    const html = renderToStaticMarkup(
      <GaitResultReview
        motion={motion({
          absoluteEstimateMethod: "calibration_walk",
          analysisMode: "reconstruction_full",
          cadenceStepsPerMinute: 104.4,
          completionStatus: "stopped",
          cycleQualityScore: 0.82,
          gaitSpeedMetersPerSecond: 0.91,
          source: "manual",
          stepCount: 44,
          trajectoryShape: {
            symmetry: 0.7,
          },
        })}
        onBack={() => undefined}
      />,
    );

    expect(html).toContain("Gait walk result");
    expect(html).toContain("Source: Stopped");
    expect(html).toContain("Speed: Calibration walk");
    expect(html).toContain("Calibration speed");
    expect(html).toContain("0.91 m/s");
    expect(html).toContain("Back to gait test");
    expect(html).not.toContain("Enter manually");
    expect(html).not.toContain("Mark stopped or unstable");
  });
});
