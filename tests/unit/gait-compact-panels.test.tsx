import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  GaitCompactReadyPanel,
  GaitTestInstructionPanel,
} from "../../src/components/assessment/screens/GaitCompactPanels";
import type { MotionSupportStatus } from "../../src/types/motion";

const grantedStatus: MotionSupportStatus = {
  supported: true,
  permissionState: "granted",
  requiresUserGesture: false,
  message: "Motion sensors are ready.",
};

const promptStatus: MotionSupportStatus = {
  supported: true,
  permissionState: "prompt_required",
  requiresUserGesture: true,
  message: "Motion permission requires a tap.",
};

describe("compact gait panels", () => {
  test("renders granted permission as a compact checkmark row", () => {
    const html = renderToStaticMarkup(
      <GaitCompactReadyPanel
        canUseCalibration
        motionStatus={grantedStatus}
        onCalibrate={() => undefined}
        onEnableMotion={() => undefined}
        onManualEntry={() => undefined}
        onMarkStopped={() => undefined}
        onStart={() => undefined}
      />,
    );

    expect(html).toContain("Motion ready");
    expect(html).toContain("Start 15 sec walk");
    expect(html).toContain("Calibrate");
    expect(html).not.toContain("Enable motion");
  });

  test("constrains the ready panel to a single phone-width grid column", () => {
    const html = renderToStaticMarkup(
      <GaitCompactReadyPanel
        canUseCalibration
        motionStatus={{
          ...grantedStatus,
          message:
            "Motion sensors appear available without an extra browser permission prompt.",
        }}
        onCalibrate={() => undefined}
        onEnableMotion={() => undefined}
        onManualEntry={() => undefined}
        onMarkStopped={() => undefined}
        onStart={() => undefined}
      />,
    );

    expect(html).toContain('class="grid min-w-0 grid-cols-1 gap-4"');
    expect(html).toContain(
      'class="quiet-card grid min-w-0 grid-cols-1 gap-3 p-4"',
    );
  });

  test("renders pending permission as an enable button", () => {
    const html = renderToStaticMarkup(
      <GaitCompactReadyPanel
        canUseCalibration
        motionStatus={promptStatus}
        onCalibrate={() => undefined}
        onEnableMotion={() => undefined}
        onManualEntry={() => undefined}
        onMarkStopped={() => undefined}
        onStart={() => undefined}
      />,
    );

    expect(html).toContain("Motion pending");
    expect(html).toContain("Enable motion");
  });

  test("renders the one-page TEST instruction screen", () => {
    const html = renderToStaticMarkup(
      <GaitTestInstructionPanel
        durationSeconds={15}
        onBack={() => undefined}
        onStart={() => undefined}
      />,
    );

    expect(html).toContain("TEST");
    expect(html).toContain("15 seconds");
    expect(html).toContain("Start");
    expect(html).not.toContain("Motion sensor scaffold");
  });
});
