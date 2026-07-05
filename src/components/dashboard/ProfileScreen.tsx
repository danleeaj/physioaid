"use client";

import {
  Bell,
  ChevronRight,
  HeartHandshake,
  LogOut,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TextSizeControl } from "@/components/dashboard/TextSizeControl";
import { LangSwitch } from "@/components/i18n/LangSwitch";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { TopBar } from "@/components/layout/TopBar";
import { PLANNING_AREAS } from "@/lib/planning-areas";
import type { AgeGroup, UserProfile } from "@/lib/user-profile";
import type { MessageKey } from "@/lib/i18n/messages";

const ageGroupLabels: Record<AgeGroup, MessageKey> = {
  under60: "onboarding.age.under60",
  "60s": "onboarding.age.60s",
  "70s": "onboarding.age.70s",
  "80plus": "onboarding.age.80plus",
};

/** Profile secondary screen — the user's identity and display settings. */
export function ProfileScreen({
  profile,
  updateProfile,
  onBack,
  onOpenCarePartner,
  onOpenPrivacy,
  onSignOut,
}: {
  profile: UserProfile | null;
  updateProfile: (patch: Partial<UserProfile>) => void;
  onBack: () => void;
  onOpenCarePartner: () => void;
  onOpenPrivacy: () => void;
  onSignOut: () => void;
}) {
  const { t, lang } = useLanguage();
  const [reminders, setReminders] = useState(true);

  // Language changed via LangSwitch → write through to the profile so
  // preferred_language stays the single source of truth.
  const lastSyncedLang = useRef(lang);
  useEffect(() => {
    if (lang === lastSyncedLang.current) return;
    lastSyncedLang.current = lang;
    if (profile && profile.preferred_language !== lang) {
      updateProfile({ preferred_language: lang });
    }
    // profile/updateProfile identities churn per render; lang is the signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const initials = profile?.name
    ? profile.name
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const identityMeta = [
    profile?.ageGroup
      ? `${t("shell.profile.ageGroupLabel")}: ${t(ageGroupLabels[profile.ageGroup])}`
      : null,
    profile?.neighbourhood ?? null,
  ]
    .filter(Boolean)
    .join(" · ");

  const contactSet = Boolean(
    profile?.emergencyContact.name && profile?.emergencyContact.phone,
  );

  return (
    <>
      <TopBar onBack={onBack} title={t("shell.profile.title")} />
      <div className="app-content pb-[calc(20px+env(safe-area-inset-bottom))]">
        {/* Identity */}
        <section className="app-card app-card--hero flex items-center gap-3">
          <span aria-hidden className="avatar-dot h-14 w-14 text-lg">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[length:var(--text-lead)] font-bold">
              {profile?.name || "—"}
            </p>
            {identityMeta && (
              <p className="text-[length:var(--text-label)] text-[var(--muted)]">
                {identityMeta}
              </p>
            )}
          </div>
        </section>

        {/* Language — writes through to profile.preferred_language */}
        <section className="app-card grid gap-2">
          <p className="font-bold">{t("shell.profile.languageLabel")}</p>
          <LangSwitch />
        </section>

        {/* Text size */}
        <section className="app-card grid gap-2">
          <p className="font-bold">{t("shell.profile.textSizeLabel")}</p>
          <TextSizeControl onChange={(textSize) => updateProfile({ textSize })} />
        </section>

        {/* Neighbourhood — powers nearby suggestions */}
        <section className="app-card grid gap-2">
          <label className="grid gap-2">
            <span className="font-bold">{t("shell.profile.neighbourhood")}</span>
            <span className="sr-only flex items-center gap-1">
              <MapPin aria-hidden size={14} />
              {t("shell.profile.neighbourhood")}
            </span>
            <select
              className="input-field"
              onChange={(event) =>
                updateProfile({ neighbourhood: event.target.value || undefined })
              }
              value={profile?.neighbourhood ?? ""}
            >
              <option value="">—</option>
              {PLANNING_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>
        </section>

        {/* Support contact */}
        <div className="app-card flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent-warm-soft)] text-[var(--accent-warm)]">
            <HeartHandshake aria-hidden size={22} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">{t("shell.profile.supportContact")}</span>
            <span className="block truncate text-[length:var(--text-label)] text-[var(--muted)]">
              {contactSet
                ? `${profile?.emergencyContact.name} · ${profile?.emergencyContact.phone}`
                : t("shell.profile.carePartnerNone")}
            </span>
          </span>
        </div>

        {/* Care partner */}
        <button className="row-button" onClick={onOpenCarePartner} type="button">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent-warm-soft)] text-[var(--accent-warm)]">
            <HeartHandshake aria-hidden size={22} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">{t("shell.profile.carePartner")}</span>
            <span className="block text-[length:var(--text-label)] text-[var(--muted)]">
              {t("shell.profile.carePartnerNone")}
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
            <span className="block font-bold">{t("shell.profile.reminders")}</span>
            <span className="block text-[length:var(--text-label)] text-[var(--muted)]">
              {reminders ? t("shell.profile.remindersOn") : t("shell.profile.remindersOff")}
            </span>
          </span>
          <button
            aria-pressed={reminders}
            className="filter-chip"
            onClick={() => setReminders((value) => !value)}
            type="button"
          >
            {reminders ? t("shell.profile.on") : t("shell.profile.off")}
          </button>
        </div>

        {/* Privacy */}
        <button className="row-button" onClick={onOpenPrivacy} type="button">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--primary-dark)]">
            <ShieldCheck aria-hidden size={22} />
          </span>
          <span className="min-w-0 flex-1 font-bold">{t("shell.profile.privacy")}</span>
          <ChevronRight aria-hidden className="shrink-0 text-[var(--muted)]" size={20} />
        </button>

        <button className="secondary-action w-full" onClick={onSignOut} type="button">
          <LogOut aria-hidden size={20} />
          {t("shell.profile.signOut")}
        </button>
      </div>
    </>
  );
}
