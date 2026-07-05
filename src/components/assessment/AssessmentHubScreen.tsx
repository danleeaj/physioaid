"use client";

import {
  Accessibility,
  Check,
  CircleDashed,
  CircleSlash,
  Dumbbell,
  Footprints,
  HeartPulse,
  Lock,
  MoveHorizontal,
  Play,
  Timer,
} from "lucide-react";
import { useState } from "react";
import { AssessmentResultScreen } from "@/components/dashboard/AssessmentResultScreen";
import { SegmentRunner } from "@/components/assessment/SegmentRunner";
import {
  useAssessmentHub,
  type HubItemId,
  type HubItemStatus,
  type SegmentItemId,
} from "@/components/assessment/useAssessmentHub";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { ConfirmDialog } from "@/components/layout/ConfirmDialog";
import { TopBar } from "@/components/layout/TopBar";
import type { MessageKey } from "@/lib/i18n/messages";
import type { UserProfile } from "@/lib/user-profile";
import type { AssessmentSession } from "@/types/assessment";

/**
 * Assessment Hub — checklist of measures. Six cards per the product spec;
 * the safety check (consent + safety questions) runs automatically before
 * the first movement test of the session, and gate order is enforced via
 * locks. A checkmark means valid saved test data exists.
 */

type HubItemDef = {
  id: HubItemId;
  labelKey: MessageKey;
  Icon: typeof HeartPulse;
  segment?: SegmentItemId;
};

const items: HubItemDef[] = [
  { id: "confidence", labelKey: "hub.item.confidence", Icon: HeartPulse, segment: "confidence" },
  { id: "sitToStand", labelKey: "hub.item.sitToStand", Icon: Accessibility, segment: "sitToStand" },
  { id: "walk", labelKey: "hub.item.walk", Icon: Footprints, segment: "walk" },
  { id: "tug", labelKey: "hub.item.tug", Icon: Timer },
  { id: "exercise", labelKey: "hub.item.exercise", Icon: Dumbbell },
  { id: "functionalReach", labelKey: "hub.item.functionalReach", Icon: MoveHorizontal },
];

const statusKeys: Record<HubItemStatus, MessageKey> = {
  not_started: "hub.status.notStarted",
  in_progress: "hub.status.inProgress",
  completed: "hub.status.completed",
  skipped: "hub.status.skipped",
  locked: "hub.status.locked",
};

function StatusChip({ status, comingSoon }: { status: HubItemStatus; comingSoon?: boolean }) {
  const { t } = useLanguage();
  const Icon =
    status === "completed"
      ? Check
      : status === "locked"
        ? Lock
        : status === "skipped"
          ? CircleSlash
          : CircleDashed;
  return (
    <span className="hub-card__status">
      <Icon aria-hidden size={14} />
      {comingSoon ? t("hub.status.comingSoon") : t(statusKeys[status])}
    </span>
  );
}

export function AssessmentHubScreen({
  demoMode,
  profile,
  onExit,
  onSaved,
  onViewResources,
}: {
  demoMode: boolean;
  profile: UserProfile | null;
  onExit: () => void;
  onSaved: (session: AssessmentSession) => void;
  onViewResources: () => void;
}) {
  const { t } = useLanguage();
  const hub = useAssessmentHub({ demoMode, profile });
  const [confirmExit, setConfirmExit] = useState(false);

  function requestExit() {
    if (hub.hasProgress && !hub.showResult) {
      setConfirmExit(true);
    } else {
      onExit();
    }
  }

  if (hub.showResult) {
    return (
      <>
        <TopBar
          backLabel={t("nav.back")}
          onBack={hub.backFromResult}
          title={t("shell.result.title")}
        />
        <AssessmentResultScreen
          demoMode={demoMode}
          flow={hub.flow}
          onBackToAssessment={onExit}
          onSaveToHistory={onSaved}
          onViewResources={onViewResources}
        />
      </>
    );
  }

  if (hub.activeItem) {
    return (
      <SegmentRunner
        flow={hub.flow}
        onComplete={hub.completeActiveSegment}
        onExit={hub.exitItem}
        segmentSteps={hub.segmentSteps}
        title={
          hub.inPreamble
            ? t("safety.title")
            : t(items.find((item) => item.segment === hub.activeItem)!.labelKey)
        }
      />
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar onBack={requestExit} title={t("hub.title")} />
      <div className="hub-screen pb-[calc(20px+env(safe-area-inset-bottom))]">
        <p className="text-[length:var(--text-label)] text-[var(--muted)]">
          {t("hub.support")}
        </p>

        {hub.blockedBySafety && (
          <p className="callout" role="status">
            {t("hub.safetyPause")}
          </p>
        )}

        {items.map(({ id, labelKey, Icon, segment }) => {
          const status = hub.statuses[id];
          const comingSoon = id === "tug" || id === "functionalReach";
          const locked = status === "locked";
          const startable = Boolean(segment) && !locked;

          return (
            <div className="hub-card" data-locked={locked || undefined} key={id}>
              <div className="min-w-0 flex-1 grid gap-1">
                <p className="hub-card__title">{t(labelKey)}</p>
                <StatusChip comingSoon={comingSoon} status={status} />
                {id === "walk" && locked && !hub.blockedBySafety && (
                  <p className="text-[length:var(--text-caption)] text-[var(--muted)]">
                    {t("hub.lockedAfterSitToStand")}
                  </p>
                )}
                {id === "exercise" && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button className="hub-card__start" onClick={onViewResources} type="button">
                      <span className="inline-flex items-center gap-1">
                        <Play aria-hidden size={14} />
                        {t("hub.exercise.open")}
                      </span>
                    </button>
                    {!hub.exerciseDone && (
                      <button
                        className="link-action !min-h-0 !p-0 text-[length:var(--text-caption)]"
                        onClick={hub.markExerciseDone}
                        type="button"
                      >
                        {t("hub.exercise.markDone")}
                      </button>
                    )}
                  </div>
                )}
              </div>
              {startable && segment && (
                <button
                  className="hub-card__start"
                  onClick={() => hub.startItem(segment)}
                  type="button"
                >
                  {status === "in_progress"
                    ? t("hub.resume")
                    : status === "completed" || status === "skipped"
                      ? t("hub.redo")
                      : t("hub.start")}
                </button>
              )}
              <span aria-hidden className="hub-card__thumb">
                <Icon size={22} />
              </span>
            </div>
          );
        })}

        {demoMode && !hub.flow.demoLoaded && (
          <button className="link-action justify-self-start" onClick={hub.loadDemoAll} type="button">
            {t("shell.flow.loadSample")}
          </button>
        )}

        <div className="mt-auto grid gap-2 pt-3">
          {!hub.canFinish && (
            <p className="text-center text-[length:var(--text-caption)] text-[var(--muted)]">
              {t("hub.finishHint")}
            </p>
          )}
          <button
            className="primary-action w-full"
            disabled={!hub.canFinish}
            onClick={hub.finish}
            type="button"
          >
            {t("hub.finish")}
          </button>
        </div>
      </div>

      {confirmExit && (
        <ConfirmDialog
          body={t("shell.flow.exitBody")}
          cancelLabel={t("shell.flow.exitCancel")}
          confirmLabel={t("shell.flow.exitConfirm")}
          onCancel={() => setConfirmExit(false)}
          onConfirm={onExit}
          title={t("shell.flow.exitTitle")}
        />
      )}
    </div>
  );
}
