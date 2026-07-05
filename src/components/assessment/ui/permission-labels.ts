/** Friendly, honest wording for sensor permission states shown in status pills. */
export function permissionLabel(
  state:
    | "unknown"
    | "not_supported"
    | "prompt_required"
    | "granted"
    | "denied"
    | undefined,
): string {
  switch (state) {
    case "granted":
      return "ready";
    case "prompt_required":
      return "tap to enable";
    case "denied":
      return "not allowed";
    case "not_supported":
      return "unavailable";
    default:
      return "checking";
  }
}
