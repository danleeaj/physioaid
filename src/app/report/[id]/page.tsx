import Link from "next/link";
import { DECISION_SUPPORT_DISCLAIMER } from "@/config/clinical-config";
import { profileCopy } from "@/content/clinical-copy";
import { analyseAssessment } from "@/lib/analytics/ability-confidence";
import { createDemoSession } from "@/lib/demo-session";

export default function ReportPage() {
  const session = createDemoSession();
  const analytics = analyseAssessment({
    questionnaire: session.questionnaire,
    chairStand: session.chairStand,
    motion: session.motion,
  });

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-8">
      <Link
        className="mb-6 inline-flex min-h-12 items-center rounded-md border border-[var(--line)] bg-white px-4 font-semibold"
        href="/"
      >
        Back to assessment
      </Link>
      <article className="rounded-lg border border-[var(--line)] bg-white p-6 shadow-sm">
        <p className="text-base font-semibold text-[var(--primary-dark)]">
          Physio-Aid screening report
        </p>
        <h1 className="mt-2 text-4xl font-semibold">
          {session.demographics.displayName}, {session.demographics.age}
        </h1>
        <div className="my-6 grid gap-3 md:grid-cols-2">
          <ReportMetric label="Ability" value={analytics.abilityBand} />
          <ReportMetric label="Confidence" value={analytics.confidenceBand} />
          <ReportMetric
            label="Profile"
            value={profileCopy[analytics.profile].title}
          />
          <ReportMetric
            label="Functional-falls risk"
            value={analytics.riskCategory}
          />
        </div>
        <h2 className="text-2xl font-semibold">Interpretation</h2>
        <p className="mt-2 text-[var(--muted)]">{analytics.interpretation}</p>
        <h2 className="mt-6 text-2xl font-semibold">Recommendations</h2>
        <ul className="mt-3 grid gap-3">
          {analytics.recommendations.map((recommendation) => (
            <li
              className="rounded-md border border-[var(--line)] p-4"
              key={recommendation.id}
            >
              <strong>{recommendation.title}</strong>
              <p className="text-[var(--muted)]">{recommendation.body}</p>
            </li>
          ))}
        </ul>
        <p className="mt-8 border-t border-[var(--line)] pt-4 text-base text-[var(--muted)]">
          {DECISION_SUPPORT_DISCLAIMER}
        </p>
      </article>
    </main>
  );
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--line)] p-4">
      <p className="text-base font-semibold text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold capitalize">
        {value.replaceAll("_", " ")}
      </p>
    </div>
  );
}
