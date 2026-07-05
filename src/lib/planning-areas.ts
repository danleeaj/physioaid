/**
 * Coarse, self-reported neighbourhood options for the optional research
 * contribution. Deliberately NOT GPS — the participant chooses (or skips)
 * their planning area themselves, and the Permissions-Policy header blocks
 * geolocation app-wide.
 */
export const PLANNING_AREAS = [
  "Ang Mo Kio",
  "Bedok",
  "Bukit Merah",
  "Hougang",
  "Jurong West",
  "Queenstown",
  "Tampines",
  "Toa Payoh",
  "Woodlands",
  "Yishun",
  "Other / prefer not to say",
] as const;

export const AREA_STORAGE_KEY = "physioaid.area";

export function saveChosenArea(area: string) {
  try {
    window.localStorage.setItem(AREA_STORAGE_KEY, area);
  } catch {
    // storage unavailable — personalisation simply stays off
  }
}

export function loadChosenArea(): string | undefined {
  try {
    return window.localStorage.getItem(AREA_STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}
