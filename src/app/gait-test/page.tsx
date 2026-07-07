import type { Metadata } from "next";
import { DirectGaitTestScreen } from "@/components/assessment/DirectGaitTestScreen";

export const metadata: Metadata = {
  title: "Direct Gait Test | Physio-Aid",
  description: "Direct access to the short active gait walk test.",
};

export default function GaitTestPage() {
  return (
    <div className="app-viewport">
      <main className="app-shell">
        <DirectGaitTestScreen />
      </main>
    </div>
  );
}
