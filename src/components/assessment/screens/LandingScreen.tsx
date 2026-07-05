"use client";

import { ArrowRight, ClipboardList, HeartHandshake, ShieldCheck, PersonStanding, FileText } from "lucide-react";
import Link from "next/link";
import { LangSwitch } from "@/components/i18n/LangSwitch";
import { ListenButton } from "@/components/i18n/ListenButton";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { clinicalText } from "@/lib/i18n/clinical-drafts";
import {
  DECISION_SUPPORT_DISCLAIMER,
  PRODUCT_NAME,
  PRODUCT_POSITIONING,
} from "@/config/clinical-config";

const HERO_HEADLINE =
  "Understand movement, confidence, and care needs before a fall happens.";

export function LandingScreen({
  onStart,
  onLoadDemo,
  demoLoaded,
}: {
  onStart: () => void;
  onLoadDemo: () => void;
  demoLoaded: boolean;
}) {
  const { t, lang } = useLanguage();

  const pathway = [
    { icon: ShieldCheck, label: t("landing.pathway.safety") },
    { icon: HeartHandshake, label: t("landing.pathway.confidence") },
    { icon: PersonStanding, label: t("landing.pathway.movement") },
    { icon: FileText, label: t("landing.pathway.summary") },
  ];

  return (
    <section className="grid gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <LangSwitch />
        <ListenButton text={`${PRODUCT_NAME}. ${HERO_HEADLINE}`} />
      </div>

      <div className="grid gap-4">
        <p className="eyebrow">{t("landing.kicker")}</p>
        <h1 className="max-w-3xl text-[length:var(--text-display)] font-semibold sm:text-5xl">
          {HERO_HEADLINE}
        </h1>
        <p className="max-w-2xl text-[length:var(--text-lead)] text-[var(--muted)]">
          {PRODUCT_POSITIONING}
        </p>
      </div>

      <div className="panel-card p-5 sm:p-6">
        <p className="eyebrow">{t("landing.pathwayTitle")}</p>
        <ol className="mt-4 grid gap-0 sm:grid-cols-4">
          {pathway.map((item, index) => (
            <li className="relative flex sm:flex-col sm:items-center sm:gap-3 sm:text-center" key={item.label}>
              {index < pathway.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-6 top-12 h-[calc(100%-3rem)] w-0.5 bg-[var(--primary-soft)] sm:left-1/2 sm:top-6 sm:h-0.5 sm:w-full"
                />
              )}
              <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary-dark)]">
                <item.icon aria-hidden size={24} />
              </span>
              <span className="flex items-center px-4 py-3 font-bold sm:px-0 sm:py-0 sm:text-[length:var(--text-label)]">
                {item.label}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-[length:var(--text-label)] text-[var(--muted)]">
          {t("landing.pathwayNote")}
        </p>
      </div>

      <div className="quiet-card bg-[var(--surface-muted)] p-4 text-[length:var(--text-label)] text-[var(--muted-strong)]">
        {clinicalText(lang, "disclaimer.decisionSupport", DECISION_SUPPORT_DISCLAIMER)}
      </div>

      <div className="grid gap-3 sm:max-w-md">
        <button className="primary-action" onClick={onStart} type="button">
          {t("nav.startAssessment")} <ArrowRight aria-hidden size={22} />
        </button>
        <button className="secondary-action" onClick={onLoadDemo} type="button">
          <ClipboardList aria-hidden size={20} />
          {demoLoaded ? t("nav.demoLoaded") : t("nav.viewDemo")}
        </button>
      </div>

      <p className="text-[length:var(--text-caption)]">
        <Link className="text-[var(--muted)] underline underline-offset-4" href="/insights">
          {t("landing.plannersLink")}
        </Link>
      </p>
    </section>
  );
}
