"use client";

import { useState } from "react";
import { TextField } from "@/components/assessment/ui/Fields";
import { LangSwitch } from "@/components/i18n/LangSwitch";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { shellCopy } from "@/components/layout/copy";
import { PLANNING_AREAS } from "@/lib/planning-areas";
import type { AgeGroup, TextSize, UserProfile } from "@/types/profile";

const copy = shellCopy.onboarding;

/** Same key ProfileScreen uses — Goal 3 centralizes this in lib/preferences. */
const TEXT_SIZE_KEY = "physioaid.text-size";

export const AGE_GROUP_OPTIONS: { id: AgeGroup; label: string }[] = [
  { id: "under60", label: "Under 60" },
  { id: "60s", label: "60s" },
  { id: "70s", label: "70s" },
  { id: "80s", label: "80s" },
  { id: "90plus", label: "90+" },
];

const TEXT_SIZE_OPTIONS: { id: TextSize; label: string }[] = [
  { id: "standard", label: "Standard" },
  { id: "large", label: "Large" },
  { id: "xl", label: "Extra large" },
];

export type AboutYouFields = Pick<
  UserProfile,
  | "displayName"
  | "ageGroup"
  | "livingSituation"
  | "planningArea"
  | "preferredLanguage"
  | "textSize"
>;

/** Live-apply text size while choosing (same approach as ProfileScreen). */
function applyTextSize(size: TextSize) {
  if (size === "standard") {
    delete document.documentElement.dataset.textSize;
  } else {
    document.documentElement.dataset.textSize = size;
  }
}

/**
 * Identity + display preferences. Prefilled from the active profile (auth
 * display name for new accounts, the saved doc when resuming) and the
 * device's stored text size. Everything is optional.
 */
export function AboutYouStep({
  profile,
  onBack,
  onContinue,
}: {
  profile: UserProfile | null;
  onBack: () => void;
  onContinue: (fields: AboutYouFields) => void;
}) {
  const { lang } = useLanguage();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(
    profile?.ageGroup ?? null,
  );
  const [livingSituation, setLivingSituation] = useState(
    profile?.livingSituation ?? "",
  );
  const [planningArea, setPlanningArea] = useState<string | null>(
    profile?.planningArea ?? null,
  );
  // Device preference wins (a seeded doc equals it anyway); the profile value
  // covers a doc created on another device. SSR-safe lazy initializer.
  const [textSize, setTextSize] = useState<TextSize>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem(TEXT_SIZE_KEY);
        if (stored === "standard" || stored === "large" || stored === "xl") {
          return stored;
        }
      } catch {
        // Storage unavailable — fall through to the profile value.
      }
    }
    return profile?.textSize ?? "standard";
  });

  function selectTextSize(size: TextSize) {
    setTextSize(size);
    applyTextSize(size);
    try {
      window.localStorage.setItem(TEXT_SIZE_KEY, size);
    } catch {
      // Preference stays for this session only.
    }
  }

  return (
    <section className="grid gap-4">
      <div className="grid gap-1">
        <h1 className="text-[length:var(--text-display)] font-bold">
          {copy.aboutYou.title}
        </h1>
        <p className="text-[var(--muted)]">{copy.aboutYou.support}</p>
      </div>

      <TextField
        label={copy.aboutYou.nameLabel}
        onChange={setDisplayName}
        value={displayName}
      />

      <div className="grid gap-2">
        <p className="text-[length:var(--text-label)] font-bold">
          {copy.aboutYou.ageLabel}
        </p>
        <div aria-label={copy.aboutYou.ageLabel} className="segmented" role="group">
          {AGE_GROUP_OPTIONS.map((option) => (
            <button
              aria-pressed={ageGroup === option.id}
              key={option.id}
              onClick={() =>
                setAgeGroup((current) =>
                  current === option.id ? null : option.id,
                )
              }
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <TextField
        label={copy.aboutYou.livingLabel}
        onChange={setLivingSituation}
        value={livingSituation}
      />

      <label className="grid gap-2">
        <span className="text-[length:var(--text-label)] font-bold">
          {copy.aboutYou.areaLabel}
        </span>
        <span className="text-[length:var(--text-label)] text-[var(--muted)]">
          {copy.aboutYou.areaHelp}
        </span>
        <select
          className="input-field"
          onChange={(event) => setPlanningArea(event.target.value || null)}
          value={planningArea ?? ""}
        >
          <option value="">{copy.aboutYou.areaNone}</option>
          {PLANNING_AREAS.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-2">
        <p className="text-[length:var(--text-label)] font-bold">
          {copy.aboutYou.languageLabel}
        </p>
        {/* Self-managed via LanguageProvider; the chosen language is also
            captured into the profile patch on Continue. */}
        <LangSwitch />
      </div>

      <div className="grid gap-2">
        <p className="text-[length:var(--text-label)] font-bold">
          {copy.aboutYou.textSizeLabel}
        </p>
        <div
          aria-label={copy.aboutYou.textSizeLabel}
          className="segmented"
          role="group"
        >
          {TEXT_SIZE_OPTIONS.map((option) => (
            <button
              aria-pressed={textSize === option.id}
              key={option.id}
              onClick={() => selectTextSize(option.id)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 pt-2">
        <button
          className="primary-action w-full"
          onClick={() =>
            onContinue({
              displayName: displayName.trim(),
              ageGroup,
              livingSituation: livingSituation.trim(),
              planningArea,
              preferredLanguage: lang,
              textSize,
            })
          }
          type="button"
        >
          {copy.continueLabel}
        </button>
        <button className="link-action" onClick={onBack} type="button">
          {copy.back}
        </button>
      </div>
    </section>
  );
}
