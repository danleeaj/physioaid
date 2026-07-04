"use client";

import { DemoInstructionScreen } from "@/components/assessment/demos/DemoInstructionScreen";

type FloorRisingDemoProps = {
  onContinue: () => void;
  onSkip: () => void;
  onUseDemo: () => void;
};

export function FloorRisingDemo({
  onContinue,
  onSkip,
  onUseDemo,
}: FloorRisingDemoProps) {
  return (
    <DemoInstructionScreen
      animation={<FloorRisingSetupAnimation />}
      description="Set up the camera before this test. Only continue if the space is clear and someone is nearby."
      instructions={[
        "Place the phone 2 to 3 metres away.",
        "Make sure your full body is visible in the camera frame.",
        "Keep the floor area clear.",
        "Only continue if someone is nearby and you feel safe.",
      ]}
      onPrimary={onContinue}
      onSecondary={onSkip}
      onTertiary={onUseDemo}
      safetyNote="Floor-rising is the highest-risk movement in this flow. Skipping is always acceptable."
      secondaryLabel="Skip this test"
      secondaryProminent
      tertiaryLabel="Use demo floor-rising"
      title="Floor-rising camera setup"
    />
  );
}

function FloorRisingSetupAnimation() {
  return (
    <svg
      aria-label="Camera setup demo for floor-rising test"
      className="h-full min-h-64 w-full max-w-2xl"
      role="img"
      viewBox="0 0 560 320"
    >
      <rect fill="#f8faf7" height="320" rx="8" width="560" />
      <rect fill="#ffffff" height="208" rx="8" stroke="#115e59" strokeWidth="8" width="178" x="312" y="54" />
      <path d="M342 220c18-36 98-36 116 0" fill="none" stroke="#9bb5ac" strokeLinecap="round" strokeWidth="9" />
      <circle cx="400" cy="108" fill="none" r="24" stroke="#0f766e" strokeWidth="9" />
      <path d="M400 132v66M400 154l-42 28M400 154l42 28M400 198l-35 42M400 198l38 42" fill="none" stroke="#0f766e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="9" />
      <rect fill="#ffffff" height="112" rx="14" stroke="#115e59" strokeWidth="8" width="66" x="70" y="118" />
      <circle cx="103" cy="210" fill="#115e59" r="5" />
      <path d="M150 238H290" stroke="#0f766e" strokeDasharray="10 10" strokeLinecap="round" strokeWidth="6" />
      <text fill="#115e59" fontSize="20" fontWeight="700" x="166" y="226">
        2 to 3 metres
      </text>
      <ellipse className="floor-clear-zone" cx="400" cy="264" fill="#dff3ee" rx="112" ry="24" />
      <text fill="#5f6f68" fontSize="20" fontWeight="700" x="341" y="294">
        Clear floor area
      </text>
    </svg>
  );
}
