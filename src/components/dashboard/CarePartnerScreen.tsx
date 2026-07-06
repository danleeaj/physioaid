"use client";

import { Copy, HeartHandshake, MessageCircle, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { shellCopy } from "@/components/layout/copy";
import { TopBar } from "@/components/layout/TopBar";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserProfile } from "@/components/auth/UserProfileProvider";
import {
  createInvite,
  getInviteByOwner,
  getInviteByCode,
  buildWhatsAppLink,
  type CarePartnerInvite,
} from "@/lib/care-partner";

export function CarePartnerScreen({ onBack }: { onBack: () => void }) {
  const { lang } = useLanguage();
  const copy = shellCopy[lang].carePartner;
  const { user } = useAuth();
  const { profile } = useUserProfile();

  if (user && profile) {
    return (
      <InviteView
        copy={copy}
        onBack={onBack}
        ownerName={profile.displayName || ""}
        ownerPhone={profile.supportContact?.phone || ""}
        uid={user.uid}
      />
    );
  }

  return <AccessView copy={copy} onBack={onBack} />;
}

function InviteView({
  copy,
  onBack,
  uid,
  ownerName,
  ownerPhone,
}: {
  copy: ReturnType<() => typeof shellCopy.en.carePartner>;
  onBack: () => void;
  uid: string;
  ownerName: string;
  ownerPhone: string;
}) {
  const [invite, setInvite] = useState<CarePartnerInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getInviteByOwner(uid)
      .then(setInvite)
      .finally(() => setLoading(false));
  }, [uid]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const created = await createInvite(uid, ownerName, ownerPhone);
      setInvite(created);
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy() {
    if (!invite) return;
    navigator.clipboard.writeText(invite.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleWhatsApp() {
    if (!invite) return;
    window.open(buildWhatsAppLink(invite.code, ownerName), "_blank");
  }

  return (
    <>
      <TopBar onBack={onBack} title={copy.inviteTitle} />
      <div className="app-content pb-[calc(20px+env(safe-area-inset-bottom))]">
        <div
          aria-hidden
          className="mx-auto flex h-32 w-full items-center justify-center rounded-[var(--radius-card)] bg-[var(--accent-warm-soft)]"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--accent-warm)]">
            <HeartHandshake size={32} />
          </span>
        </div>

        <p className="text-[var(--muted)]">{copy.inviteBody}</p>

        {loading ? (
          <p className="text-center text-[length:var(--text-label)] text-[var(--muted)]">…</p>
        ) : invite ? (
          <div className="grid gap-4">
            <div className="app-card grid gap-2 text-center">
              <p className="text-[length:var(--text-label)] text-[var(--muted)]">
                {copy.yourCode}
              </p>
              <p className="font-mono text-3xl font-bold tracking-widest">
                {invite.code}
              </p>
            </div>

            <button
              className="primary-action flex w-full items-center justify-center gap-2"
              onClick={handleWhatsApp}
              type="button"
            >
              <MessageCircle aria-hidden size={20} />
              {copy.shareWhatsApp}
            </button>

            <button
              className="secondary-action flex w-full items-center justify-center gap-2"
              onClick={handleCopy}
              type="button"
            >
              {copied ? <Check aria-hidden size={18} /> : <Copy aria-hidden size={18} />}
              {copied ? copy.copied : copy.copyCode}
            </button>
          </div>
        ) : (
          <button
            className="primary-action w-full"
            disabled={generating}
            onClick={handleGenerate}
            type="button"
          >
            {generating ? copy.generating : copy.generateCode}
          </button>
        )}
      </div>
    </>
  );
}

function AccessView({
  copy,
  onBack,
}: {
  copy: ReturnType<() => typeof shellCopy.en.carePartner>;
  onBack: () => void;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [invite, setInvite] = useState<CarePartnerInvite | null>(null);

  async function handleLookup() {
    if (!code.trim()) return;
    setLoading(true);
    setError(false);
    try {
      const found = await getInviteByCode(code);
      if (found) {
        setInvite(found);
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  }

  if (invite) {
    return (
      <>
        <TopBar onBack={() => setInvite(null)} title={copy.title} />
        <div className="app-content pb-[calc(20px+env(safe-area-inset-bottom))]">
          <div
            aria-hidden
            className="mx-auto flex h-32 w-full items-center justify-center rounded-[var(--radius-card)] bg-[var(--accent-warm-soft)]"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--accent-warm)]">
              <HeartHandshake size={32} />
            </span>
          </div>

          <p className="text-center text-[length:var(--text-lead)] font-bold">
            {copy.carePartnerFor(invite.ownerName || "—")}
          </p>

          {invite.latestSummary ? (
            <div className="app-card grid gap-3">
              <p className="font-bold">{copy.summaryTitle}</p>
              <div className="grid gap-2 text-[length:var(--text-body)]">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">{copy.summaryDate}</span>
                  <span>{new Date(invite.latestSummary.date).toLocaleDateString()}</span>
                </div>
                {invite.latestSummary.riskCategory && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">{copy.summaryRisk}</span>
                    <span className="capitalize">{invite.latestSummary.riskCategory}</span>
                  </div>
                )}
                {invite.latestSummary.overallScore && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">{copy.summaryScore}</span>
                    <span>{invite.latestSummary.overallScore}</span>
                  </div>
                )}
                {invite.latestSummary.completedTests.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">{copy.summaryTests}</span>
                    <span>{invite.latestSummary.completedTests.length}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-[length:var(--text-label)] text-[var(--muted)]">
              {copy.noSummary}
            </p>
          )}

          <button className="secondary-action w-full" onClick={onBack} type="button">
            {copy.backToHome}
          </button>
        </div>
      </>
    );
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
          <span className="font-bold">{copy.inputPlaceholder}</span>
          <input
            className="input-field"
            inputMode="text"
            onChange={(event) => {
              setCode(event.target.value);
              setError(false);
            }}
            placeholder={copy.inputPlaceholder}
            value={code}
          />
        </label>

        {error && (
          <p
            aria-live="polite"
            className="text-[length:var(--text-label)] text-[var(--danger)]"
          >
            {copy.lookupError}
          </p>
        )}

        <button
          className="primary-action w-full"
          disabled={loading || !code.trim()}
          onClick={handleLookup}
          type="button"
        >
          {loading ? copy.lookupLoading : copy.continue}
        </button>

        <button className="link-action justify-self-center" onClick={onBack} type="button">
          {copy.backToSignIn}
        </button>
      </div>
    </>
  );
}
