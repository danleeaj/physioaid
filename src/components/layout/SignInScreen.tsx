"use client";

import { HeartHandshake, LogIn, Mail, Smartphone, UserRound } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { shellCopy } from "@/components/layout/copy";
import { PRODUCT_NAME } from "@/config/clinical-config";

// Build-time inlined: true when Firebase env config is present. When it is
// missing, Google sign-in cannot work, so it joins the coming-soon group.
const firebaseConfigured = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

function ComingSoonPill() {
  const { lang } = useLanguage();
  const copy = shellCopy[lang].signIn;
  return (
    <span className="ml-auto shrink-0 rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-[length:var(--text-caption)] font-bold text-[var(--muted)]">
      {copy.comingSoon}
    </span>
  );
}

/**
 * Signed-out entry screen. Live actions: "Continue with Google" (existing
 * Firebase auth via AuthProvider) and "Continue with Mr Tan demo". Mobile and
 * email sign-in are honest coming-soon stubs.
 */
export function SignInScreen({
  onDemo,
  onCarePartner,
}: {
  onDemo: () => void;
  onCarePartner: () => void;
}) {
  const { signInWithGoogle } = useAuth();
  const { lang } = useLanguage();
  const copy = shellCopy[lang].signIn;
  const [stubNote, setStubNote] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [googleError, setGoogleError] = useState(false);

  async function handleGoogle() {
    if (!firebaseConfigured) {
      setStubNote(true);
      return;
    }
    setGoogleError(false);
    setGooglePending(true);
    try {
      await signInWithGoogle();
      // Success needs no navigation here — onAuthStateChanged flips
      // useAuth().user and AppShell renders the signed-in app.
    } catch {
      setGoogleError(true);
    } finally {
      setGooglePending(false);
    }
  }

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

      <button
        className="primary-action w-full"
        disabled={googlePending}
        onClick={handleGoogle}
        type="button"
      >
        <LogIn aria-hidden size={22} />
        {googlePending ? copy.signingIn : copy.continueGoogle}
        {!firebaseConfigured && <ComingSoonPill />}
      </button>

      {googleError && (
        <p
          aria-live="assertive"
          className="text-center text-[length:var(--text-label)] text-[var(--danger)]"
          role="alert"
        >
          {copy.googleError}
        </p>
      )}

      <button
        className="secondary-action w-full"
        onClick={() => setStubNote(true)}
        type="button"
      >
        <Smartphone aria-hidden size={22} />
        {copy.continueMobile}
        <ComingSoonPill />
      </button>
      <button
        className="secondary-action w-full"
        onClick={() => setStubNote(true)}
        type="button"
      >
        <Mail aria-hidden size={22} />
        {copy.continueEmail}
        <ComingSoonPill />
      </button>
      <button className="secondary-action w-full" onClick={() => setStubNote(true)} type="button">
        <HeartHandshake aria-hidden size={22} />
        {copy.carePartner}
        <ComingSoonPill />
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
