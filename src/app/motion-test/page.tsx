import type { Metadata } from "next";
import { MotionSensorStatus } from "@/components/assessment/MotionSensorStatus";

export const metadata: Metadata = {
  title: "Motion Sensor Test | Physio-Aid",
  description: "Live browser motion and orientation sensor inspection.",
};

export default function MotionTestPage() {
  return (
    <main className="min-h-dvh pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-5 sm:py-6 md:px-8">
        <MotionSensorStatus />
      </div>
    </main>
  );
}
