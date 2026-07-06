"use client";

import { HeartHandshake } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { shellCopy } from "@/components/layout/copy";

/** First onboarding step — orientation copy only, no data collected. */
export function WelcomeStep({ onContinue }: { onContinue: () => void }) {
  const { lang } = useLanguage();
  const copy = shellCopy[lang].onboarding;
  return (
    <section className="grid gap-4">
      <h1 className="text-[length:var(--text-display)] font-bold">
        {copy.welcome.title}
      </h1>
      <p className="text-[var(--muted-strong)]">{copy.welcome.body}</p>

      {/* Warm hero placeholder — mirrors the Sign In scene */}
      <div
        aria-hidden
        className="mx-auto my-2 flex h-36 w-full items-center justify-center rounded-[var(--radius-card)] bg-[var(--accent-warm-soft)]"
      >
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--accent-warm)]">
          <HeartHandshake size={40} />
        </span>
      </div>

      <p className="text-[length:var(--text-label)] text-[var(--muted)]">
        {copy.welcome.duration}
      </p>

      <button className="primary-action w-full" onClick={onContinue} type="button">
        {copy.continueLabel}
      </button>
    </section>
  );
}
