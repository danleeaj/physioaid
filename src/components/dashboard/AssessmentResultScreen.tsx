"use client";

import {
  AlertTriangle,
  ArrowRight,
  Check,
  FileText,
  OctagonAlert,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BandPill } from "@/components/assessment/ui/BandPill";
import { ProfileMatrix } from "@/components/assessment/ui/ProfileMatrix";
import { SafetyCallout } from "@/components/assessment/ui/SafetyCallout";
import { DraftTranslationNote } from "@/components/i18n/DraftTranslationNote";
import { ListenButton } from "@/components/i18n/ListenButton";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { riskLabel } from "@/components/dashboard/demo-display-data";
import { clinicalText } from "@/lib/i18n/clinical-drafts";
import { profileCopy } from "@/content/clinical-copy";
import { DECISION_SUPPORT_DISCLAIMER } from "@/config/clinical-config";
import { saveSessionForReport } from "@/lib/report-session";
import { saveAssessment } from "@/lib/assessment-history";
import type { AssessmentFlow } from "@/components/assessment/useAssessmentFlow";
import type { AssessmentSession, RiskCategory } from "@/types/assessment";

const STOPPED_NOTICE =
  "The assessment stopped before one or more higher-risk tests. This summary uses completed and demo-safe screening data only.";

function getRiskSupportCopy(riskCategory: RiskCategory) {
  if (riskCategory === "high") {
    return "Pause higher-risk testing and consider supported review.";
  }
  if (riskCategory === "moderate") {
    return "Community or supervised support may help preserve safe mobility.";
  }
  return "Maintain activity and monitor changes over time.";
}

const riskIcons = {
  low: ShieldCheck,
  moderate: AlertTriangle,
  high: OctagonAlert,
} as const;

/**
 * Assessment Result — shown when the guided flow reaches its final step.
 * Plain language first, metrics as supporting detail. All values come from
 * the untouched scoring engine via `flow.analytics`.
 */
