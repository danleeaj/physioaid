"use client";

import {
  Bell,
  ChevronRight,
  HeartHandshake,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { useUserProfile } from "@/components/auth/UserProfileProvider";
import { shellCopy } from "@/components/layout/copy";
import { TopBar } from "@/components/layout/TopBar";
import { LangSwitch } from "@/components/i18n/LangSwitch";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { loadStoredTextSize } from "@/lib/preferences";
import type { TextSize } from "@/types/profile";

/** Profile secondary screen — session identity, display settings, sign out. */
export function ProfileScreen({
  onBack,
  onOpenCarePartner,
  onOpenPrivacy,
  onSignOut,
}: {
  onBack: () => void;
  onOpenCarePartner: () => void;
  onOpenPrivacy: () => void;
  onSignOut: () => void;
}) {
  const { profile, setTextSize: applyProfileTextSize } = useUserProfile();
  const { lang } = useLanguage();
  const copy = shellCopy[lang].profile;
  const [textSize, setTextSize] = useState<TextSize>(
    () => profile?.textSize ?? loadStoredTextSize(),
  );
  const [reminders, setReminders] = useState(true);

  const textSizes: { id: TextSize; label: string }[] = [
    { id: "standard", label: copy.textSizeOptions.standard },
    { id: "large", label: copy.textSizeOptions.large },
    { id: "xl", label: copy.textSizeOptions.xl },
  ];

  function selectTextSize(size: TextSize) {
    setTextSize(size);
    applyProfileTextSize(size);
  }

  // Identity comes from the active profile — neutral treatment when the
  // profile has no name yet (fresh Firebase accounts), never a demo persona.
  const displayName = profile?.displayName.trim() ?? "";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("");
  const identityMeta = [
    profile?.ageGroup ? copy.ageGroupPrefix(profile.ageGroup) : null,
    profile?.heightCm ? `${profile.heightCm} cm` : null,
    profile?.planningArea ?? null,
  ].filter((segment): segment is string => segment !== null);

  return (
    <>
      <TopBar onBack={onBack} title={copy.title} />
      <div className="app-content pb-[calc(20px+env(safe-area-inset-bottom))]">
        {/* Identity */}
        <section className="app-card app-card--hero flex items-center gap-3">
          <span aria-hidden className="avatar-dot h-14 w-14 text-lg">
            {initials || <UserRound aria-hidden size={24} />}
          </span>
          <div>
            <p className="text-[length:var(--text-lead)] font-bold">
              {displayName || copy.yourProfileFallback}
            </p>
            {identityMeta.length > 0 && (
              <p className="text-[length:var(--text-label)] text-[var(--muted)]">
                {identityMeta.join(" · ")}
              </p>
            )}
          </div>
        </section>

        {/* Language */}
        <section className="app-card grid gap-2">
          <p className="font-bold">{copy.languageLabel}</p>
          <LangSwitch />
        </section>

        {/* Text size */}
        <section className="app-card grid gap-2">
          <p className="font-bold">{copy.textSizeLabel}</p>
          <div className="segmented" role="group" aria-label={copy.textSizeLabel}>
            {textSizes.map((size) => (
              <button
                aria-pressed={textSize === size.id}
                key={size.id}
                onClick={() => selectTextSize(size.id)}
                type="button"
              >
                {size.label}
              </button>
            ))}
          </div>
        </section>

        {/* Care partner */}
        <button className="row-button" onClick={onOpenCarePartner} type="button">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent-warm-soft)] text-[var(--accent-warm)]">
            <HeartHandshake aria-hidden size={22} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">{copy.carePartnerLabel}</span>
            <span className="block text-[length:var(--text-label)] text-[var(--muted)]">
              {profile?.supportContact?.name ?? copy.notConnected}
            </span>
          </span>
          <ChevronRight aria-hidden className="shrink-0 text-[var(--muted)]" size={20} />
        </button>

        {/* Reminders */}
        <div className="app-card flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--primary-dark)]">
            <Bell aria-hidden size={22} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">{copy.remindersLabel}</span>
            <span className="block text-[length:var(--text-label)] text-[var(--muted)]">
              {reminders ? copy.weeklyReminderOn : copy.remindersOff}
            </span>
          </span>
          <button
            aria-pressed={reminders}
            className="filter-chip"
            onClick={() => setReminders((value) => !value)}
            type="button"
          >
            {reminders ? copy.on : copy.off}
          </button>
        </div>

        {/* Privacy */}
        <button className="row-button" onClick={onOpenPrivacy} type="button">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--primary-dark)]">
            <ShieldCheck aria-hidden size={22} />
          </span>
          <span className="min-w-0 flex-1 font-bold">{copy.privacyLabel}</span>
          <ChevronRight aria-hidden className="shrink-0 text-[var(--muted)]" size={20} />
        </button>

        <button className="secondary-action w-full" onClick={onSignOut} type="button">
          <LogOut aria-hidden size={20} />
          {copy.signOut}
        </button>
      </div>
    </>
  );
}
