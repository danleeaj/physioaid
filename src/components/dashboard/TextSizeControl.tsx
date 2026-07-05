"use client";

import { useState } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import type { TextSizePref } from "@/lib/user-profile";

const TEXT_SIZE_KEY = "physioaid.text-size";

function applyTextSize(size: TextSizePref) {
  if (size === "standard") {
    delete document.documentElement.dataset.textSize;
  } else {
    document.documentElement.dataset.textSize = size;
  }
}

export function readTextSizePreference(): TextSizePref {
  if (typeof window === "undefined") return "standard";
  const stored = window.localStorage.getItem(TEXT_SIZE_KEY) as TextSizePref | null;
  return stored === "large" || stored === "xl" ? stored : "standard";
}

/** Apply the stored preference on app start (called from AppShell). */
export function loadTextSizePreference() {
  const stored = readTextSizePreference();
  if (stored !== "standard") {
    applyTextSize(stored);
  }
}

/** Persist + apply a text-size preference (device-local part). */
export function setTextSizePreference(size: TextSizePref) {
  applyTextSize(size);
  try {
    window.localStorage.setItem(TEXT_SIZE_KEY, size);
  } catch {
    // Preference stays for this session only.
  }
}

/**
 * Segmented text-size selector — the whole rem-based type scale follows.
 * Used by Profile and onboarding; `onChange` lets callers also persist the
 * choice to the user profile.
 */
export function TextSizeControl({
  onChange,
}: {
  onChange?: (size: TextSizePref) => void;
}) {
  const { t } = useLanguage();
  const [textSize, setTextSize] = useState<TextSizePref>(readTextSizePreference);

  const sizes: { id: TextSizePref; label: string }[] = [
    { id: "standard", label: t("shell.profile.textStandard") },
    { id: "large", label: t("shell.profile.textLarge") },
    { id: "xl", label: t("shell.profile.textXL") },
  ];

  function select(size: TextSizePref) {
    setTextSize(size);
    setTextSizePreference(size);
    onChange?.(size);
  }

  return (
    <div className="segmented" role="group" aria-label={t("shell.profile.textSizeLabel")}>
      {sizes.map((size) => (
        <button
          aria-pressed={textSize === size.id}
          key={size.id}
          onClick={() => select(size.id)}
          type="button"
        >
          {size.label}
        </button>
      ))}
    </div>
  );
}
