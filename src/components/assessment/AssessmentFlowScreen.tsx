"use client";

import { ArrowRight, Check, Dumbbell } from "lucide-react";
import { AssessmentHubScreen } from "@/components/assessment/AssessmentHubScreen";
import { PrecheckScreen } from "@/components/assessment/PrecheckScreen";
import { TestScreen } from "@/components/assessment/TestScreen";
import { useAssessmentFlow } from "@/components/assessment/useAssessmentFlow";
import { useUserProfile } from "@/components/auth/UserProfileProvider";
import { useMovementLog } from "@/components/community/useMovementLog";
import { AssessmentResultScreen } from "@/components/dashboard/AssessmentResultScreen";
import type { HistorySession } from "@/components/dashboard/history-store";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { TopBar } from "@/components/layout/TopBar";
import { shellCopy } from "@/components/layout/copy";
import { toLocalDateKey } from "@/lib/movement-log";
import type { AssessmentSession, TestId } from "@/types/assessment";

/**
 * Assessment hub flow — a card hub replaces the old linear step machine.
 * Participants open the pre-check, each test, or the exercise card in any
 * order; progress lives in a persistent per-identity draft. External props
 * are unchanged, so AppShell's `{name:"flow"}` simply opens the hub.
 */
export function AssessmentFlowScreen({
  demoMode,
  onExit,
  onSaved,
  onViewResources,
}: {
  demoMode: boolean;
  onExit: () => void;
  onSaved: (session: AssessmentSession) => void;
  onViewResources: () => void;
}) {
  const { uid, profile } = useUserProfile();
  // Draft namespace: signed-in users get their own draft; demo mode shares
  // the "demo" namespace (the flow is only reachable when signed in or demo).
  const identity = uid ?? "demo";
  const movementSession: HistorySession = uid
    ? { kind: "firebase", uid }
    : { kind: "demo" };
  const { logs, logActivity } = useMovementLog(movementSession);
  const todayKey = toLocalDateKey(new Date().toISOString());
  const exerciseDoneToday = logs.some(
    (log) =>
      log.source === "exercise" && toLocalDateKey(log.completedAt) === todayKey,
  );
  const flow = useAssessmentFlow({
    identity,
    demoMode,
    exerciseDoneToday,
    profileConsentGiven: profile?.consents.assessmentConsent,
  });
  const { t, lang } = useLanguage();

  if (flow.view === "result") {
    return (
      <>
        <TopBar
          backLabel={t("nav.back")}
          onBack={flow.returnToHub}
          title={shellCopy[lang].result.title}
        />
        <AssessmentResultScreen
          demoMode={demoMode}
          flow={flow}
          onBackToAssessment={onExit}
          onSaveToHistory={onSaved}
          onViewResources={onViewResources}
        />
      </>
    );
  }

  if (flow.view === "precheck") {
    return <PrecheckScreen flow={flow} onClose={flow.returnToHub} />;
  }

  if (flow.view.startsWith("test:")) {
    const testId = flow.view.slice("test:".length) as TestId;
    return <TestScreen flow={flow} onBack={flow.returnToHub} testId={testId} />;
  }

  if (flow.view === "exercise") {
    return (
      <ExerciseScreen
        doneToday={exerciseDoneToday}
        onBack={flow.returnToHub}
        onMarkDone={() => {
          void logActivity({
            source: "exercise",
            activityType: "chair_exercise",
            title: "Guided exercise",
            durationMinutes: null,
          }).catch(() => {});
        }}
        onViewResources={onViewResources}
      />
    );
  }

  return <AssessmentHubScreen demoMode={demoMode} flow={flow} onExit={onExit} />;
}

/**
 * Exercise card — guided videos in Resources. Practice, never assessment
 * evidence: marking it done writes a movement activity log, not a test
 * result.
 */
function ExerciseScreen({
  doneToday,
  onBack,
  onMarkDone,
  onViewResources,
}: {
  doneToday: boolean;
  onBack: () => void;
  onMarkDone: () => void;
  onViewResources: () => void;
}) {
  const { t, lang } = useLanguage();
  const copy = shellCopy[lang].hub;

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar backLabel={t("nav.back")} onBack={onBack} title={copy.exerciseTitle} />
      <div className="app-content flex-1">
        <section className="app-card app-card--hero grid gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--primary-dark)]">
              <Dumbbell aria-hidden size={22} />
            </span>
            <h2 className="text-[length:var(--text-lead)] font-bold">
              {copy.exerciseTitle}
            </h2>
          </div>
          <p className="text-[var(--muted)]">{copy.exerciseBody}</p>
          <button
            className="primary-action w-full"
            onClick={onViewResources}
            type="button"
          >
            {copy.exerciseOpenVideos}
            <ArrowRight aria-hidden size={20} />
          </button>
          {doneToday ? (
            <p className="flex items-center justify-center gap-2 font-semibold text-[var(--primary-dark)]">
              <Check aria-hidden size={20} />
              {copy.exerciseLoggedToday}
            </p>
          ) : (
            <button
              className="secondary-action w-full"
              onClick={onMarkDone}
              type="button"
            >
              {copy.exerciseMarkDone}
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
