# PhysioAid Architecture Review & Goal-Based Implementation Plan

## Status: IMPLEMENTED (2026-07-06)

All goals below are implemented on branch `claude/physioaid-architecture-review-2afi5f`:
Report Safety Fix (3ac4bcc), Goal 1 Trust Boundary (0256c70), Goal 5 Data Model
(e747a75), Goal 2 Onboarding Gate (796f011), Goal 3 Preferences (cf5820e),
Goal 4 Assessment Hub (1f89dda), Goal 6 Movement Log (922c30a + dc06af9),
Goal 7 Community Opt-In (cfcc9fc), CI (85dd02b), Goal 8 AI Trends (8d00770),
QA hardening (6670bf9). Verified by an independent 20-item acceptance audit
(all PASS) plus a Playwright walk of the signed-out and demo flows.

**Before go-live:** deploy the updated `firestore.rules`
(`firebase deploy --only firestore:rules`) — profile and movement-log writes
are denied until the nested rules are live. `OPENAI_API_KEY` is already set
in Vercel.

## Context

PhysioAid is a Next.js 15 + Firebase (Auth/Firestore) PWA for older-adult mobility screening in Singapore. PR #7 wired real Google sign-in, per-user assessment history, and AI activity recommendations — but the app still mixes demo identity, profile setup, assessment evidence, community activity, and movement tracking. The owner's target product model:

> Onboarding identifies the user. Assessment measures the user. Movement tracking records user activity. Reports summarize completed assessment evidence. Dashboard tracks change over time. Community shows opted-in social activity only.

