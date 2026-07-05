"use client";

import { HeartHandshake } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { TopBar } from "@/components/layout/TopBar";

/** Care partner access — polished placeholder, no account system yet. */
export function CarePartnerScreen({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <TopBar onBack={onBack} title={t("shell.carePartner.title")} />
      <div className="app-content pb-[calc(20px+env(safe-area-inset-bottom))]">
        <div
          aria-hidden
          className="mx-auto flex h-32 w-full items-center justify-center rounded-[var(--radius-card)] bg-[var(--accent-warm-soft)]"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--accent-warm)]">
            <HeartHandshake size={32} />
          </span>
        </div>

        <p className="text-[var(--muted)]">{t("shell.carePartner.body")}</p>

        <label className="grid gap-2">
          <span className="font-bold">{t("shell.carePartner.inputLabel")}</span>
          <input
            className="input-field"
            inputMode="text"
            onChange={(event) => setCode(event.target.value)}
            placeholder={t("shell.carePartner.inputLabel")}
            value={code}
          />
        </label>

        <button
          className="primary-action w-full"
          onClick={() => setSubmitted(true)}
          type="button"
        >
          {t("shell.carePartner.continue")}
        </button>

        {submitted && (
          <p aria-live="polite" className="text-center text-[length:var(--text-label)] text-[var(--muted-strong)]">
            {t("shell.carePartner.stubNote")}
          </p>
        )}

        <button className="link-action justify-self-center" onClick={onBack} type="button">
          {t("shell.carePartner.backToSignIn")}
        </button>
      </div>
    </>
  );
}
