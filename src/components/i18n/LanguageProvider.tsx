"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useUserProfile } from "@/components/auth/UserProfileProvider";
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
  const { sessionKind, uid, profile, profileLoading, updateProfile } =
    useUserProfile();

  // Read the persisted choice after hydration; SSR always renders English.
  useEffect(() => {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isLanguage(stored)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time post-hydration sync from localStorage
      setLangState(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  // Once a firebase/demo profile resolves, the profile's language is
  // authoritative — this effect is declared after the localStorage-read
  // effect above so it wins when both fire in the same commit (demo, whose
  // profile is available synchronously). Ref-guarded to run once per uid
  // (once for demo) so it never fights a change made later in this session.
  // Keyed on the scalar `preferredLanguage`, not the profile object, which
  // gets a new identity on every updateProfile.
  const appliedProfileLangRef = useRef<string | null>(null);
  const profilePreferredLanguage = profile?.preferredLanguage ?? null;

  const applyProfileLanguage = useCallback((next: Language) => {
    setLangState(next);
    document.documentElement.lang = next;
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    } catch {
      // Preference stays for this session only.
    }
  }, []);

  useEffect(() => {
    if (sessionKind === "firebase") {
      if (profileLoading || !uid || profilePreferredLanguage === null) return;
      const key = `firebase:${uid}`;
      if (appliedProfileLangRef.current === key) return;
      appliedProfileLangRef.current = key;
      applyProfileLanguage(profilePreferredLanguage);
    } else if (sessionKind === "demo") {
      if (profilePreferredLanguage === null) return;
      if (appliedProfileLangRef.current === "demo") return;
      appliedProfileLangRef.current = "demo";
      applyProfileLanguage(profilePreferredLanguage);
    }
  }, [sessionKind, uid, profileLoading, profilePreferredLanguage, applyProfileLanguage]);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const setLang = useCallback(
    (next: Language) => {
      setLangState(next);
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
      document.documentElement.lang = next;
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      if (sessionKind === "firebase" || sessionKind === "demo") {
        // Fire-and-forget — localStorage above is already the source of
        // truth for this device; the profile write keeps other
        // devices/tabs and the onboarding-seeded doc in sync.
        void updateProfile({ preferredLanguage: next }).catch(() => {});
      }
    },
    [sessionKind, updateProfile],
  );

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