**This plan is inspection + planning only.** Implementation will be handed off to other models/workers (Workers A–D per the owner's handoff doc). The plan is organized as 8 independently-shippable goals plus a QA pass, ordered so the identity/data foundation lands before surface features.

### Owner decisions locked in (2026-07-06)

1. **Hub cards:** ship existing tests (Self Confidence, Walk Test, Sit to Stand, Floor Rising) + **locked "coming soon" placeholders** for Timed Up and Go and Functional Reach. No new test implementations now.
2. **Exercise** is a hub card that launches guided exercise content; completion logs a movement activity — it is **not** assessment evidence.
3. **Reports** resolve from Firestore for signed-in users (shareable across own tabs/devices); missing/unauthorized → honest not-found. Only explicit demo IDs load demo data.
4. **AI trends:** full spec now (trend cards + comparison logic + AI summary route mirroring `recommend-activities`).
5. **AI runtime:** OpenAI API. `OPENAI_API_KEY` is already set in the Vercel environment (confirmed 2026-07-06) — both `/api/recommend-activities` (existing) and `/api/trend-summary` (planned) read it server-side; `OPENAI_MODEL` defaults to `gpt-4o-mini`. Never expose the key client-side (no `NEXT_PUBLIC_` prefix).

---

## Part 1 — Verified Architecture Diagnosis

Three read-only explorer agents inspected the codebase. Findings below are file:line-verified against branch `claude/physioaid-architecture-review-2afi5f` (= main @ 47055e3, post-PR#7).

### 1.1 The root cause: no user model, no state boundary

The single deepest problem is that **the app has no user profile model and no per-test state model**. Everything else (Mr Tan leaks, report fallback, fake community, device-local streaks) is a symptom:

- The only Firestore data is `users/{uid}/assessments/{id}` (`src/lib/assessment-history.ts`). The parent `users/{uid}` doc is never created. There is **no profile document, no onboarding status, nothing** identifying the real user beyond Firebase `auth.user`.
- Demo identity (`demoPerson` in `src/components/dashboard/demo-display-data.ts:77-84`) is used as **static display data with no demo/real gate** — every user sees Mr Tan.
- The assessment flow's *initial* React state is seeded with Mr Tan + demo test metrics (`useAssessmentFlow.ts:67-106`), so "not started" is indistinguishable from "demo default", and a real user can save a session containing demo metrics for tests they never performed.
- Demo mode itself is only AppShell-local state (`localStorage["physioaid.session"]==="demo"`), never exposed via context; `demoMode = demoSession && !user` is computed in exactly one place (`AppShell.tsx:149`).

### 1.2 Demo identity leak inventory (all unconditional for real users)

| # | Location | Leak |
|---|----------|------|
| 1 | `AssessmentHome.tsx:49` | Greeting "Good morning, Mr Tan" |
| 2 | `ProfileScreen.tsx:77-88, 121` | Identity card: demoPerson name/ageGroup/location; care-partner row |
| 3 | `ResourcesTab.tsx:120` | Sends `demoPerson.location` ("Toa Payoh") as `area` to `/api/recommend-activities` |
| 4 | `useAssessmentFlow.ts:84-106` | Flow initial state: Mr Tan, age 78, demo questionnaire/chair/gait/floor metrics |
| 5 | `AssessmentResultScreen.tsx:151` | Shows "Mr Tan" (from #4) or "Demo participant" |
| 6 | `ReportView.tsx:46-52` | Missing session → `createDemoSession()` → full Mr Tan clinical report with only a small "Demo data" pill. Fires on ANY new tab/reload/device because reports live in per-tab `sessionStorage` (`report-session.ts`) |
| 7 | `CommunityTab.tsx:26-67,144-180` | Hardcoded fake feed (Mr Wong, Mei, Auntie Lim, Raj) for everyone |
| 8 | `InsightsDashboard.tsx` (/insights) | Fabricated population data — labelled "Demo data" but ungated (low priority; it's a planner view) |

Correctly gated already: `demoHistory` sample entries (`history-store.ts:110-116`, demo-only) and the flow's "Load sample" button (demo mode only).

Adjacent hazard: `history-store.ts:12` local history key `physioaid.history` is **not uid-namespaced** → cross-account data bleed on shared devices.

### 1.3 Assessment flow structure (what's reusable vs. inherently linear)

- Linear steps: consent → safety → emergency_contact → questionnaire → chair_stand → motion_gait → floor_rising → dashboard (`useAssessmentFlow.ts:29-39`; enters at consent).
- **Profile data is collected inside the assessment**: `ContactScreen.tsx:63-95` collects emergency contact AND displayName/age/livingSituation. These move to onboarding.
- **Reusable per-test**: each physical test is already a modular 3-phase sub-machine (demo→start→manual) with self-contained screens, per-test gate functions (`src/lib/functional-tests/gates.ts`), `TestStartPanel`, and pure scoring (`analyseAssessment`).
- **Inherently linear / needs redesign**: safety gating is imperative index-jumping inside `next()` (`useAssessmentFlow.ts:141-176`); the escalating-risk chain (chair gate → gait; motion gate → floor) must become derived `locked` card states. No per-test status model exists (`completionStatus` enums lack not_started/in_progress/locked; only floor-rising has "skipped").
- Hub-card ↔ existing-test mapping: Self Confidence = falls-efficacy questionnaire; Walk Test = motion_gait; Sit to Stand = chair_stand; Floor Rising = existing test (kept as card). TUG + Functional Reach don't exist in code → locked placeholders.

### 1.4 Preferences, movement, community

- **Language**: localStorage `physioaid.lang` only (`LanguageProvider.tsx`); silent English fallback (`messages.ts:354`). **Text size**: localStorage `physioaid.text-size`, applied as `<html data-text-size>` — the logic lives inside `ProfileScreen.tsx:16-39`. Neither is profile-owned. Much of the new shell bypasses i18n entirely via hardcoded `src/components/layout/copy.ts`.
- **Movement**: `src/lib/streak.ts` device-local practice log (array of date strings); `markPracticedToday()` called only from `AppShell.tsx:154` on assessment save; consumed only by CommunityTab's 3-day goal card. Not user-owned, typed, synced, or reportable.
- **Community**: static fake feed; Cheer/Comment toggle local state only; no opt-in model, no empty state. `lib/demo/community.ts` `communityPosts` is dead code (its `communityActivities` is used by the API route).
- **AI**: `/api/recommend-activities` is a good pattern to mirror (server-side key, 5s timeout, sanitized output, curated fallback, no PII — only planning area + risk band).

### 1.5 Firestore & rules today

```
users/{uid}/assessments/{assessmentId}   ← only collection; owner-only rules; userId stamp required
match /{document=**} { allow read, write: if false; }   ← default deny
```
Any new path (`users/{uid}` profile doc, `movementLogs` subcollection) **requires new rules** or all reads/writes fail.

---

## Part 2 — Goal-by-Goal Implementation Plan

### 2.0 Architecture spine (shared foundation — read first)

**One provider decision: new `UserProfileProvider` (sibling of AuthProvider, not an extension).** AuthProvider stays a thin Firebase-auth wrapper. The new provider centralizes session kind + profile + demo ownership (demo state moves out of AppShell). Nesting in `src/app/layout.tsx`:

```tsx
<AuthProvider>
  <UserProfileProvider>        {/* new */}
    <LanguageProvider>{children}</LanguageProvider>   {/* must sit INSIDE so Goal 3 can sync language from profile */}
  </UserProfileProvider>
</AuthProvider>
```

**Context contract** (Goal 1 ships a subset; Goals 2/3 fill it in):

```ts
export type SessionKind = "signedOut" | "demo" | "firebase";
export type UserProfileContextValue = {
  sessionKind: SessionKind;
  isDemo: boolean;
  uid: string | null;
  profile: UserProfile | null;          // demoProfile in demo mode; Firestore doc for firebase
  profileLoading: boolean;
  onboardingStatus: "unknown" | "needed" | "in_progress" | "complete";
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;  // firebase → setDoc merge + cache; demo → localStorage only; signedOut → no-op
  setTextSize: (size: TextSize) => void;                          // Goal 3
  startDemo: () => void;                // moved from AppShell.tsx:89-97
  endDemo: () => void;
};
```

**Profile data model** (`src/types/profile.ts`, new):

```ts
export type TextSize = "standard" | "large" | "xl";
export type AgeGroup = "under60" | "60s" | "70s" | "80s" | "90plus";
export type UserProfile = {
  userId: string;                        // stamped uid (mirrors assessments pattern)
  displayName: string;
  ageGroup: AgeGroup | null;
  livingSituation: string;
  planningArea: string | null;           // from PLANNING_AREAS
  preferredLanguage: Language;           // en|zh|ms|ta
  textSize: TextSize;
  supportContact: { name: string; phone: string; relationship: string } | null;  // null = skipped
  consents: { assessmentConsent: boolean; aiInsightConsent: boolean;
              communityVisibility: boolean;   // default FALSE
              consentedAt: string | null };
  onboarding: { status: "not_started" | "in_progress" | "complete";
                lastCompletedStep: "welcome"|"aboutYou"|"supportContact"|"consent"|"ready" | null;
                completedAt: string | null };
  createdAt: string; updatedAt: string;
};
```

**Firestore layout:** profile at `users/{uid}` (root doc — independent of the existing `users/{uid}/assessments` subcollection, no conflict); movement logs at `users/{uid}/movementLogs/{id}`. **firestore.rules restructured to nest** — profile doc + assessments (semantics unchanged) + movementLogs all owner-only with `userId` stamp required, default-deny retained. **Deploy rules BEFORE shipping Goal 2/6 client code.**

**localStorage key inventory (final):** `physioaid.session` (demo marker, unchanged, moves to provider); `physioaid.lang` / `physioaid.text-size` (unchanged keys — source of truth for signed-out/demo, warm cache for firebase); NEW: `physioaid.profile.demo`, `physioaid.profile.<uid>` (offline profile cache), `physioaid.history.demo` / `physioaid.history.<uid>` (replaces shared `physioaid.history`), `physioaid.movement-log.demo` / `physioaid.movement-log.<uid>`; `physioaid.practice-log` becomes read-only legacy (unioned into week count).

**SSR/hydration rule for all new code:** never read localStorage in module scope or render bodies — lazy `useState` initializers guarded by `typeof window === "undefined"` (pattern: AppShell.tsx:51-55) or `useEffect` (pattern: LanguageProvider.tsx:46-53).

---

### Goal 1 — Trust Boundary (real users never see Mr Tan / fake data)

Independently shippable. Introduces the provider with an interim profile (no Firestore yet) and gates every leak on `isDemo`.

**Design:**
- Goal 1 provider ships `sessionKind/isDemo/uid/startDemo/endDemo` + interim `profile`: demo mode → new `demoProfile` constant in `src/lib/demo/profile.ts` (built from demoPerson values, `communityVisibility: true`, onboarding complete); firebase → in-memory `profileFromAuthUser(user)` fallback (displayName from `user.displayName`, onboarding "complete" placeholder — Goal 2 replaces this branch).
- **History namespacing fix:** storage key becomes `physioaid.history.demo` / `physioaid.history.<uid>`. Migration: in demo mode, legacy `physioaid.history` → copy to demo key, delete legacy. Firebase users ignore the legacy key (their saves already went to Firestore — remote is authoritative; deliberate small-loss tradeoff, document in comment).

**Files — create:** `src/components/auth/UserProfileProvider.tsx`, `src/lib/demo/profile.ts`, `src/types/profile.ts`.
**Files — modify:**
- `src/app/layout.tsx:64-68` — insert provider.
- `src/components/layout/AppShell.tsx` — delete SESSION_KEY/demoSession/startDemo/localStorage-clear (lines 25, 51-55, 89-105); consume `useUserProfile()`; `signedIn = sessionKind !== "signedOut"`; `demoMode={isDemo}` at :149.
- `src/components/dashboard/AssessmentHome.tsx:12-15,47-49` — greeting from `profile?.displayName`, neutral fallback ("Good morning" with no name).
- `src/components/dashboard/ProfileScreen.tsx:11,74-88,113-125` — identity card from profile fields, hide missing segments; care partner from `profile.supportContact?.name ?? "Not connected"`.
- `src/components/layout/tabs/ResourcesTab.tsx:15,117-122` — `area = isDemo ? "Toa Payoh" : profile?.planningArea ?? null`; omit param when null (API already handles it).
- `src/components/layout/tabs/CommunityTab.tsx:144-180` — interim gate: fake feed + segments only when `isDemo`; real users get goal card + private placeholder (Goal 7 replaces).
- Optional: `InsightsDashboard.tsx` — stronger "Sample population data (demo)" banner.
- **Out of scope here (Worker B/D own):** `useAssessmentFlow.ts:84-106` seeding, `ReportView.tsx:49` fallback.

**Acceptance:** fresh Google account — "Mr Tan"/"Toa Payoh" appear nowhere in DOM across home/profile/community/resources; recommend-activities called without `area` when no planning area; demo mode unchanged; history migration works both directions; no hydration warnings in all three session states.

---

### Goal 2 — Onboarding Gate

**Design:**
- New `src/lib/user-profile.ts` mirroring assessment-history.ts: `createEmptyProfile(uid, seed)` (seeds displayName from auth user, language/text-size from existing localStorage), `getUserProfile(uid)` (getDoc → null if missing), `saveUserProfile(uid, patch)` (setDoc merge, stamps userId + updatedAt).
- Provider firebase branch: on uid change → `profileLoading=true` → getDoc; doc → profile + cache to `physioaid.profile.<uid>`; null → `onboardingStatus="needed"`; rejection → fall back to uid-keyed cache (prevents re-showing onboarding offline), else "needed". uid-keyed staleness guard as in history-store.ts:64-95 so account switches never show another user's profile.
- **Gate in AppShell (no flash):** extend splash condition — `if (!hydrated || loading || (sessionKind==="firebase" && (profileLoading || onboardingStatus==="unknown"))) return splash;` then after the `!signedIn` branch: `if (sessionKind==="firebase" && onboardingStatus !== "complete") return <OnboardingFlow/>`.
- **Steps & resume:** `["welcome","aboutYou","supportContact","consent","ready"]`; initial index = `indexOf(lastCompletedStep)+1`. Each Continue → `updateProfile({...stepFields, onboarding:{status:"in_progress", lastCompletedStep, completedAt:null}})`; Ready → status "complete" + completedAt. New → onboarding; partial → resume; complete → app.
- Consent step: three toggles (assessmentConsent, aiInsightConsent, communityVisibility) all rendered unchecked by default; nothing required to continue; stamps consentedAt.
- Support Contact step: prominent "Skip for now" → `supportContact: null`.
- Existing pre-profile accounts see onboarding once on next sign-in, prefilled from auth displayName + localStorage prefs (desirable — captures consents).
- Demo never hits the gate (demoProfile is onboarding-complete).

**Files — create:** `src/lib/user-profile.ts`, `src/components/onboarding/OnboardingFlow.tsx`, `src/components/onboarding/steps/{Welcome,AboutYou,SupportContact,Consent,Ready}Step.tsx` (reuse `TextField` from assessment/ui/Fields.tsx, segmented buttons per ProfileScreen.tsx:99, `<LangSwitch/>`, PLANNING_AREAS select), onboarding section in `copy.ts` (English v1, flag i18n follow-up).
**Files — modify:** UserProfileProvider (firebase branch), AppShell (gate), `firestore.rules` (nested restructure ships here).

**Acceptance:** new account: splash → onboarding, no home flash; kill tab mid-onboarding → resumes at next step with Firestore `onboarding.lastCompletedStep` correct; finished onboarding populates greeting/ProfileScreen/Resources area; skip contact → `supportContact:null` + "Not connected"; untouched consents → all false with consentedAt; returning complete user → straight to app; demo bypasses; rules verified owner-only.

---

### Goal 3 — Global Preferences (language + text size, profile-owned)

**Design:**
- Precedence: firebase → profile field wins on load; demo/signed-out → localStorage (unchanged). Every write updates both profile (when firebase/demo) and localStorage (always).
- Text-size logic moves out of ProfileScreen into new `src/lib/preferences.ts`: `applyTextSize`, `loadStoredTextSize`, `loadTextSizePreference`, `persistTextSize` (moved from ProfileScreen.tsx:16-39).
- LanguageProvider ↔ profile sync: LanguageProvider calls `useUserProfile()`; one-time-per-uid effect (ref-guarded, runs after profileLoading=false) applies `profile.preferredLanguage` and must win over the initial localStorage effect. Existing `setLang` gains fire-and-forget `updateProfile({preferredLanguage})` when firebase/demo. `LangSwitch.tsx` unchanged.
- Provider applies `applyTextSize(profile.textSize)` when a profile resolves; adds `setTextSize` setter. ProfileScreen selector rewires to context. Onboarding About You uses the same setters → live preview during onboarding.
- Migration: localStorage values seed the profile at onboarding (Goal 2 seed); afterwards profile is authoritative. Keys unchanged → signed-out flow unaffected.

**Files:** create `src/lib/preferences.ts`; modify `ProfileScreen.tsx` (delete 16-39, rewire), `AppShell.tsx:12-14,69-71` (import path), `LanguageProvider.tsx` (sync effect + write-through), `UserProfileProvider.tsx`.

**Acceptance:** pick 中文+XL in onboarding → applies instantly, lands in Firestore; second browser with empty localStorage renders 中文/XL after profile load; Profile change syncs Firestore+localStorage and survives reload; demo changes persist locally with zero Firestore writes; signed-out behavior unregressed; `<html lang>`/`data-text-size` correct everywhere.

---

### Goal 6 — Movement Activity Log

**Design — types** (`src/types/movement.ts`, new): `MovementActivityLog { id, userId, source: assessment|exercise|manual_walk|community_event|integration, activityType: mobility_check|balance_practice|chair_exercise|walk|functional_reach|other, title, durationMinutes: number|null, completedAt: ISO, visibility: private|community (default private), assessmentSessionId?, assessmentTestResultId? }`.

**Design — shared utility** (`src/lib/movement-log.ts`, new; the frozen contract Workers B/C both call):

```ts
export const MOVEMENT_LOG_EVENT = "physioaid:movement-log";
export async function recordMovementActivity(session: HistorySession, input: MovementActivityInput): Promise<MovementActivityLog>;
// always appends to namespaced localStorage; firebase → also fire-and-forget setDoc users/{uid}/movementLogs/{id}
// (mirror saveAssessment); dispatches window CustomEvent so open views refresh
export async function getMovementLogs(uid: string, max?): Promise<MovementActivityLog[]>;   // orderBy completedAt desc
export function loadLocalMovementLogs(session: HistorySession): MovementActivityLog[];
export function getActiveDaysThisWeek(logs: MovementActivityLog[], legacyDays: string[]): number;  // unique local days ∪ legacy practice-log, Monday-based week (reuse streak.ts:63-73 math)
```

- Reactive hook `src/components/community/useMovementLog.ts` mirroring useHistoryStore: local-first, uid-keyed remote merge, subscribes to MOVEMENT_LOG_EVENT; exposes `{logs, activeDaysThisWeek, logActivity}`.
- **Write points:** AppShell.tsx:151-155 — replace `markPracticedToday()` with `recordMovementActivity(historySession, {source:"assessment", activityType:"mobility_check", title:"Mobility check", assessmentSessionId: session.id})`. Exercise hub card (Worker B) calls the same function with `source:"exercise"`. Manual walk (Goal 7 UI) with `source:"manual_walk"`.
- **Legacy back-compat:** no write migration — `getActiveDaysThisWeek` unions legacy `physioaid.practice-log` day strings (day counts only, no PII; drains after one week). `streak.ts` prunes to `loadPracticeLog` + deprecation comment; `markPracticedToday`/`computeStreak`/`practisedToday` deleted.
- Demo: writes only `physioaid.movement-log.demo`; zero Firestore traffic.

**Files:** create the 3 above; modify `AppShell.tsx:16,151-155`, `streak.ts`, `CommunityTab.tsx:6,86-91` (goal card reads `useMovementLog`; session from `useUserProfile()`), `firestore.rules` movementLogs block.

**Acceptance:** real save → movementLogs doc with correct fields + goal card increments live; offline save → local entry, no unhandled rejection; demo → local-only; legacy practice-log days still count; same-day dedup; cross-user rules denial.

---

### Goal 7 — Community Empty/Opt-In

**Design — three render modes** decided by `useUserProfile()`:
1. **Demo:** sample feed moved to new `src/lib/demo/community-feed.ts` (existing `lib/demo/community.ts` untouched — API route imports it), visibly labelled "Sample neighbourhood feed" with per-card Sample pills (reuse AssessmentHome.tsx:91-96 pill pattern). Cheer/Comment stay demo toys.
2. **Real user, `consents.communityVisibility === false`:** movement-goal card + honest opt-in card ("Share your movement with neighbours?" / sharing off by default / "Turn on community sharing" → `updateProfile` consents patch). No fake people, no segment switcher.
3. **Real user, opted in:** goal card + "Your activity this week" from `useMovementLog().logs` + honest empty neighbourhood-feed state ("No neighbours are sharing yet"). New logs stay `visibility:"private"`; per-log sharing is flagged future work.
- **Manual walk logging:** "Log a walk" action on the goal card (10/20/30 min chooser) → `logActivity({source:"manual_walk", ...})`. Available in demo and real modes.

**Files:** create `src/lib/demo/community-feed.ts`; rewrite `CommunityTab.tsx` (keep goal-card markup :105-127 and daysLeftThisWeek); extend `copy.ts` community section.

**Acceptance:** fresh real user → goal card + opt-in card, zero person-names in DOM; opt-in toggle persists to Firestore and switches mode immediately; opted-in user sees own activity + empty feed; walk logging updates ring instantly; demo feed labelled; opt-in card never in demo, sample feed never for real users.

---

### Report Safety Fix (ships first — small, independent of everything)

Closes the live hazard at `ReportView.tsx:46-52` (verified: `setSession(stored ?? createDemoSession())`).

**Design:**
- Add `getAssessment(uid, id): Promise<AssessmentSession | null>` to `src/lib/assessment-history.ts` (single-doc `getDoc`; existing rules already cover single-doc reads — no rules change).
- Rewrite ReportView resolution to a strict order with typed state `{mode: "loading" | "demo" | "user" | "not_found"}`:
  1. Explicit demo ids (`"demo"`, plus `"sample"` for back-compat — also change `HistoryDetailScreen.tsx:32` to push `/report/demo`) → `createDemoSession()` with a **prominent banner**: "Sample report — Mr Tan (demonstration data, not a real participant)".
  2. sessionStorage fast-path via `loadSessionForReport(id)` (unchanged transport).
  3. Signed-in → `await getAssessment(user.uid, id)` (wait on `useAuth().loading` behind the existing "Preparing report…" placeholder — AuthProvider already wraps `/report/[id]` via root layout).
  4. Otherwise → honest not-found screen ("We couldn't find this report…"), with a sign-in hint when signed out. **No clinical content rendered; `createDemoSession()` unreachable except explicit demo ids.**
- `saveSessionForReport` returns `session.id` always (try/catch around `setItem` only) so Firestore resolution can still find it if sessionStorage fails.

**Acceptance:** report URL reopened in new tab while signed in loads from Firestore; signed-out reload → not-found + sign-in hint; `/report/demo` shows the banner; user A cannot load user B's report (rules deny → not-found); no path reaches demo data except demo ids.

---

### Goal 5 — Assessment Data Model (lands BEFORE the hub)

Rationale for 5-before-4: hub card states, partial result rendering, report evidence sections, and trend comparability all consume the same two contracts — the per-test status derivation and the session normalizer. Freeze those first so Workers B and D build against one contract.

**Design — types** (`src/types/assessment.ts`, additive):

```ts
export type TestId = "self_confidence" | "sit_to_stand" | "walk" | "floor_rising"
                   | "timed_up_and_go" | "functional_reach";   // last two: future, no data yet
export type TestRecordStatus = "completed" | "stopped" | "skipped" | "demo" | "missing";  // stored-record status
export type TestItemState = "not_started" | "in_progress" | "completed" | "skipped" | "locked"; // hub UI state
```
Widen `ChairStandMetrics.completionStatus` and `MotionMetrics.completionStatus` to include `"skipped"` (FloorRising already has all four).

**Design — session shape decision: keep fixed fields, do NOT move to a keyed map.** Every consumer (analytics, ReportView, sessionToHistoryEntry, Firestore docs, localStorage) reads flat fields; a keyed map forces a full-codebase rewrite plus destructive storage migration for zero current benefit. The keyed abstraction lives in accessor functions instead. `AssessmentSession` evolves: add `schemaVersion?: 2` and `completedAt?`; make `emergencyContact`, `demographics`, `questionnaire`, `chairStand` **optional** (they move to profile / may be skipped). TypeScript then surfaces every consumer assuming presence — fixed in this goal.

**Design — normalizer** (`src/lib/assessment/normalize-session.ts`, new): `normalizeSession(raw): AssessmentSession | null`, runs on every read (Firestore, localStorage, sessionStorage), never rewrites storage. v1 rule: sessions without `schemaVersion` were demo-seeded, so on non-demo sessions any test metric with `completionStatus/source === "demo"` is **stripped to undefined** (it is not evidence); explicit demo ids (`isDemoSessionId`: `"demo-"` prefix) keep demo metrics; v1 questionnaires are kept (indistinguishable from real answers) with a trend caveat.

**Design — status accessors** (`src/lib/assessment/test-status.ts`, new, pure): `metricRecordStatus(metrics)` (undefined→missing, demo-source→demo, else pass-through), `getTestRecordStatus(session, testId)` (TUG/reach always missing), `isEvidence(status)` (=== "completed").

**Design — partial analytics** (`src/lib/analytics/partial.ts`, new): `analyseSessionIfPossible(session, {allowDemo?})` wraps the **untouched** `analyseAssessment` (preserve scoring per owner); requires questionnaire present AND chairStand `completed|stopped` (`stopped` is deliberately scored high-risk today — real evidence of stopping); returns `undefined` otherwise → callers render "insufficient completed tests".

**Consumer fixes (compile-driven):** `sessionToHistoryEntry` null-safety (`HistoryEntry.confidence: number|null`, "—" rendering in AssessmentHome:104 / HistoryDetailScreen:59); `history-store.ts` + `assessment-history.ts` + `report-session.ts` normalize on read; **`saveAssessment` must strip `undefined` keys (Firestore rejects undefined — easy to miss, will throw at save time)**; ReportView partial rendering: three groups — Completed measurements (evidence; "stopped" labelled partial), Skipped (listed, not analyzed), Not attempted — plus "Not computed" analytics state and "Not provided" fallbacks for optional demographics/contact.

**Acceptance:** `npx tsc --noEmit` passes; a v1 session with `chairStand.completionStatus:"demo"` renders as "Not attempted" (not a fake 16s result); questionnaire-only v2 session shows partial report correctly; `demo-mr-tan` still renders fully; saves with missing tests don't throw.

---

### Goal 4 — Assessment Hub (replaces the linear flow)

**Design — persistent draft** (`src/lib/assessment/session-draft.ts`, new): `SessionDraft { id, startedAt, consent, safety: SafetyScreenResult|null, questionnaire: QuestionnaireDraft|null, questionnaireIndex, chairStand?, motion?, floorRising?, openedTests: TestId[], demoLoaded }`. `createEmptyDraft()` — **genuinely empty, kills all Mr Tan/demo seeds** (`safety: null` = not answered; tests undefined = not started). Persisted to `physioaid.assessmentDraft.<uid|demo>` with a **12-hour TTL** (safety answers must be fresh; older adults get interrupted — losing consent + a completed test to a reload would force re-testing). `buildSessionFromDraft(draft, {demographics?, emergencyContact?, analytics?})` → v2 session, stamps completedAt, omits undefined.

**Design — pure card derivation** (`src/lib/assessment/hub-state.ts`, new): `deriveHubCards(draft)` reusing `getChairStandGate`/`getMotionGate` unchanged. Rules:
- `self_confidence`: locked `consent_required` until assessment consent; **never safety-locked**; then not_started/in_progress/completed from questionnaire draft.
- `sit_to_stand`: consent → safety_check_required (safety null) → safety_flagged (`isBlockedBySafety`, same predicate as useAssessmentFlow.ts:118-122) → else from record (stopped/skipped → skipped with detail).
- `walk`: same locks + `prerequisite` unless chairStand exists AND its gate passes — **the escalating-risk chain becomes a lock derivation** (replaces imperative jumps at :148-158).
- `floor_rising`: same + prerequisite on walk/motion gate.
- `timed_up_and_go`, `functional_reach`: always locked, `coming_soon`.
- `exercise`: always available; checkmark = "Done today"; never a test result.
- Demo `completionStatus` counts as completed only when `draft.demoLoaded` (explicit sample load).
Plus `isPrecheckComplete(draft)`, `canFinish(draft)` (≥1 test record).

**Design — flow hook rework** (`useAssessmentFlow.ts`, same path, keep exported names `AssessmentFlow`/`PhysicalTestPhase`/`QuestionnaireDraft` so test screens need at most prop-level changes): delete demo-seeded initial state (:67-106 verified); hydrate from `loadDraft(identity) ?? createEmptyDraft()`, persist on change; replace `steps`/`stepIndex`/`next`/`back` with view navigation `"hub" | "precheck" | "test:{TestId}" | "exercise" | "result"` + `openCard/returnToHub/finish`; keep gate formulas and `markChairStoppedOrUnsafe`/`markGaitStoppedOrUnstable` metric mutations verbatim but return to hub instead of jumping to dashboard; stamp `getSkippedFloorRisingMetrics()` at finish when floor was gate-locked (preserves today's saved semantics); `loadDemo` stays, demo-gated; `stoppedBeforeHigherRisk` preserved for the STOPPED banner.

**Design — screens (Worker B):**
- `AssessmentHubScreen.tsx` (new): 78px min-height rows, card `#e7e7e7` on page `#f7f7f7`, title + state left, action button ("Start/Continue/Redo/Review"), thumbnail right; **status never color-only** (Check + "Done", Lock + reason, CircleDashed + "Not started" — lucide icons already in use). Top row: "Consent & safety check" until precheck complete. Bottom: "Finish & review" (disabled until canFinish) + "Start over" (ConfirmDialog). Demo: "Load sample answers".
- `PrecheckScreen.tsx` (new): ConsentScreen + SafetyScreen reused unchanged; **ContactScreen is NOT rendered** (About You + emergency contact → onboarding); strip demographics props from ConsentScreen.
- `TestScreen.tsx` (new, thin host): renders existing per-test screens with back-to-hub; "Done — back to hub" once a record exists.
- `AssessmentFlowScreen.tsx` (rewrite as view router): external props `{demoMode, onExit, onSaved, onViewResources}` unchanged → **AppShell needs zero structural change** (`{name:"flow"}` opens the hub).
- Exercise card: opens Resources videos via existing `onViewResources` now; "Mark done" calls **`recordMovementActivity(session, {source:"exercise", ...})`** (Goal 6 contract — NOT `markPracticedToday`, which Goal 6 deletes).

**Design — result screen** (`AssessmentResultScreen.tsx`): analytics may be undefined → partial-summary layout; tiles render only attempted tests + "Not done this time: …" caption; `buildSession` → `buildSessionFromDraft`; `clearDraft` after save; name line uses profile displayName when available, else omits the name — **never fabricates "Demo participant"**.

**Interim safety valve:** if Goal 4 slips, ship a mini-change first: replace the demo seeds at `useAssessmentFlow.ts:84-106` with honest empty values (Goal 5's optional types already permit it).

**Acceptance:** fresh user hub shows precheck not_started, Self Confidence consent-locked, physical tests locked, TUG/reach "Coming soon", Exercise available, zero Mr Tan/16s values; safety "dizziness" locks physical cards but questionnaire remains doable and saveable; gate-failing chair stand locks Walk with reason + STOPPED banner preserved; draft survives tab kill within 12h, expires after; demo empty until "Load sample"; saved doc has schemaVersion 2, no undefined fields, only attempted tests.

---

### Goal 8 — AI Trend Dashboard

**Design — pure trend engine** (`src/lib/analytics/trends.ts`, new): `computeTrends(sessions): TrendReport | null` — null when <2 normalized, non-demo sessions with ≥1 comparable completed metric. Compares the two most recent qualifying sessions per metric:
- `confidence`: both have questionnaire; averageScore; steady band |Δ|<0.5; higher = improved.
- `sit_to_stand`: both chairStand **evidence-only** (`metricRecordStatus === "completed"` — never demo/stopped); durationSeconds; **lower = improved**; steady |Δ|≤2s or <10%; caveat if repetitions differ.
- `gait_speed`: both motion completed with gaitSpeed; higher = improved; steady |Δ|<0.05 m/s.
- `overall`: risk band mapped low=0/moderate=1/high=2 via analytics or `analyseSessionIfPossible`; lower = improved.
- floor rising: caveat/missing-only unless both completed with durationSeconds.
- v1-normalized sessions contribute with a "recorded with an earlier app version" caveat. TUG/reach cards emit only when data exists (never, today) — no placeholder trend cards.
- `buildComputedTrendSummary(report): string` — deterministic plain-language summary; serves as client AND server fallback.

**Design — UI** (`src/components/dashboard/TrendSection.tsx`, new): mounted in AssessmentHome between "Last result" and "Recommended next step"; `useHistoryStore` extended to expose normalized non-demo `sessions`. Empty state: single card "Complete another assessment to see trends." Cards: metric label, direction as **icon + word** (never color-only), values ("16s → 13s"), caveats, missing-data footer. Copy never diagnoses — "changed/steady", "worth mentioning to your physiotherapist".

**Design — AI summary route** (`src/app/api/trend-summary/route.ts`, new; mirrors recommend-activities exactly: server key, gpt-4o-mini, 5s timeout, json_object, never errors to client). POST request contains **only** `{trends: [{metric, direction, delta, unit}], riskBand?, missing: [metricIds], daysBetween}` — no names/ages/dates/ids/free text. Server whitelists metric/direction enums, clamps numbers, max 6 trends. Response `{source: "ai"|"computed", summary: ≤400 chars}`; fallback echoes the client-computed summary. Card labelled "AI summary" vs "Summary" by source. Respect `profile.consents.aiInsightConsent`: when false, skip the API call and always use the computed summary.

**Acceptance:** <2 sessions → empty-state card, no API call; two comparable sessions produce correct direction/values with skipped-test missing notes; v1 demo-seeded chairStand contributes nothing; no OPENAI key → computed summary, no error; devtools shows zero PII in the request; no diagnostic language anywhere.

---

## Part 3 — Master ship order, ownership, and QA

### 3.1 Cross-plan reconciliation (conflicts resolved)

1. **Exercise completion:** calls `recordMovementActivity(session, {source:"exercise", activityType, title, durationMinutes})` — the Goal 6 contract. It does NOT call `markPracticedToday()` (deleted in Goal 6). If the hub (Goal 4) ships before Goal 6, the exercise "Mark done" button is deferred until Goal 6 lands (card just opens Resources videos).
2. **firestore.rules:** ONE restructure (nested `users/{uid}` block) covering profile doc + assessments (semantics unchanged) + movementLogs. Worker A owns the file; Worker C's movementLogs block merges into it. **Deploy rules before Goals 2/6 client code.**
3. **Profile → assessment flow:** `AssessmentFlowScreen` gains optional `profile` prop; `buildSessionFromDraft` stamps `demographics`/`emergencyContact` from it. Until onboarding lands, sessions save with those undefined (valid v2). `ContactScreen.tsx` is deleted by Worker B once onboarding (Worker A) owns support contact — coordinate the PR order.
4. **Assessment-save movement record:** `AppShell.tsx:151-155` onSaved swaps `markPracticedToday()` → `recordMovementActivity(historySession, {source:"assessment", activityType:"mobility_check", title:"Mobility check", assessmentSessionId: session.id})` (Worker C's one-line AppShell change, after Worker A's AppShell changes land).
5. **`/app/assessment/page.tsx` and `/app/community/page.tsx`** just `redirect("/")` — no changes needed, but grep `initialStep` consumers before deleting `AssessmentStep`/`steps`.

### 3.2 Ship order (each step independently shippable & verifiable)

| # | Item | Depends on | Worker |
|---|------|-----------|--------|
| 0 | Report Safety Fix | nothing | D |
| 1 | Goal 1 Trust Boundary (provider + leak gating + history namespacing) | nothing | A |
| 2 | Goal 5 Assessment Data Model (types, normalizer, accessors, partial analytics, consumer fixes) | nothing (parallel with 1) | B (D reviews) |
| 3 | Goal 2 Onboarding Gate (+ rules deploy) | 1 | A |
| 4 | Goal 3 Global Preferences | 2 (Goal 2) | A |
| 5 | Goal 4 Assessment Hub | 2 (Goal 5); profile prop optional | B |
| 6 | Goal 6 Movement Activity Log | 1 (provider) | C |
| 7 | Goal 7 Community Empty/Opt-In | 6 + Goal 2 consents (soft — can gate on `profile?.consents` existing) | C |
| 8 | Goal 8 AI Trends | 2 (Goal 5), better after 5 (hub produces clean v2 sessions) | D |
| 9 | Goal 9 Full-flow QA | all | any |

Parallelizable lanes after step 0: **A-lane** (1→3→4), **B-lane** (2→5), **C-lane** (6→7, after 1), **D-lane** (0, then 8 after 2).

### 3.3 Worker ownership map (disjoint)

- **Worker A — Profile & Onboarding:** `UserProfileProvider.tsx`, `types/profile.ts`, `lib/user-profile.ts`, `lib/preferences.ts`, `lib/demo/profile.ts`, `components/onboarding/**`, `app/layout.tsx`, `LanguageProvider.tsx`, `ProfileScreen.tsx`, `AssessmentHome.tsx` (greeting), `ResourcesTab.tsx` (area), `firestore.rules`, AppShell session/gate edits, copy.ts onboarding section.
- **Worker B — Hub & Test State:** `types/assessment.ts`, `lib/assessment/{normalize-session,test-status,session-draft,hub-state}.ts`, `lib/analytics/partial.ts`, `lib/assessment-history.ts` (getAssessment/strip-undefined/normalize), `useAssessmentFlow.ts`, `AssessmentFlowScreen.tsx`, new `AssessmentHubScreen/PrecheckScreen/TestScreen`, `ConsentScreen.tsx` (drop demographics), `ContactScreen.tsx` deletion, `AssessmentResultScreen.tsx`, `demo-display-data.ts` (sessionToHistoryEntry), `history-store.ts` (normalize + sessions).
- **Worker C — Movement & Community:** `types/movement.ts`, `lib/movement-log.ts`, `components/community/useMovementLog.ts`, `lib/demo/community-feed.ts`, `CommunityTab.tsx`, `lib/streak.ts` pruning, AppShell:151-155 call swap, copy.ts community section.
- **Worker D — Reports & Trends:** `ReportView.tsx`, `lib/report-session.ts`, `HistoryDetailScreen.tsx` (/report/demo), `lib/analytics/trends.ts`, `app/api/trend-summary/route.ts`, `TrendSection.tsx` (+ mount in AssessmentHome — B merges AssessmentHome first).

**Frozen shared contracts (agree before parallel work):** `UserProfileContextValue` + `UserProfile`; `HistorySession` (existing); `recordMovementActivity(session, input)` signature; `TestId/TestRecordStatus/TestItemState` + `normalizeSession` + `getTestRecordStatus`; localStorage key names; firestore.rules text.

### 3.4 Goal 9 — Full-flow QA checklist (run after every cycle)

**Real new Google user:** no Mr Tan anywhere; no fake community posts; onboarding before app shell; onboarding language applies app-wide; assessment starts at hub; empty history honest; missing report → not-found (never demo).
**Returning real user:** profile loads from `users/{uid}`; history user-owned; movement goal from movementLogs; dashboard shows real latest status + trends only with ≥2 sessions; community private/empty unless opted in.
**Demo user:** demo explicit; Mr Tan only in demo; sample history/feed labelled; **zero Firestore writes on the demo path**.
**Assessment:** no About You / support contact inside assessment; completed/skipped/locked states correct; reports analyze completed evidence only; safety flags lock physical cards but not the questionnaire.
**Language:** onboarding and Profile use the same field; Profile change updates all tabs; missing translations fall back to English.
**Movement:** assessment save, exercise done, and manual walk each create a log record; 3-day goal counts unique active days; legacy practice-log days still count during transition week.

### 3.5 Verification approach for implementers

- `npx tsc --noEmit` + `npx eslint` after each goal (Goal 5's optionality changes are compile-driven by design).
- Run the app (`npm run dev`) and walk the three session states (signed out / demo / Google) per goal's acceptance list; check DOM for "Mr Tan"/"Toa Payoh" strings (`document.body.innerText.includes("Mr Tan")` in console is a fast smoke check).
- Firestore emulator or console checks for rules (owner-only on profile/assessments/movementLogs; cross-uid denial).
- Network tab checks: no PII in `/api/trend-summary` and `/api/recommend-activities` requests; no `area=Toa+Payoh` for real users without a planning area.
- No hydration warnings in console on hard reload in all three session states.

### Critical files (highest-traffic across all goals)

- `src/components/layout/AppShell.tsx` — touched by A (gate/session), C (one line); sequence A first
- `src/components/auth/UserProfileProvider.tsx` (new) — the foundation everything consumes
- `src/components/assessment/useAssessmentFlow.ts` — the one rewrite-sized change
- `src/types/assessment.ts` + `src/lib/assessment/normalize-session.ts` — the frozen data contract
- `src/components/report/ReportView.tsx` — safety fix + partial rendering
- `firestore.rules` — single nested restructure, deploy before dependent client code
