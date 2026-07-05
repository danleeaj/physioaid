"use client";

import { ShieldCheck } from "lucide-react";
import { shellCopy } from "@/components/layout/copy";
import { TopBar } from "@/components/layout/TopBar";
import { DECISION_SUPPORT_DISCLAIMER } from "@/config/clinical-config";

const points = [
  "We collect the minimum personal information needed for your mobility checks.",
  "Your assessment records stay private and are only shared when you choose to share a report.",
  "Movement tests store derived measurements, not raw video, by default.",
  "Emergency contact details are treated as sensitive personal data.",
  "You can ask for your records to be deleted or exported at any time.",
];

/** Privacy & consent — participant-facing summary, secondary screen. */
export function PrivacyConsentScreen({ onBack }: { onBack: () => void }) {
  return (
    <>
      <TopBar onBack={onBack} title={shellCopy.privacy.title} />
      <div className="app-content pb-[calc(20px+env(safe-area-inset-bottom))]">
        <section className="app-card app-card--hero flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--primary-dark)]">
            <ShieldCheck aria-hidden size={22} />
          </span>
          <p className="font-bold">Your assessment records stay private and secure.</p>
        </section>

        <ul className="grid gap-3">
          {points.map((point) => (
            <li className="app-card text-[var(--muted-strong)]" key={point}>
              {point}
            </li>
          ))}
        </ul>

        <p className="text-[length:var(--text-label)] text-[var(--muted)]">
          {DECISION_SUPPORT_DISCLAIMER}
        </p>
      </div>
    </>
  );
}
