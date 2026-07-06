import type { TextSize } from "@/types/profile";

/**
 * Text-size preference — moved out of ProfileScreen (Goal 3) so the
 * onboarding About You step, ProfileScreen, AppShell startup, and
 * UserProfileProvider all share one implementation instead of three copies.
 */
export const TEXT_SIZE_KEY = "physioaid.text-size";

/** Applies the chosen size to the document root. SSR-safe no-op. */
export function applyTextSize(size: TextSize) {
  if (typeof document === "undefined") return;
  if (size === "standard") {
    delete document.documentElement.dataset.textSize;
  } else {
    document.documentElement.dataset.textSize = size;
  }
}

/** Reads the persisted size, defaulting to "standard". SSR-safe. */
export function loadStoredTextSize(): TextSize {
  if (typeof window === "undefined") return "standard";
  try {
    const stored = window.localStorage.getItem(TEXT_SIZE_KEY);
    return stored === "large" || stored === "xl" || stored === "standard"
      ? stored
      : "standard";
  } catch {
    return "standard";
  }
}

/** Writes the size to localStorage — always, regardless of session kind. */
export function persistTextSize(size: TextSize) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TEXT_SIZE_KEY, size);
  } catch {
    // Preference stays for this session only.
  }
}

/**
 * AppShell's startup call: reads whatever is in localStorage and applies it
 * immediately, before the profile (if any) has loaded. Signed-out/demo users
 * have no other source of truth; firebase users get this as an instant
 * warm-start that UserProfileProvider then reconciles against the profile.
 */
export function loadTextSizePreference(): void {
  if (typeof window === "undefined") return;
  const stored = loadStoredTextSize();
  if (stored !== "standard") {
    applyTextSize(stored);
  }
}
