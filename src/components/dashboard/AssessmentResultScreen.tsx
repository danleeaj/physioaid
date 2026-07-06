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
import { useMemo, useState } from "react";
import { BandPill } from "@/components/assessment/ui/BandPill";
import { ProfileMatrix } from "@/components/assessment/ui/ProfileMatrix";
import { SafetyCallout } from "@/components/assessment/ui/SafetyCallout";
import { DraftTranslationNote } from "@/components/i18n/DraftTranslationNote";
import { ListenButton } from "@/components/i18n/ListenButton";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserProfile } from "@/components/auth/UserProfileProvider";
import { shellCopy } from "@/components/layout/copy";
import { riskLabel } from "@/components/dashboard/demo-display-data";
import { clinicalText } from "@/lib/i18n/clinical-drafts";
import { profileCopy } from "@/content/clinical-copy";
import { DECISION_SUPPORT_DISCLAIMER } from "@/config/clinical-config";
import { saveSessionForReport } from "@/lib/report-session";
import { saveAssessment } from "@/lib/assessment-history";
import {
  buildSessionFromDraft,
  clearDraft,
  isRecordedMetric,
} from "@/lib/assessment/session-draft";
import type { AssessmentFlow } from "@/components/assessment/useAssessmentFlow";
import type {
  AssessmentSession,
  Demographics,
  RiskCategory,
} from "@/types/assessment";

const STOPPED_NOTICE =
  "The assessment stopped before one or more higher-risk tests. This summary uses completed screening data only.";

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
 * Assessment Result — reached from the hub's "Finish & review". Renders
 * only what was actually attempted: without enough evidence for the scoring
 * engine (`analytics` undefined) it shows an honest partial summary instead
 * of risk bands. Demographics/emergency contact come from the user profile
 * at save time — the flow no longer collects them.
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
  const copy = shellCopy[lang].result;
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [saved, setSaved] = useState(false);
  const { analytics, draft, scoredQuestionnaire, stoppedBeforeHigherRisk } =
    flow;

  const hasQuestionnaire = scoredQuestionnaire !== undefined;
  const hasChairStand = isRecordedMetric(draft.chairStand, draft.demoLoaded);
  const hasWalk = isRecordedMetric(draft.motion, draft.demoLoaded);
  const hasFloorRising = isRecordedMetric(draft.floorRising, draft.demoLoaded);

  const notDone: string[] = [
    !hasQuestionnaire && shellCopy[lang].hub.tests.self_confidence,
    !hasChairStand && shellCopy[lang].hub.tests.sit_to_stand,
    !hasWalk && shellCopy[lang].hub.tests.walk,
    !hasFloorRising && shellCopy[lang].hub.tests.floor_rising,
  ].filter((label) => typeof label === "string");

  // Real name from the profile, or no name line at all — never a fabricated
  // "Demo participant" (demo mode shows Mr Tan via the demo profile).
  const displayName = profile?.displayName.trim() ?? "";

  // Demographics stamped from the profile: display name + living situation,
  // planning area only with research consent. The profile stores an age
  // group, not a numeric age, so age is honestly omitted.
  const profileDemographics = useMemo<Demographics | undefined>(() => {
    if (!profile) return undefined;
    const name = profile.displayName.trim();
    const livingSituation = profile.livingSituation.trim();
    if (!name && !livingSituation) return undefined;
    return {
      displayName: name,
      livingSituation,
      planningArea:
        draft.consent.researchConsent && profile.planningArea
          ? profile.planningArea
          : undefined,
    };
  }, [profile, draft.consent.researchConsent]);

  const floorRiseSkipped =
    hasFloorRising &&
    (draft.floorRising?.completionStatus === "skipped" ||
      draft.floorRising?.completionStatus === "stopped");

  const nextAction = analytics?.recommendations[0];

  function buildSession(): AssessmentSession {
    return buildSessionFromDraft(draft, {
      analytics,
      demographics: profileDemographics,
      emergencyContact: profile?.supportContact ?? undefined,
    });
  }

  function handleSave() {
    if (saved) return;
    const session = buildSession();
    if (user) {
      saveAssessment(user.uid, session).catch(() => {});
    }
    clearDraft(flow.identity);
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
          {displayName ? `${displayName} · Overall status` : "Overall status"}
        </p>
        {analytics ? (
          <AnalyticsHeadline analytics={analytics} />
        ) : (
          <>
            <p className="text-[length:var(--text-title)] font-bold">
              {copy.partialHeadline}
            </p>
            <p className="text-[var(--muted)]">{copy.partialBody}</p>
          </>
        )}
      </section>
      <DraftTranslationNote />

      {/* What we found — tiles only for what was actually attempted */}
      <section className="grid gap-3">
        <h2 className="px-1 text-[length:var(--text-body)] font-bold">What we found</h2>
        {analytics && (
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
        )}
        <div className="grid grid-cols-2 gap-3">
          {hasQuestionnaire && scoredQuestionnaire && (
            <div className="stat-tile">
              <p className="text-[length:var(--text-caption)] font-bold text-[var(--muted)]">
                {t("dashboard.metrics.confidenceAverage")}
              </p>
              <p className="mt-1 text-xl font-bold leading-tight">
                {scoredQuestionnaire.averageScore.toFixed(1)} / 10
              </p>
            </div>
          )}
          {hasChairStand && draft.chairStand && (
            <div className="stat-tile">
              <p className="text-[length:var(--text-caption)] font-bold text-[var(--muted)]">
                {t("dashboard.metrics.chairStand")}
              </p>
              <p className="mt-1 text-xl font-bold leading-tight">
                {draft.chairStand.completionStatus === "stopped"
                  ? t("status.stopped")
                  : `${draft.chairStand.durationSeconds}s`}
              </p>
            </div>
          )}
          {hasWalk && draft.motion && (
            <div className="stat-tile">
              <p className="text-[length:var(--text-caption)] font-bold text-[var(--muted)]">
                {t("dashboard.metrics.gait")}
              </p>
              <p className="mt-1 text-xl font-bold leading-tight">
                {draft.motion.completionStatus === "stopped"
                  ? t("status.stopped")
                  : `${draft.motion.gaitSpeedMetersPerSecond ?? 0} m/s`}
              </p>
            </div>
          )}
          {hasFloorRising && draft.floorRising && (
            <div className="stat-tile">
              <p className="text-[length:var(--text-caption)] font-bold text-[var(--muted)]">
                {t("dashboard.metrics.floorRising")}
              </p>
              <p className="mt-1 text-xl font-bold capitalize leading-tight">
                {t(`status.${draft.floorRising.completionStatus}`)}
              </p>
            </div>
          )}
        </div>
        {notDone.length > 0 && (
          <p className="px-1 text-[length:var(--text-label)] text-[var(--muted)]">
            {copy.notDonePrefix} {notDone.join(", ")}
          </p>
        )}
        {floorRiseSkipped && (
          <p className="px-1 text-[length:var(--text-label)] text-[var(--muted)]">
            Skipping a movement that does not feel safe today is a sensible
            choice, not a failure.
          </p>
        )}
      </section>

      {/* Ability–confidence quadrant — needs the full scoring output */}
      {analytics && (
        <section className="app-card grid gap-3">
          <h2 className="text-[length:var(--text-body)] font-bold">
            {t("dashboard.profileTitle")}
          </h2>
          <ProfileMatrix activeProfile={analytics.profile} />
        </section>
      )}

      {/* Risk — text + icon, never colour-only */}
      {analytics && <RiskSection analytics={analytics} />}

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
              {copy.savedOnDevice}
            </>
          ) : (
            copy.saveToHistory
          )}
        </button>
        {/* Clinician handoff — physio / OT / doctor opens the printable report */}
        <button className="secondary-action w-full" onClick={openReport} type="button">
          <FileText aria-hidden size={20} />
          {copy.openReport}
        </button>
        <button className="secondary-action w-full" onClick={onViewResources} type="button">
          {copy.viewResources}
          <ArrowRight aria-hidden size={20} />
        </button>
        <button className="secondary-action w-full" onClick={onBackToAssessment} type="button">
          {copy.backToAssessment}
        </button>
      </section>

      <p className="text-[length:var(--text-label)] text-[var(--muted)]">
        {clinicalText(lang, "disclaimer.decisionSupport", DECISION_SUPPORT_DISCLAIMER)}
      </p>
    </div>
  );
}