export function AssessmentResultScreen({
  flow,
  demoMode = false,
  onSaveToHistory,
  onViewResources,
  onBackToAssessment,
}: {
  flow: AssessmentFlow;
  demoMode?: boolean;
  onSaveToHistory: (session: AssessmentSession) => void;
  onViewResources: () => void;
  onBackToAssessment: () => void;
}) {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const {
    analytics,
    demographics,
    contact,
    consent,
    safety,
    scoredQuestionnaire,
    chairStand,
    motion,
    floorRising,
    stoppedBeforeHigherRisk,
  } = flow;

  const overallStatus = riskLabel(analytics.riskCategory);
  const profileTitle = clinicalText(
    lang,
    `profile.${analytics.profile}.title`,
    profileCopy[analytics.profile].title,
  );
  const interpretation = clinicalText(
    lang,
    `profile.${analytics.profile}.interpretation`,
    analytics.interpretation,
  );
  const RiskIcon = riskIcons[analytics.riskCategory];
  const floorRiseSkipped =
    floorRising.completionStatus === "skipped" ||
    floorRising.completionStatus === "stopped";
  const nextAction = analytics.recommendations[0];

  function buildSession(): AssessmentSession {
    return {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `session-${Date.now()}`,
      createdAt: new Date().toISOString(),
      consent,
      emergencyContact: contact,
      demographics,
      safetyScreen: safety,
      questionnaire: scoredQuestionnaire,
      chairStand,
      motion,
      floorRising,
      analytics,
      report: {
        id: "report",
        generatedAt: new Date().toISOString(),
        disclaimer: DECISION_SUPPORT_DISCLAIMER,
      },
    };
  }

  function handleSave() {
    if (saved) return;
    const session = buildSession();
    if (user) {
      saveAssessment(user.uid, session).catch(() => {});
    }
    setSaved(true);
    onSaveToHistory(session);
  }

  function openReport() {
    const id = saveSessionForReport(buildSession());
    router.push(`/report/${id}`);
  }

  return (
    <div className="app-content pb-[calc(20px+env(safe-area-inset-bottom))]">
      {stoppedBeforeHigherRisk && (
        <SafetyCallout tone="danger">{STOPPED_NOTICE}</SafetyCallout>
      )}

      {/* Overall status — meaning first, numbers second */}
      <section className="app-card app-card--hero grid gap-2">
        <p className="text-[length:var(--text-caption)] font-bold uppercase tracking-wide text-[var(--muted)]">
          {demographics.displayName || "Demo participant"} · Overall status
        </p>
        <p className="text-[length:var(--text-title)] font-bold">{overallStatus}</p>
        <p className="font-bold">{profileTitle}</p>
        <p className="text-[var(--muted)]">{interpretation}</p>
        <div>
          <ListenButton text={`${overallStatus}. ${profileTitle}. ${interpretation}`} />
        </div>
      </section>
      <DraftTranslationNote />

      {/* What we found */}
      <section className="grid gap-3">
        <h2 className="px-1 text-[length:var(--text-body)] font-bold">What we found</h2>
        <div className="grid grid-cols-2 gap-3">
          <BandPill
            bandLabel={t(`band.ability.${analytics.abilityBand}`)}
            kind="ability"
            label={t("dashboard.ability")}
            positive={analytics.abilityBand === "good"}
          />
          <BandPill
            bandLabel={t(`band.confidence.${analytics.confidenceBand}`)}
            kind="confidence"
            label={t("dashboard.confidence")}
            positive={analytics.confidenceBand === "good"}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="stat-tile">
            <p className="text-[length:var(--text-caption)] font-bold text-[var(--muted)]">
              {t("dashboard.metrics.confidenceAverage")}
            </p>
            <p className="mt-1 text-xl font-bold leading-tight">
              {scoredQuestionnaire.averageScore.toFixed(1)} / 10
            </p>
          </div>
          <div className="stat-tile">
            <p className="text-[length:var(--text-caption)] font-bold text-[var(--muted)]">
              {t("dashboard.metrics.chairStand")}
            </p>
            <p className="mt-1 text-xl font-bold leading-tight">
              {chairStand.durationSeconds}s
            </p>
          </div>
          <div className="stat-tile">
            <p className="text-[length:var(--text-caption)] font-bold text-[var(--muted)]">
              {t("dashboard.metrics.gait")}
            </p>
            <p className="mt-1 text-xl font-bold leading-tight">
              {motion.gaitSpeedMetersPerSecond ?? 0} m/s
            </p>
          </div>
          <div className="stat-tile">
            <p className="text-[length:var(--text-caption)] font-bold text-[var(--muted)]">
              {t("dashboard.metrics.floorRising")}
            </p>
            <p className="mt-1 text-xl font-bold capitalize leading-tight">
              {t(`status.${floorRising.completionStatus}`)}
            </p>
          </div>
        </div>
        {floorRiseSkipped && (
          <p className="px-1 text-[length:var(--text-label)] text-[var(--muted)]">
            Skipping a movement that does not feel safe today is a sensible
            choice, not a failure.
          </p>
        )}
      </section>

      {/* Ability–confidence quadrant */}
      <section className="app-card grid gap-3">
        <h2 className="text-[length:var(--text-body)] font-bold">
          {t("dashboard.profileTitle")}
        </h2>
        <ProfileMatrix activeProfile={analytics.profile} />
      </section>

      {/* Risk — text + icon, never colour-only */}
      <section className="signal-card flex items-start gap-3">
        <RiskIcon aria-hidden className="mt-0.5 shrink-0 text-[var(--primary)]" size={26} />
        <div>
          <p className="text-[length:var(--text-label)] font-bold text-[var(--muted-strong)]">
            {t("dashboard.riskTitle")}
          </p>
          <p className="mt-1 text-[length:var(--text-lead)] font-bold">
            {t(`band.risk.${analytics.riskCategory}`)}
          </p>
          <p className="mt-1 text-[var(--muted)]">
            {getRiskSupportCopy(analytics.riskCategory)}
          </p>
        </div>
      </section>

      {/* Recommended next action */}
      {nextAction && (
        <section className="app-card grid gap-1 border-[var(--primary)]">
          <p className="text-[length:var(--text-caption)] font-bold uppercase tracking-wide text-[var(--muted)]">
            Recommended next action
          </p>
          <p className="font-bold">
            {clinicalText(lang, `recommendation.${nextAction.id}.title`, nextAction.title)}
          </p>
          <p className="text-[var(--muted)]">
            {clinicalText(lang, `recommendation.${nextAction.id}.body`, nextAction.body)}
          </p>
        </section>
      )}

      {demoMode && (
        <p className="px-1 text-[length:var(--text-label)] text-[var(--muted)]">
          This is today’s new check. It may differ from the sample history shown
          in the demo.
        </p>
      )}

      {/* Actions */}
      <section className="grid gap-3">
        <button className="primary-action w-full" disabled={saved} onClick={handleSave} type="button">
          {saved ? (
            <>
              <Check aria-hidden size={22} />
              {t("shell.result.savedOnDevice")}
            </>
          ) : (
            t("shell.result.saveToHistory")
          )}
        </button>
        {/* Clinician handoff — physio / OT / doctor opens the printable report */}
        <button className="secondary-action w-full" onClick={openReport} type="button">
          <FileText aria-hidden size={20} />
          {t("shell.result.openReport")}
        </button>
        <button className="secondary-action w-full" onClick={onViewResources} type="button">
          {t("shell.result.viewResources")}
          <ArrowRight aria-hidden size={20} />
        </button>
        <button className="secondary-action w-full" onClick={onBackToAssessment} type="button">
          {t("shell.result.backToAssessment")}
        </button>
      </section>

      <p className="text-[length:var(--text-label)] text-[var(--muted)]">
        {clinicalText(lang, "disclaimer.decisionSupport", DECISION_SUPPORT_DISCLAIMER)}
      </p>
    </div>
  );
}
