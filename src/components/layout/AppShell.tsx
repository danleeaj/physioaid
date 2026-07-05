"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AssessmentFlowScreen } from "@/components/assessment/AssessmentFlowScreen";
import { useAuth } from "@/components/auth/AuthProvider";
import { AssessmentHome } from "@/components/dashboard/AssessmentHome";
import { CarePartnerScreen } from "@/components/dashboard/CarePartnerScreen";
import { HistoryDetailScreen } from "@/components/dashboard/HistoryDetailScreen";
import { HistoryScreen } from "@/components/dashboard/HistoryScreen";
import { PrivacyConsentScreen } from "@/components/dashboard/PrivacyConsentScreen";
import {
  ProfileScreen,
  loadTextSizePreference,
} from "@/components/dashboard/ProfileScreen";
import { useHistoryStore } from "@/components/dashboard/history-store";
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
  | { name: "flow" }
  | { name: "history" }
  | { name: "historyDetail"; entryId: string }
  | { name: "profile" }
  | { name: "carePartner" }
  | { name: "privacy" };

/**
 * Mobile app shell: Sign In when signed out; bottom-tab app (Assessment /
 * Community / Resources) plus a secondary-screen stack when signed in.
 * "Signed in" is Firebase auth OR the local Mr Tan demo session.
 */
export function AppShell() {
  const { user, loading, signOut } = useAuth();
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
  const { entries, addEntry } = useHistoryStore();

  useEffect(() => {
    loadTextSizePreference();
  }, []);

  const signedIn = Boolean(user) || demoSession;
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
    if (user) {
      signOut().catch(() => {});
    }
  }

  function openResources(segment: ResourceSegment) {
    setResourcesSegment(segment);
    resetToTab("resources");
  }

  // Neutral splash while Firebase restores the session — avoids a Sign In flash.
  if (!hydrated || loading) {
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

  return (
    <div className="app-viewport">
      <main className="app-shell">
        {screen?.name === "flow" && (
          <AssessmentFlowScreen
            demoMode={demoSession}
            onExit={() => resetToTab("assessment")}
            onSaved={(entry) => {
              addEntry(entry);
              resetToTab("assessment");
            }}
            onViewResources={() => openResources("videos")}
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
              <HistoryDetailScreen entry={entry} onBack={pop} />
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
                onStartAssessment={() => push({ name: "flow" })}
                onViewHistory={() => push({ name: "history" })}
                onViewHistoryDetail={(entryId) =>
                  push({ name: "historyDetail", entryId })
                }
              />
            )}
            {tab === "community" && <CommunityTab />}
            {tab === "resources" && (
              <ResourcesTab
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
