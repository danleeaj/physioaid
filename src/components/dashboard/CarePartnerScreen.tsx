"use client";

import { HeartHandshake } from "lucide-react";
import { useState } from "react";
import { shellCopy } from "@/components/layout/copy";
import { TopBar } from "@/components/layout/TopBar";
import { useLanguage } from "@/components/i18n/LanguageProvider";

/** Care partner access — polished placeholder, no account system yet. */
export function CarePartnerScreen({ onBack }: { onBack: () => void }) {
  const { lang } = useLanguage();
  const copy = shellCopy[lang].carePartner;
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <TopBar onBack={onBack} title={copy.title} />
      <div className="app-content pb-[calc(20px+env(safe-area-inset-bottom))]">
        <div
          aria-hidden
          className="mx-auto flex h-32 w-full items-center justify-center rounded-[var(--radius-card)] bg-[var(--accent-warm-soft)]"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--accent-warm)]">
            <HeartHandshake size={32} />
          </span>
        </div>

        <p className="text-[var(--muted)]">{copy.body}</p>

        <label className="grid gap-2">
          <span className="font-bold">Mobile number or invite code</span>
          <input
            className="input-field"
            inputMode="text"
            onChange={(event) => setCode(event.target.value)}
            placeholder={copy.inputPlaceholder}
            value={code}
          />
        </label>

        <button
          className="primary-action w-full"
          onClick={() => setSubmitted(true)}
          type="button"
        >
          {copy.continue}
        </button>

        {submitted && (
          <p aria-live="polite" className="text-center text-[length:var(--text-label)] text-[var(--muted-strong)]">
            {copy.stubNote}
          </p>
        )}

        <button className="link-action justify-self-center" onClick={onBack} type="button">
          {copy.backToSignIn}
        </button>
      </div>
    </>
  );
}
