"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getMessage, type MessageKey } from "@/lib/i18n/messages";
import {
  isLanguage,
  LANGUAGE_STORAGE_KEY,
  SPEECH_LOCALES,
  type Language,
} from "@/lib/i18n/types";

type LanguageContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

function pickVoice(locale: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang === locale) ??
    voices.find((voice) => voice.lang.startsWith(locale.split("-")[0]))
  );
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Read the persisted choice after hydration; SSR always renders English.
  useEffect(() => {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isLanguage(stored)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time post-hydration sync from localStorage
      setLangState(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    document.documentElement.lang = next;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) =>
      getMessage(lang, key, vars),
    [lang],
  );

  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window) || !text.trim()) {
        return;
      }
      window.speechSynthesis.cancel();
      const locale = SPEECH_LOCALES[lang];
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = locale;
      const voice = pickVoice(locale);
      if (voice) {
        utterance.voice = voice;
      }
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [lang],
  );

  const value = useMemo(
    () => ({ lang, setLang, t, speak, stopSpeaking, isSpeaking }),
    [lang, setLang, t, speak, stopSpeaking, isSpeaking],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside <LanguageProvider>");
  }
  return context;
}