function AnalyticsHeadline({
  analytics,
}: {
  analytics: NonNullable<AssessmentFlow["analytics"]>;
}) {
  const { lang } = useLanguage();
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

  return (
    <>
      <p className="text-[length:var(--text-title)] font-bold">{overallStatus}</p>
      <p className="font-bold">{profileTitle}</p>
      <p className="text-[var(--muted)]">{interpretation}</p>
      <div>
        <ListenButton text={`${overallStatus}. ${profileTitle}. ${interpretation}`} />
      </div>
    </>
  );
}

function RiskSection({
  analytics,
}: {
  analytics: NonNullable<AssessmentFlow["analytics"]>;
}) {
  const { t } = useLanguage();
  const riskSupport = getRiskSupportCopy(analytics.riskCategory);
  const RiskIcon = riskIcons[analytics.riskCategory];
  return (
    <section className="signal-card flex items-start gap-3">
      <RiskIcon aria-hidden className="mt-0.5 shrink-0 text-[var(--primary)]" size={26} />
      <div>
        <p className="text-[length:var(--text-label)] font-bold text-[var(--muted-strong)]">
          {t("dashboard.riskTitle")}
        </p>
        <p className="mt-1 text-[length:var(--text-lead)] font-bold">
          {t(`band.risk.${analytics.riskCategory}`)}
        </p>
        <p className="mt-1 text-[var(--muted)]">{riskSupport}</p>
      </div>
    </section>
  );
}
