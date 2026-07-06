"use client";

import { Printer } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { DECISION_SUPPORT_DISCLAIMER } from "@/config/clinical-config";
import { safetyQuestions } from "@/config/clinical-config";
import { profileCopy } from "@/content/clinical-copy";
import { analyseAssessment } from "@/lib/analytics/ability-confidence";
import { getAssessment } from "@/lib/assessment-history";
import { createDemoSession } from "@/lib/demo-session";
import { loadSessionForReport } from "@/lib/report-session";
import type { AssessmentSession } from "@/types/assessment";

const riskLabels = {
  low: "Low — maintain and monitor",
  moderate: "Moderate — support recommended",
  high: "High — seek support or professional review",
} as const;

/**
 * Resolution of the report id to a session, tracked as a discriminated union
 * so `createDemoSession()` is reachable only for explicit demo ids — never
 * as a silent fallback for a report that could not be found.
 */
type ReportResolution =
  | { mode: "loading" }
  | { mode: "demo"; session: AssessmentSession }
  | { mode: "user"; session: AssessmentSession }
  | { mode: "not_found"; signedIn: boolean };

function Field({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-[length:var(--text-body)]">
      <strong className="font-bold">{label}:</strong>{" "}
      <span className="text-[var(--muted-strong)]">{value}</span>
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-8 border-b border-[var(--line)] pb-2 text-[length:var(--text-lead)] font-bold">
      {children}
    </h2>
  );
}

/**
 * Professional-facing screening report — structured labelled prose a
 * clinician can scan, not consumer tiles.
 */
