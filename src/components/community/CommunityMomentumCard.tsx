"use client";

import { ArrowRight, Users } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/i18n/LanguageProvider";

/** Post-dashboard bridge into the community hub. */
export function CommunityMomentumCard() {
  const { t } = useLanguage();

  return (
    <div className="panel-card grid gap-3 p-5 sm:p-6">
      <p className="flex items-center gap-2 text-[length:var(--text-label)] font-bold text-[var(--primary-dark)]">
        <Users aria-hidden size={20} />
        {t("dashboard.momentum.title")}
      </p>
      <p className="max-w-2xl text-[var(--muted)]">
        {t("dashboard.momentum.body")}
      </p>
      <Link className="primary-action w-fit" href="/community">
        {t("dashboard.momentum.cta")} <ArrowRight aria-hidden size={20} />
      </Link>
    </div>
  );
}
