/**
 * English copy for the app-shell screens introduced by the PWA redesign.
 *
 * Deviation note (see AGENTS.md): the shared i18n catalogue
 * `src/lib/i18n/messages.ts` is outside this branch's allowed files, so
 * new-shell copy is English-only for v1 and lives here. The guided
 * assessment step screens keep their full i18n via `t()`. Folding these
 * strings into messages.ts is a flagged additive follow-up.
 */
export const shellCopy = {
  signIn: {
    headline: "Move with more confidence.",
    supporting: "Simple mobility checks, progress history, and nearby support.",
    continueGoogle: "Continue with Google",
    signingIn: "Signing in…",
    googleError:
      "Google sign-in didn’t complete. You can try again or explore with the Mr Tan demo.",
    continueMobile: "Continue with mobile number",
    continueEmail: "Continue with email",
    comingSoon: "Coming soon",
    carePartner: "Care partner sign in",
    demo: "Continue with Mr Tan demo",
    privacy: "Your assessment records stay private and secure.",
    stubNote:
      "Mobile and email sign-in are coming soon. Use the Mr Tan demo to explore the app.",
  },
  tabs: {
    assessment: "Assessment",
    community: "Community",
    resources: "Resources",
  },
  home: {
    todayTitle: "Today’s mobility check",
    todayDuration: "Takes about 4 minutes",
    startAssessment: "Start assessment",
    lastResultTitle: "Last result",
    nextStepTitle: "Recommended next step",
    nextStepBody: "Try 8-minute balance practice",
    openExercise: "Open exercise",
    historyTitle: "Recent checks",
    viewAllHistory: "View all history",
    reassurance: "There are no wrong answers.",
  },
  flow: {
    stage: (current: number, total: number) => `Stage ${current} of ${total}`,
    exit: "Exit",
    exitTitle: "Leave this check?",
    exitBody:
      "Your answers so far will not be saved. You can start again any time.",
    exitConfirm: "Leave check",
    exitCancel: "Keep going",
    loadSample: "Load sample answers (Mr Tan)",
    sampleLoaded: "Sample answers loaded — you can change any of them.",
  },
  result: {
    title: "Assessment complete",
    saveToHistory: "Save to history",
    savedOnDevice: "Saved on this device",
    openReport: "Open clinician report (print / PDF)",
    viewResources: "View resources",
    backToAssessment: "Back to Assessment",
  },
  history: {
    title: "Assessment History",
    viewDetails: "View details",
    detailTitle: "Assessment detail",
    samplePill: "Sample",
    sampleTrend: "Sample history — Mr Tan demo",
    empty: "No saved checks yet. Complete today’s mobility check to start your journal.",
  },
  community: {
    title: "Community",
  },
  resources: {
    title: "Resources",
    searchPlaceholder: "Search nearby support",
  },
  profile: {
    title: "Profile",
    signOut: "Sign out",
  },
  carePartner: {
    title: "Care partner access",
    body: "Help a family member review assessment summaries and nearby support.",
    inputPlaceholder: "Mobile number or invite code",
    continue: "Continue",
    backToSignIn: "Back to sign in",
    stubNote: "Care partner access is coming soon.",
  },
  privacy: {
    title: "Privacy & consent",
  },
} as const;
