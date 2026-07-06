import { ArrowLeft, Database } from "lucide-react";
import Link from "next/link";
import { kpis, planningAreas, planningSignals } from "@/lib/demo/insights";
import { PRODUCT_NAME } from "@/config/clinical-config";

const DEMO_NOTE =
  "Aggregate, anonymised demonstration data — fabricated for this demo. Only aggregates are ever shown; no individual records are stored or displayed.";

/**
 * Population-level planning view for the policy audience. English-only,
 * deliberately outside the older-adult assessment flow.
 */
export function InsightsDashboard() {
  return (
    <main className="min-h-dvh pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
          <Link className="link-action" href="/">
            <ArrowLeft aria-hidden size={18} />
            {PRODUCT_NAME}
          </Link>
          <span className="status-pill">
            <Database aria-hidden size={16} />
            Demo data
          </span>
        </header>

        <div className="grid gap-3">
          <p className="eyebrow">Population insights · for planners</p>
          <h1 className="text-[length:var(--text-display)] font-semibold">
            Healthspan signals across planning areas
          </h1>
          <p className="max-w-3xl text-[length:var(--text-lead)] text-[var(--muted)]">
            Aggregate screening patterns to support programme placement and
            community capacity planning. Built only from screenings where the
            participant explicitly consented to contribute, with a
            self-reported neighbourhood — never GPS — and minimum cell sizes
            before anything is shown.
          </p>
          <p className="max-w-3xl rounded-[var(--radius-control)] bg-[var(--surface-muted)] p-3 text-[length:var(--text-label)] text-[var(--muted-strong)]">
            {DEMO_NOTE}
          </p>
        </div>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((kpi) => {
            const deltaColor = kpi.delta.startsWith("+")
              ? "text-[var(--success)]"
              : kpi.delta.includes("stable")
                ? "text-[var(--warning)]"
                : "";
            return (
              <div className="kpi-card" key={kpi.id}>
                <p className="text-[length:var(--text-label)] font-bold text-[var(--muted-strong)]">
                  {kpi.label}
                </p>
                <p className="kpi-value mt-2">{kpi.value}</p>
                <p className={`kpi-delta mt-1 ${deltaColor}`}>{kpi.delta}</p>
              </div>
            );
          })}
        </section>

        <section className="grid gap-3">
          <h2 className="text-[length:var(--text-lead)] font-semibold">
            Support-recommended rate by planning area
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {planningAreas.map((area) => (
              <div
                className={`heat-cell ${area.intensity > 0.6 ? "heat-cell--strong" : ""}`}
                key={area.id}
                style={{ "--intensity": area.intensity } as React.CSSProperties}
              >
                <p className="font-bold leading-tight">{area.name}</p>
                <p
                  className={`text-[length:var(--text-caption)] font-semibold ${
                    area.intensity > 0.6 ? "" : "text-[var(--muted-strong)]"
                  }`}
                >
                  {Math.round(area.intensity * 100)}% · {area.screenings}{" "}
                  screenings
                </p>
              </div>
            ))}
          </div>
          <p className="text-[length:var(--text-caption)] text-[var(--muted)]">
            Darker cells = higher share of screenings where support is
            recommended. Cells with small sample sizes are suppressed.
          </p>
        </section>

        <section className="grid gap-3">
          <h2 className="text-[length:var(--text-lead)] font-semibold">
            Planning signals
          </h2>
          <div className="grid gap-3 lg:grid-cols-3">
            {planningSignals.map((signal) => (
              <div className="signal-card" key={signal.id}>
                <p className="font-bold">{signal.title}</p>
                <p className="mt-1 text-[length:var(--text-label)] text-[var(--muted-strong)]">
                  {signal.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
