"use client";

import {
  Armchair,
  Check,
  CircleDashed,
  CircleDot,
  ClipboardCheck,
  Dumbbell,
  Footprints,
  Lock,
  MinusCircle,
  PersonStanding,
  Ruler,
  Smile,
  Timer,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import type { AssessmentFlow } from "@/components/assessment/useAssessmentFlow";
import { LangSwitch } from "@/components/i18n/LangSwitch";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { ConfirmDialog } from "@/components/layout/ConfirmDialog";
import { TopBar } from "@/components/layout/TopBar";
import { shellCopy, type ShellCopy } from "@/components/layout/copy";
import type { HubCard } from "@/lib/assessment/hub-state";
import type { TestId } from "@/types/assessment";

const testIcons: Record<TestId, LucideIcon> = {
  self_confidence: Smile,
  sit_to_stand: Armchair,
  walk: Footprints,
  floor_rising: PersonStanding,
  timed_up_and_go: Timer,
  functional_reach: Ruler,
};

/** Status line — icon + words, never colour-only. */
function statusFor(
  card: HubCard,
  copy: ShellCopy["hub"],
): { icon: LucideIcon; text: string } {
  switch (card.state) {
    case "locked":
      return {
        icon: Lock,
        text:
          card.lockedReason === "prerequisite" && card.detail
            ? card.detail
            : copy.locks[card.lockedReason ?? "prerequisite"],
      };
    case "completed":
      return {
        icon: Check,
        text: card.detail ? `${copy.status.done} · ${card.detail}` : copy.status.done,
      };
    case "skipped":
      return { icon: MinusCircle, text: card.detail ?? copy.status.skipped };
    case "in_progress":
      return {
        icon: CircleDot,
        text: card.detail
          ? `${copy.status.inProgress} · ${card.detail}`
          : copy.status.inProgress,
      };
    case "available":
      return { icon: CircleDashed, text: copy.status.available };
    default:
      return { icon: CircleDashed, text: copy.status.notStarted };
  }
}

function actionLabelFor(card: HubCard, copy: ShellCopy["hub"]): string | null {
  switch (card.state) {
    case "locked":
      return null;
    case "not_started":
      return copy.actions.start;
    case "in_progress":
      return copy.actions.continue;
    case "available":
      return copy.actions.open;
    default:
      return copy.actions.redo;
  }
}

/** One 78px hub row: title + status left, action button + icon right. */
function HubRow({
  title,
  support,
  statusIcon: StatusIcon,
  statusText,
  actionLabel,
  onAction,
  icon: Icon,
  dimmed = false,
}: {
  title: string;
  support?: string;
  statusIcon: LucideIcon;
  statusText: string;
  actionLabel: string | null;
  onAction?: () => void;
  icon: LucideIcon;
  dimmed?: boolean;
}) {
  return (
    <div
      className={`flex min-h-[78px] items-center gap-3 rounded-[var(--radius-card)] bg-[#e7e7e7] px-4 py-3 ${
        dimmed ? "opacity-70" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="font-bold">{title}</p>
        {support && (
          <p className="text-[length:var(--text-caption)] text-[var(--muted)]">
            {support}
          </p>
        )}
        <p className="mt-0.5 flex items-center gap-1.5 text-[length:var(--text-label)] text-[var(--muted-strong)]">
          <StatusIcon aria-hidden className="shrink-0" size={16} />
          {statusText}
        </p>
      </div>
      {actionLabel && onAction && (
        <button
          className="secondary-action inline-action shrink-0"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      )}
      <span
        aria-hidden
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--primary)]"
      >
        <Icon size={22} />
      </span>
    </div>
  );
}

/**
 * Assessment hub — every check is a card the participant opens in any order.
 * Locks are derived (consent → safety → escalating-risk gates) and always
 * explained in words next to a lock icon.
 */
export function AssessmentHubScreen({
  flow,
  demoMode,
  onExit,
}: {
  flow: AssessmentFlow;
  demoMode: boolean;
  onExit: () => void;
}) {
  const { t, lang } = useLanguage();
  const copy = shellCopy[lang].hub;
  const [confirmStartOver, setConfirmStartOver] = useState(false);

  const { hubCards, precheckComplete, canFinish, demoLoaded } = flow;
  const consentGiven = flow.consent.assessmentConsent;

  const precheckStatus = precheckComplete
    ? { icon: Check, text: copy.precheckDone }
    : consentGiven
      ? { icon: CircleDot, text: copy.status.inProgress }
      : { icon: CircleDashed, text: copy.status.notStarted };
  const precheckAction = precheckComplete
    ? copy.actions.redo
    : consentGiven
      ? copy.actions.continue
      : copy.actions.start;
  const PrecheckStatusIcon = precheckStatus.icon;

  const testCards = hubCards.filter((card) => card.id !== "exercise");
  const exerciseCard = hubCards.find((card) => card.id === "exercise");

  return (
    <div className="flex min-h-dvh flex-col bg-[#f7f7f7]">
      <TopBar
        backLabel={t("nav.back")}
        onBack={onExit}
        right={
          <button className="link-action shrink-0" onClick={onExit} type="button">
            <X aria-hidden size={18} />
            {shellCopy[lang].flow.exit}
          </button>
        }
        title={copy.title}
      />
      {/* Language switcher on its own scrollable row — four languages never fit the top bar */}
      <div className="overflow-x-auto px-5 pt-3">
        <LangSwitch />
      </div>

      <div className="app-content flex-1">
        <p className="px-1 text-[length:var(--text-label)] text-[var(--muted)]">
          {copy.intro}
        </p>

        {/* Sample answers are opt-in — a new assessment always starts empty */}
        {demoMode && (
          <div>
            {demoLoaded ? (
              <p
                aria-live="polite"
                className="text-[length:var(--text-label)] text-[var(--muted-strong)]"
              >
                {shellCopy[lang].flow.sampleLoaded}
              </p>
            ) : (
              <button className="link-action" onClick={flow.loadDemo} type="button">
                {shellCopy[lang].flow.loadSample}
              </button>
            )}
          </div>
        )}

        {/* Consent & safety check — required once before the tests */}
        <HubRow
          actionLabel={precheckAction}
          icon={ClipboardCheck}
          onAction={flow.openPrecheck}
          statusIcon={PrecheckStatusIcon}
          statusText={precheckStatus.text}
          support={precheckComplete ? undefined : copy.precheckSupport}
          title={copy.precheckTitle}
        />

        <h2 className="px-1 text-[length:var(--text-body)] font-bold">
          {copy.testsHeading}
        </h2>
        <div className="grid gap-2">
          {testCards.map((card) => {
            const testId = card.id as TestId;
            const status = statusFor(card, copy);
            const actionLabel = actionLabelFor(card, copy);
            return (
              <HubRow
                actionLabel={actionLabel}
                dimmed={card.lockedReason === "coming_soon"}
                icon={testIcons[testId]}
                key={card.id}
                onAction={
                  actionLabel ? () => flow.openCard(card.id) : undefined
                }
                statusIcon={status.icon}
                statusText={status.text}
                title={copy.tests[testId]}
              />
            );
          })}
        </div>

        <h2 className="px-1 text-[length:var(--text-body)] font-bold">
          {copy.activityHeading}
        </h2>
        {exerciseCard && (
          <HubRow
            actionLabel={actionLabelFor(exerciseCard, copy)}
            icon={Dumbbell}
            onAction={() => flow.openCard("exercise")}
            statusIcon={statusFor(exerciseCard, copy).icon}
            statusText={statusFor(exerciseCard, copy).text}
            support={copy.exerciseSupport}
            title={copy.exerciseTitle}
          />
        )}

        {/* Finish & start over */}
        <section className="grid gap-3 pt-2">
          <button
            className="primary-action w-full"
            disabled={!canFinish}
            onClick={flow.finish}
            type="button"
          >
            {copy.finish}
          </button>
          {!canFinish && (
            <p className="px-1 text-center text-[length:var(--text-label)] text-[var(--muted)]">
              {copy.finishHint}
            </p>
          )}
          <button
            className="link-action justify-self-center"
            onClick={() => setConfirmStartOver(true)}
            type="button"
          >
            {copy.startOver}
          </button>
        </section>
      </div>

      {confirmStartOver && (
        <ConfirmDialog
          body={copy.startOverBody}
          cancelLabel={copy.startOverCancel}
          confirmLabel={copy.startOverConfirm}
          onCancel={() => setConfirmStartOver(false)}
          onConfirm={() => {
            setConfirmStartOver(false);
            flow.startOver();
          }}
          title={copy.startOverTitle}
        />
      )}
    </div>
  );
}
