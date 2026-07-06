"use client";

import { HeartHandshake, MessageCircle } from "lucide-react";
import { useState } from "react";
import { shellCopy } from "@/components/layout/copy";
import { TopBar } from "@/components/layout/TopBar";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserProfile } from "@/components/auth/UserProfileProvider";
import { buildWhatsAppLink } from "@/lib/care-partner";

export function CarePartnerScreen({ onBack }: { onBack: () => void }) {
  const { lang } = useLanguage();
  const copy = shellCopy[lang].carePartner;
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const prefillPhone = profile?.supportContact?.phone ?? "";
  const ownerName = profile?.displayName ?? "";
  const signedIn = !!(user && profile);

  const [phone, setPhone] = useState(prefillPhone);
  const [sent, setSent] = useState(false);

  function normalizePhone(raw: string): string {
    const digits = raw.replace(/[^\d+]/g, "");
    if (digits.startsWith("+")) return digits;
    if (digits.startsWith("65")) return `+${digits}`;
    if (digits.length === 8) return `+65${digits}`;
    return digits;
  }

  function handleSend() {
    const normalized = normalizePhone(phone);
    if (!normalized) return;
    window.open(buildWhatsAppLink(normalized, ownerName), "_blank");
    setSent(true);
  }

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
          <span className="font-bold">{copy.phoneLabel}</span>
          <input
            className="input-field"
            inputMode="tel"
            onChange={(e) => {
              setPhone(e.target.value);
              setSent(false);
            }}
            placeholder={copy.phonePlaceholder}
            type="tel"
            value={phone}
          />
        </label>

        <button
          className="primary-action flex w-full items-center justify-center gap-2"
          disabled={!phone.trim()}
          onClick={handleSend}
          type="button"
        >
          <MessageCircle aria-hidden size={20} />
          {copy.shareWhatsApp}
        </button>

        {sent && (
          <p
            aria-live="polite"
            className="text-center text-[length:var(--text-label)] text-[var(--muted-strong)]"
          >
            {copy.sent}
          </p>
        )}

        {!signedIn && (
          <button
            className="link-action justify-self-center"
            onClick={onBack}
            type="button"
          >
            {copy.backToSignIn}
          </button>
        )}
      </div>
    </>
  );
}
