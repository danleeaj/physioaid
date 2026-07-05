"use client";

import { Square, Volume2 } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";

/**
 * Read-aloud control. Pass the exact text to speak (already in the active
 * language) — keep it to a headline plus a sentence or two, as some browsers
 * cut off long utterances.
 */
export function ListenButton({ text }: { text: string }) {
  const { t, speak, stopSpeaking, isSpeaking } = useLanguage();

  return (
    <button
      className="listen-button"
      data-speaking={isSpeaking}
      onClick={() => (isSpeaking ? stopSpeaking() : speak(text))}
      type="button"
    >
      {isSpeaking ? (
        <Square aria-hidden fill="currentColor" size={14} />
      ) : (
        <Volume2 aria-hidden size={18} />
      )}
      {isSpeaking ? t("listen.stop") : t("listen.label")}
    </button>
  );
}
