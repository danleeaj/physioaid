"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AssessmentHubScreen } from "@/components/assessment/AssessmentHubScreen";
import { useAuth } from "@/components/auth/AuthProvider";
import { AssessmentHome } from "@/components/dashboard/AssessmentHome";
import { CarePartnerScreen } from "@/components/dashboard/CarePartnerScreen";
import { HistoryDetailScreen } from "@/components/dashboard/HistoryDetailScreen";
import { HistoryScreen } from "@/components/dashboard/HistoryScreen";
import { PrivacyConsentScreen } from "@/components/dashboard/PrivacyConsentScreen";
import { ProfileScreen } from "@/components/dashboard/ProfileScreen";
import {
  loadTextSizePreference,
  setTextSizePreference,
} from "@/components/dashboard/TextSizeControl";
import { useHistoryStore } from "@/components/dashboard/history-store";
import { useUserProfile } from "@/components/dashboard/profile-store";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { markPracticedToday } from "@/lib/streak";
import { SignInScreen } from "@/components/layout/SignInScreen";
import { TabBar, type ShellTab } from "@/components/layout/TabBar";
import { CommunityTab } from "@/components/layout/tabs/CommunityTab";
import {
  ResourcesTab,
  type ResourceSegment,
} from "@/components/layout/tabs/ResourcesTab";

const SESSION_KEY = "physioaid.session";

const emptySubscribe = () => () => {};

type Screen =
  | { name: "assessmentHub" }
  | { name: "history" }
  | { name: "historyDetail"; entryId: string }
  | { name: "profile" }
  | { name: "carePartner" }
  | { name: "privacy" };

/**
 * Mobile app shell: Sign In when signed out; onboarding for new accounts;
 * bottom-tab app (Assessment / Community / Resources) plus a secondary-screen
 * stack when signed in. "Signed in" is Firebase auth OR the Mr Tan demo.
 */
