"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";

const NOTE: Record<string, string> = {
  zh: "翻译为演示草稿，以英文原文为准。",
  ms: "Terjemahan ini adalah draf demonstrasi; teks Bahasa Inggeris adalah muktamad.",
  ta: "இந்த மொழிபெயர்ப்புகள் மாதிரி வரைவுகள்; ஆங்கில உரையே அதிகாரப்பூர்வமானது.",
};

/**
 * Shown on screens carrying clinical copy when a non-English language is
 * active: translations are demonstration drafts, English is authoritative.
 */
export function DraftTranslationNote() {
  const { lang } = useLanguage();

  if (lang === "en") {
    return null;
  }

  return (
    <p className="text-sm text-[var(--muted)]">
      {NOTE[lang]}{" "}
      <span lang="en">Translations are demonstration drafts; the English
      wording is authoritative.</span>
    </p>
  );
}
