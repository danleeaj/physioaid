"use client";

import type { ReactNode } from "react";
import { SafetyCallout } from "@/components/assessment/ui/SafetyCallout";
import { ListenButton } from "@/components/i18n/ListenButton";
import { useLanguage } from "@/components/i18n/LanguageProvider";

type DemoInstructionScreenProps = {
  title: string;
  description: string;
  animation: ReactNode;
  instructions: string[];
  safetyNote: string;
  primaryLabel?: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryProminent?: boolean;
  tertiaryLabel?: string;
  onTertiary?: () => void;
};

export function DemoInstructionScreen({
  title,
  description,
  animation,
  instructions,
  safetyNote,
  primaryLabel = "I understand, continue",
  onPrimary,
  secondaryLabel,
  onSecondary,
  secondaryProminent = false,
  tertiaryLabel,
  onTertiary,
}: DemoInstructionScreenProps) {
  const { t } = useLanguage();

  return (
    <section className="grid gap-6">
      <header className="grid gap-3">
        <p className="eyebrow">{t("test.guidedSetup")}</p>
        <h1 className="text-[length:var(--text-title)] font-semibold sm:text-[length:var(--text-display)]">
          {title}
        </h1>
        <p className="max-w-3xl text-[length:var(--text-lead)] text-[var(--muted)]">
          {description}
        </p>
        <div>
          <ListenButton text={`${title}. ${description}`} />
        </div>
      </header>

      <div className="demo-visual panel-card flex min-h-[17rem] items-center justify-center p-4 sm:min-h-[21rem]">
        {animation}
      </div>

      <ol className="grid gap-3">
        {instructions.map((instruction, index) => (
          <li
            className="flex min-h-16 items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-4"
            key={instruction}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-base font-bold text-[var(--primary-dark)]">
              {index + 1}
            </span>
            <span className="font-semibold leading-snug">{instruction}</span>
          </li>
        ))}
      </ol>

      <SafetyCallout>{safetyNote}</SafetyCallout>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button className="primary-action" onClick={onPrimary} type="button">
          {primaryLabel}
        </button>
        {secondaryLabel && onSecondary && (
          <button
            className={secondaryProminent ? "primary-action" : "secondary-action"}
            onClick={onSecondary}
            type="button"
          >
            {secondaryLabel}
          </button>
        )}
        {tertiaryLabel && onTertiary && (
          <button className="link-action" onClick={onTertiary} type="button">
            {tertiaryLabel}
          </button>
        )}
      </div>
    </section>
  );
}