export function ReportView({ id }: { id: string }) {
  const { user, loading: authLoading } = useAuth();
  const [resolution, setResolution] = useState<ReportResolution>({
    mode: "loading",
  });

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      // 1. Explicit demo ids — the only path that may reach demo data.
      if (id === "demo" || id === "sample") {
        setResolution({ mode: "demo", session: createDemoSession() });
        return;
      }

      // 2. sessionStorage fast-path (same tab that generated the report).
      const stored = loadSessionForReport(id);
      if (stored) {
        setResolution({ mode: "user", session: stored });
        return;
      }

      // Wait for Firebase auth to settle before deciding signed-in vs not —
      // shows the existing "Preparing report…" placeholder meanwhile.
      if (authLoading) {
        return;
      }

      // 3. Signed-in fallback: look the session up in Firestore.
      if (user) {
        try {
          const remote = await getAssessment(user.uid, id);
          if (cancelled) return;
          if (remote) {
            setResolution({ mode: "user", session: remote });
            return;
          }
        } catch {
          // Treat any read error (including a rules denial for another
          // user's report) as not found — never fall back to demo data.
        }
      }

      // 4. Honest not-found state — no clinical content.
      if (!cancelled) {
        setResolution({ mode: "not_found", signedIn: Boolean(user) });
      }
    }

    resolve();

    return () => {
      cancelled = true;
    };
  }, [id, user, authLoading]);

  if (resolution.mode === "loading") {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-5 py-8">
        <p className="text-[var(--muted)]">Preparing report…</p>
      </main>
    );
  }

  if (resolution.mode === "not_found") {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-5 py-8">
        <div className="panel-card grid gap-3 p-6 sm:p-10">
          <h1 className="text-[length:var(--text-display)] font-semibold">
            Report not found
          </h1>
          <p className="text-[var(--muted-strong)]">
            We couldn&apos;t find this report. Reports open from the History
            screen of the account or device that saved them.
          </p>
          {!resolution.signedIn && (
            <p className="text-[var(--muted-strong)]">
              Sign in to open reports saved to your account.
            </p>
          )}
          <div>
            <Link className="secondary-action" href="/">
              Back to assessment
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { session } = resolution;
  const isDemo = resolution.mode === "demo";

  const analytics =
    session.analytics ??
    analyseAssessment({
      questionnaire: session.questionnaire,
      chairStand: session.chairStand,
      motion: session.motion,
    });
  const generatedAt = session.report?.generatedAt ?? session.createdAt;
  const flaggedSafety = safetyQuestions.filter((question) =>
    Boolean(session.safetyScreen[question.id]),
  );

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-8">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link className="secondary-action" href="/">
          Back to assessment
        </Link>
        <button
          className="secondary-action"
          onClick={() => window.print()}
          type="button"
        >
          <Printer aria-hidden size={20} />
          Print / Save PDF
        </button>
      </div>

      {isDemo && (
        <div className="mb-6 rounded-lg border-2 border-[var(--warning)] bg-[var(--warning-soft)] px-4 py-3 text-[length:var(--text-body)] font-bold text-[var(--warning)]">
          Sample report — Mr Tan (demonstration data, not a real participant)
        </div>
      )}

      <article className="panel-card p-6 sm:p-10">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Physio-Aid screening report</p>
            <h1 className="mt-2 text-[length:var(--text-display)] font-semibold">
              {session.demographics.displayName}
            </h1>
            <p className="mt-1 text-[length:var(--text-label)] text-[var(--muted)]">
              Generated {new Date(generatedAt).toLocaleString("en-SG")}
            </p>
          </div>
        </header>

        <SectionTitle>Participant</SectionTitle>
        <div className="mt-3 grid gap-1.5">
          <Field label="Name" value={session.demographics.displayName} />
          <Field label="Age" value={String(session.demographics.age)} />
          <Field
            label="Living situation"
            value={session.demographics.livingSituation}
          />
          <Field
            label="Fall history"
            value={session.demographics.fallHistory.replaceAll("_", " ")}
          />
          <Field
            label="Emergency contact"
            value={
              session.emergencyContact.name
                ? `${session.emergencyContact.name} (${session.emergencyContact.relationship}) · ${session.emergencyContact.phone}`
                : "Not provided"
            }
          />
          <Field
            label="Aggregate contribution"
            value={
              session.consent.researchConsent
                ? `Consented${
                    session.demographics.planningArea
                      ? ` · ${session.demographics.planningArea}`
                      : ""
                  } (anonymised, aggregate-only)`
                : "Not consented — results stay on this device"
            }
          />
        </div>

        <SectionTitle>Safety screen</SectionTitle>
        <div className="mt-3 grid gap-1.5">
          {flaggedSafety.length === 0 ? (
            <p className="text-[var(--muted-strong)]">
              No safety concerns reported before testing.
            </p>
          ) : (
            flaggedSafety.map((question) => (
              <Field key={question.id} label="Reported" value={question.label} />
            ))
          )}
        </div>

        <SectionTitle>Ability–confidence summary</SectionTitle>
        <div className="mt-3 grid gap-1.5">
          <Field
            label="Ability band"
            value={analytics.abilityBand.replaceAll("_", " ")}
          />
          <Field
            label="Confidence band"
            value={analytics.confidenceBand.replaceAll("_", " ")}
          />
          <Field
            label="Confidence average"
            value={`${session.questionnaire.averageScore.toFixed(1)} / 10`}
          />
          <Field label="Profile" value={profileCopy[analytics.profile].title} />
          <Field
            label="Functional-falls risk"
            value={riskLabels[analytics.riskCategory]}
          />
        </div>
        <p className="mt-3 text-[var(--muted-strong)]">
          {analytics.interpretation}
        </p>

        <SectionTitle>Test measurements</SectionTitle>
        <div className="mt-3 grid gap-1.5">
          <Field
            label="Chair stand"
            value={`${session.chairStand.repetitions} repetitions in ${session.chairStand.durationSeconds}s (${session.chairStand.completionStatus}, source: ${session.chairStand.source})`}
          />
          {session.motion && (
            <Field
              label="Gait walk"
              value={`${session.motion.gaitSpeedMetersPerSecond ?? 0} m/s · stability ${Math.round(session.motion.stabilityScore * 100)}% · rhythm ${Math.round(session.motion.rhythmConsistency * 100)}% (source: ${session.motion.source})`}
            />
          )}
          {session.floorRising && (
            <Field
              label="Floor rising"
              value={`${session.floorRising.completionStatus}${
                session.floorRising.durationSeconds !== undefined
                  ? ` in ${session.floorRising.durationSeconds}s`
                  : ""
              } · assistance ${session.floorRising.requiredAssistance ? "required" : "not required"}`}
            />
          )}
        </div>

        <SectionTitle>Recommendations</SectionTitle>
        <ul className="mt-3 grid list-disc gap-2 pl-5">
          {analytics.recommendations.map((recommendation) => (
            <li key={recommendation.id}>
              <strong className="font-bold">{recommendation.title}.</strong>{" "}
              <span className="text-[var(--muted-strong)]">
                {recommendation.body}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-10 border-t border-[var(--line)] pt-4 text-[length:var(--text-label)] text-[var(--muted)]">
          {session.report?.disclaimer ?? DECISION_SUPPORT_DISCLAIMER}
        </p>
      </article>
    </main>
  );
}
