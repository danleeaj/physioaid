"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import { LANGUAGES } from "@/lib/i18n/types";

export function LangSwitch() {
  const { lang, setLang } = useLanguage();

  return (
    <div aria-label="Language" className="lang-switch" role="group">
      {LANGUAGES.map((option) => (
        <button
          aria-pressed={lang === option.code}
          data-active={lang === option.code}
          key={option.code}
          lang={option.code}
          onClick={() => setLang(option.code)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
