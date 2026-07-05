"use client";

import { HeartHandshake, Mail, Smartphone, UserRound } from "lucide-react";
import { useState } from "react";
import { shellCopy } from "@/components/layout/copy";
import { PRODUCT_NAME } from "@/config/clinical-config";

const copy = shellCopy.signIn;

/**
 * Signed-out entry screen. Only "Continue with Mr Tan demo" is live in this
 * pass — mobile/email sign-in are polished stubs (real Firebase auth stays
 * wired elsewhere and untouched).
 */
export function SignInScreen({
  onDemo,
  onCarePartner,
}: {
  onDemo: () => void;
  onCarePartner: () => void;
}) {
  const [stubNote, setStubNote] = useState(false);

  return (
    <div className="app-content min-h-dvh justify-center pb-[calc(20px+env(safe-area-inset-bottom))] pt-10">
      <p className="eyebrow text-center">{PRODUCT_NAME}</p>
      <h1 className="text-center text-[length:var(--text-display)] font-bold">
        {copy.headline}
      </h1>
      <p className="text-center text-[var(--muted)]">{copy.supporting}</p>

      {/* Warm hero placeholder — a safe mobility/care scene */}
      <div
        aria-hidden
        className="mx-auto my-2 flex h-40 w-full items-center justify-center rounded-[var(--radius-card)] bg-[var(--accent-warm-soft)]"
      >
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--accent-warm)]">
          <HeartHandshake size={40} />
        </span>
      </div>

      <button className="primary-action w-full" onClick={() => setStubNote(true)} type="button">
        <Smartphone aria-hidden size={22} />
        {copy.continueMobile}
      </button>
      <button className="secondary-action w-full" onClick={() => setStubNote(true)} type="button">
        <Mail aria-hidden size={22} />
        {copy.continueEmail}
      </button>
      <button className="secondary-action w-full" onClick={onCarePartner} type="button">
        <HeartHandshake aria-hidden size={22} />
        {copy.carePartner}
      </button>
      <button className="secondary-action w-full" onClick={onDemo} type="button">
        <UserRound aria-hidden size={22} />
        {copy.demo}
      </button>

      {stubNote && (
        <p aria-live="polite" className="text-center text-[length:var(--text-label)] text-[var(--muted-strong)]">
          {copy.stubNote}
        </p>
      )}

      <p className="text-center text-[length:var(--text-label)] text-[var(--muted)]">
        {copy.privacy}
      </p>
    </div>
  );
}
