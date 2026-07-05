export type Language = "en" | "zh" | "ms" | "ta";

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "ms", label: "Melayu" },
  { code: "ta", label: "தமிழ்" },
];

/** BCP-47 codes used for the Web Speech API read-aloud voices. */
export const SPEECH_LOCALES: Record<Language, string> = {
  en: "en-SG",
  zh: "zh-CN",
  ms: "ms-MY",
  ta: "ta-IN",
};

export const LANGUAGE_STORAGE_KEY = "physioaid.lang";

export function isLanguage(value: string | null): value is Language {
  return value === "en" || value === "zh" || value === "ms" || value === "ta";
}
