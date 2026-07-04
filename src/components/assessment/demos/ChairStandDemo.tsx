"use client";

import { DemoInstructionScreen } from "@/components/assessment/demos/DemoInstructionScreen";

type ChairStandDemoProps = {
  onContinue: () => void;
  onUseDemo: () => void;
};

export function ChairStandDemo({
  onContinue,
  onUseDemo,
}: ChairStandDemoProps) {
  return (
    <DemoInstructionScreen
      animation={<ChairStandAnimation />}
      description="Watch the safe pattern before starting. Move slowly and stop if anything feels unsafe."
      instructions={[
        "Use a stable chair without wheels.",
        "Keep both feet flat on the floor.",
        "Stand up and sit down safely.",
        "Stop if you feel dizzy, breathless, or unsafe.",
      ]}
      onPrimary={onContinue}
      onSecondary={onUseDemo}
      safetyNote="Use support nearby if needed. Do not continue if you feel unwell."
      secondaryLabel="Use demo chair stand"
      title="Chair stand demo"
    />
  );
}

function ChairStandAnimation() {
  return (
    <svg
      aria-label="Animated chair stand movement demo"
      className="h-full min-h-64 w-full max-w-2xl"
      role="img"
      viewBox="0 0 520 300"
    >
      <rect fill="#f8faf7" height="300" rx="8" width="520" />
      <path d="M80 240H440" stroke="#8ca39a" strokeLinecap="round" strokeWidth="6" />
      <g stroke="#115e59" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12">
        <path d="M320 138h78v78" fill="none" />
        <path d="M350 216v38M398 216v38" />
      </g>
      <g className="chair-stand-ghost" fill="none" stroke="#9bb5ac" strokeLinecap="round" strokeLinejoin="round" strokeWidth="14">
        <circle cx="228" cy="98" r="24" />
        <path d="M225 126v54l45 18" />
        <path d="M224 178h-56" />
        <path d="M270 198l38 42" />
        <path d="M168 178l-28 52" />
      </g>
      <g className="chair-stand-active" fill="none" stroke="#0f766e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="14">
        <circle cx="210" cy="82" r="24" />
        <path d="M212 110v78" />
        <path d="M212 138l-46 34" />
        <path d="M212 138l48 34" />
        <path d="M212 188l-32 62" />
        <path d="M212 188l42 62" />
      </g>
    </svg>
  );
}
