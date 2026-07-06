import type { Metadata } from "next";
import { MotionGateLab } from "@/components/assessment/MotionGateLab";

export const metadata: Metadata = {
  title: "Motion Gate Lab | Physio-Aid",
  description: "Direct gait gate and browser motion sensor test bench.",
};

export default function MotionTestPage() {
  return (
    <main className="min-h-dvh pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-5 sm:py-6 md:px-8">
        <MotionGateLab />
      </div>
    </main>
  );
}
