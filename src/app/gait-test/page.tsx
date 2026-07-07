import type { Metadata } from "next";
import { DirectGaitTestScreen } from "@/components/assessment/DirectGaitTestScreen";

export const metadata: Metadata = {
  title: "Direct Gait Test | Physio-Aid",
  description: "Direct access to the short active gait walk test.",
};

export default function GaitTestPage() {
  return (
    <main className="min-h-dvh pb-[env(safe-area-inset-bottom)]">
      <DirectGaitTestScreen />
    </main>
  );
}
