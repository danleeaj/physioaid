"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";

/** Calm progress strip — "Step X of Y" plus a filling track. */
export function ProgressBar({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const { t } = useLanguage();

  return (
    <div aria-label={t("progress.step", { current, total })} className="grid gap-2">
      <p className="text-[length:var(--text-label)] font-bold text-[var(--muted-strong)]">
        {t("progress.step", { current, total })}
      </p>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${Math.round((current / total) * 100)}%` }}
        />
      </div>
    </div>
  );
}
