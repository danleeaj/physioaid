"use client";

import {
  AlertTriangle,
  ArrowRight,
  FileText,
  HeartHandshake,
  OctagonAlert,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CommunityMomentumCard } from "@/components/community/CommunityMomentumCard";
import { BandPill } from "@/components/assessment/ui/BandPill";
import { ProfileMatrix } from "@/components/assessment/ui/ProfileMatrix";
import { SafetyCallout } from "@/components/assessment/ui/SafetyCallout";
import { DraftTranslationNote } from "@/components/i18n/DraftTranslationNote";
import { ListenButton } from "@/components/i18n/ListenButton";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { clinicalText } from "@/lib/i18n/clinical-drafts";
import { careLinkageOptions } from "@/content/care-linkage";
import { profileCopy } from "@/content/clinical-copy";
import { DECISION_SUPPORT_DISCLAIMER } from "@/config/clinical-config";
import { saveSessionForReport } from "@/lib/report-session";
import type { AssessmentFlow } from "@/components/assessment/useAssessmentFlow";
import type { AssessmentSession, RiskCategory } from "@/types/assessment";

const STOPPED_NOTICE =
  "The assessment stopped before one or more higher-risk tests. The dashboard uses completed and demo-safe screening data only.";

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

export function DashboardScreen({ flow }: { flow: AssessmentFlow }) {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const {
    analytics,
    demographics,
    contact,
    safety,
    scoredQuestionnaire,
    chairStand,
    motion,
    floorRising,
    stoppedBeforeHigherRisk,
  } = flow;

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

  function openReport() {
    const session: AssessmentSession = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `session-${Date.now()}`,
      createdAt: new Date().toISOString(),
      consent: { assessmentConsent: true, researchConsent: false },
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
    const id = saveSessionForReport(session);
    router.push(`/report/${id}`);
  }

  return (
    <section className="grid gap-6">
      {stoppedBeforeHigherRisk && (
        <SafetyCallout tone="danger">{STOPPED_NOTICE}</SafetyCallout>
      )}

      {/* 1 · Hero — the ability-confidence profile statement */}
      <header className="grid gap-3">
        <p className="eyebrow">
          {demographics.displayName || "Demo participant"}, {demographics.age} ·{" "}
          {t("dashboard.eyebrow")}
        </p>
        <h1 className="max-w-3xl text-[length:var(--text-title)] font-semibold sm:text-[length:var(--text-display)]">
          {profileTitle}
        </h1>
        <p className="max-w-3xl text-[length:var(--text-lead)] text-[var(--muted)]">
          {interpretation}
        </p>
        <div>
          <ListenButton text={`${profileTitle}. ${interpretation}`} />
        </div>
      </header>
      <DraftTranslationNote />

      {/* 2 · Ability + Confidence side by side */}
      <div className="grid gap-4 sm:grid-cols-2">
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

      {/* 3 · The signature 2×2 profile quadrant */}
      <div className="panel-card grid gap-4 p-5 sm:p-6">
        <h2 className="text-[length:var(--text-lead)] font-semibold">
          {t("dashboard.profileTitle")}
        </h2>
        <ProfileMatrix activeProfile={analytics.profile} />
      </div>

      {/* 4 · Supporting measurements */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="stat-tile">
          <p className="text-[length:var(--text-caption)] font-bold text-[var(--muted)]">
            {t("dashboard.metrics.chairStand")}
          </p>
          <p className="mt-1 text-xl font-bold leading-tight">
            {chairStand.repetitions} reps · {chairStand.durationSeconds}s
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
        <div className="stat-tile">
          <p className="text-[length:var(--text-caption)] font-bold text-[var(--muted)]">
            {t("dashboard.metrics.confidenceAverage")}
          </p>
          <p className="mt-1 text-xl font-bold leading-tight">
            {scoredQuestionnaire.averageScore.toFixed(1)} / 10
          </p>
        </div>
      </div>

      {/* 5 · Risk category — text + icon, never colour-only */}
      <div className="signal-card flex items-start gap-3">
        <RiskIcon
          aria-hidden
          className="mt-0.5 shrink-0 text-[var(--primary)]"
          size={26}
        />
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
      </div>

      {/* 6 · Recommendations */}
      <div className="grid gap-3">
        <h2 className="text-[length:var(--text-lead)] font-semibold">
          {t("dashboard.recommendationsTitle")}
        </h2>
        {analytics.recommendations.map((recommendation) => (
          <div
            className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-4"
            key={recommendation.id}
          >
            <p className="font-bold">
              {clinicalText(
                lang,
                `recommendation.${recommendation.id}.title`,
                recommendation.title,
              )}
            </p>
            <p className="mt-1 text-[var(--muted)]">
              {clinicalText(
                lang,
                `recommendation.${recommendation.id}.body`,
                recommendation.body,
              )}
            </p>
          </div>
        ))}
      </div>

      {/* 7 · Care linkage */}
      <div className="grid gap-3">
        <h2 className="text-[length:var(--text-lead)] font-semibold">
          {t("dashboard.careLinkageTitle")}
        </h2>
        <div className="quiet-card divide-y divide-[var(--line)]">
          {careLinkageOptions.map((option) => (
            <div className="flex items-center gap-4 p-4" key={option.id}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary-dark)]">
                <HeartHandshake aria-hidden size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {clinicalText(
                    lang,
                    `careLinkage.${option.id}.title`,
                    option.title,
                  )}
                </p>
                <p className="text-[length:var(--text-label)] text-[var(--muted)]">
                  {clinicalText(
                    lang,
                    `careLinkage.${option.id}.description`,
                    option.description,
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 8 · Export / share + onward journey */}
      <div className="quiet-card grid gap-4 p-5">
        <p className="text-[length:var(--text-label)] text-[var(--muted)]">
          {clinicalText(
            lang,
            "disclaimer.decisionSupport",
            DECISION_SUPPORT_DISCLAIMER,
          )}
        </p>
        <button className="primary-action w-fit" onClick={openReport} type="button">
          <FileText aria-hidden size={22} />
          {t("nav.openReport")}
          <ArrowRight aria-hidden size={20} />
        </button>
      </div>

      <CommunityMomentumCard />
    </section>
  );
}