export function AppShell() {
  const { user, loading, signOut } = useAuth();
  const { lang, setLang } = useLanguage();
  // false during SSR/hydration, true on the client afterwards — keeps the
  // server HTML (splash) and first client paint identical.
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [demoSession, setDemoSession] = useState(
    () =>
      typeof window !== "undefined" &&
      window.localStorage.getItem(SESSION_KEY) === "demo",
  );
  const [tab, setTab] = useState<ShellTab>("assessment");
  const [stack, setStack] = useState<Screen[]>([]);
  const [resourcesSegment, setResourcesSegment] =
    useState<ResourceSegment>("nearby");
  // Care Partner Access is reachable from the signed-out Sign In screen too.
  const [signedOutCarePartner, setSignedOutCarePartner] = useState(false);

  // A real sign-in supersedes any demo session on this device — demo
  // identity/data can never leak into the account.
  const demoActive = demoSession && !user;
  const historySession = user
    ? ({ kind: "firebase", uid: user.uid } as const)
    : demoActive
      ? ({ kind: "demo" } as const)
      : null;
  const { entries, addSession, getSession } = useHistoryStore(historySession);
  const { profile, profileLoading, needsOnboarding, updateProfile } =
    useUserProfile(historySession, user?.displayName);

  useEffect(() => {
    loadTextSizePreference();
  }, []);

  // Clear the stored demo flag once a real sign-in exists (external system).
  useEffect(() => {
    if (!user) return;
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      // Nothing to clear.
    }
  }, [user]);

  // Profile is the source of truth for language + text size: apply once per
  // account when the profile arrives (LanguageProvider persists thereafter).
  const syncedUidRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user || !profile || profile.onboardedAt == null) return;
    if (syncedUidRef.current === user.uid) return;
    syncedUidRef.current = user.uid;
    if (profile.preferred_language !== lang) {
      setLang(profile.preferred_language);
    }
    setTextSizePreference(profile.textSize);
    // lang/setLang intentionally omitted — this is a one-shot per-account sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  const signedIn = Boolean(user) || demoActive;
  const screen = stack[stack.length - 1];

  function push(next: Screen) {
    setStack((current) => [...current, next]);
  }

  function pop() {
    setStack((current) => current.slice(0, -1));
  }

  function resetToTab(nextTab: ShellTab) {
    setStack([]);
    setTab(nextTab);
  }

  function startDemo() {
    try {
      window.localStorage.setItem(SESSION_KEY, "demo");
    } catch {
      // Session stays in memory only.
    }
    setDemoSession(true);
    resetToTab("assessment");
  }

  function handleSignOut() {
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      // Nothing to clear.
    }
    setDemoSession(false);
    setStack([]);
    setTab("assessment");
    syncedUidRef.current = null;
    if (user) {
      signOut().catch(() => {});
    }
  }

  function openResources(segment: ResourceSegment) {
    setResourcesSegment(segment);
    resetToTab("resources");
  }

  // Neutral splash while Firebase restores the session / profile loads.
  if (!hydrated || loading || (signedIn && user && profileLoading)) {
    return (
      <div className="app-viewport">
        <main aria-busy="true" className="app-shell" />
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="app-viewport">
        <main className="app-shell">
          {signedOutCarePartner ? (
            <CarePartnerScreen onBack={() => setSignedOutCarePartner(false)} />
          ) : (
            <SignInScreen
              onCarePartner={() => setSignedOutCarePartner(true)}
              onDemo={startDemo}
            />
          )}
        </main>
      </div>
    );
  }

  // New accounts complete onboarding before anything else.
  if (needsOnboarding && profile) {
    return (
      <div className="app-viewport">
        <main className="app-shell">
          <OnboardingScreen
            initialProfile={profile}
            onComplete={(completed) => updateProfile(completed)}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="app-viewport">
      <main className="app-shell">
        {screen?.name === "assessmentHub" && (
          <AssessmentHubScreen
            demoMode={demoActive}
            onExit={() => resetToTab("assessment")}
            onSaved={(session) => {
              addSession(session);
              // Completing a check counts toward the weekly movement goal.
              markPracticedToday();
              resetToTab("assessment");
            }}
            onViewResources={() => openResources("videos")}
            profile={profile}
          />
        )}
        {screen?.name === "history" && (
          <HistoryScreen
            entries={entries}
            onBack={pop}
            onViewDetail={(entryId) => push({ name: "historyDetail", entryId })}
          />
        )}
        {screen?.name === "historyDetail" && (
          (() => {
            const entry = entries.find((item) => item.id === screen.entryId);
            return entry ? (
              <HistoryDetailScreen
                entry={entry}
                onBack={pop}
                session={getSession(entry.id)}
              />
            ) : (
              <HistoryScreen
                entries={entries}
                onBack={() => setStack([])}
                onViewDetail={(entryId) => push({ name: "historyDetail", entryId })}
              />
            );
          })()
        )}
        {screen?.name === "profile" && (
          <ProfileScreen
            onBack={pop}
            onOpenCarePartner={() => push({ name: "carePartner" })}
            onOpenPrivacy={() => push({ name: "privacy" })}
            onSignOut={handleSignOut}
            profile={profile}
            updateProfile={updateProfile}
          />
        )}
        {screen?.name === "carePartner" && <CarePartnerScreen onBack={pop} />}
        {screen?.name === "privacy" && <PrivacyConsentScreen onBack={pop} />}

        {!screen && (
          <>
            {tab === "assessment" && (
              <AssessmentHome
                entries={entries}
                onOpenExercise={() => openResources("videos")}
                onOpenProfile={() => push({ name: "profile" })}
                onStartAssessment={() => push({ name: "assessmentHub" })}
                onViewHistory={() => push({ name: "history" })}
                onViewHistoryDetail={(entryId) =>
                  push({ name: "historyDetail", entryId })
                }
                profileName={profile?.name || null}
              />
            )}
            {tab === "community" && <CommunityTab />}
            {tab === "resources" && (
              <ResourcesTab
                area={profile?.neighbourhood || null}
                latestRisk={entries[0]?.riskCategory ?? null}
                onSegmentChange={setResourcesSegment}
                segment={resourcesSegment}
              />
            )}
            <TabBar active={tab} onSelect={resetToTab} />
          </>
        )}
      </main>
    </div>
  );
}
