"use client";

import { DemoInstructionScreen } from "@/components/assessment/demos/DemoInstructionScreen";

type GaitWalkDemoProps = {
  onContinue: () => void;
  onUseDemo: () => void;
};

export function GaitWalkDemo({ onContinue, onUseDemo }: GaitWalkDemoProps) {
  return (
    <DemoInstructionScreen
      animation={<GaitWalkAnimation />}
      description="Prepare a clear walking path and carry the phone steadily during the walk."
      instructions={[
        "Walk 4 metres at your usual safe pace.",
        "Hold the phone steadily or place it in your pocket.",
        "Keep the path clear.",
        "Stop if you feel unsteady or unsafe.",
      ]}
      onPrimary={onContinue}
      onSecondary={onUseDemo}
      safetyNote="Use a clear, dry path. Stop and sit down if you feel unsteady."
      secondaryLabel="Use demo gait walk"
      title="Gait walk demo"
    />
  );
}

function GaitWalkAnimation() {
  return (
    <svg
      aria-label="Animated four metre walking demo"
      className="h-full min-h-64 w-full max-w-2xl"
      role="img"
      viewBox="0 0 560 300"
    >
      <rect fill="#f8faf7" height="300" rx="8" width="560" />
      <path d="M92 220H468" stroke="#0f766e" strokeLinecap="round" strokeWidth="8" />
      <path d="M92 188v64M468 188v64" stroke="#115e59" strokeLinecap="round" strokeWidth="8" />
      <text fill="#115e59" fontSize="22" fontWeight="700" x="226" y="258">
        4 metres
      </text>
      <g className="gait-walker" fill="none" stroke="#0f766e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="13">
        <circle cx="0" cy="98" r="22" />
        <path d="M0 122v58" />
        <path d="M0 142l-38 28" />
        <path d="M0 142l36 28" />
        <path d="M0 180l-30 50" />
        <path d="M0 180l34 50" />
        <rect fill="#ffffff" height="42" rx="7" stroke="#115e59" strokeWidth="7" width="27" x="28" y="128" />
      </g>
      <text fill="#5f6f68" fontSize="20" fontWeight="700" x="64" y="174">
        Start
      </text>
      <text fill="#5f6f68" fontSize="20" fontWeight="700" x="440" y="174">
        End
      </text>
    </svg>
  );
}
