"use client";

import { Lock } from "lucide-react";
import { FormGrid, TextField } from "@/components/assessment/ui/Fields";
import { ScreenHeader } from "@/components/assessment/ui/ScreenHeader";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import type { Demographics, EmergencyContact } from "@/types/assessment";

export function ContactScreen({
  contact,
  setContact,
  demographics,
  setDemographics,
}: {
  contact: EmergencyContact;
  setContact: React.Dispatch<React.SetStateAction<EmergencyContact>>;
  demographics: Demographics;
  setDemographics: React.Dispatch<React.SetStateAction<Demographics>>;
}) {
  const { t } = useLanguage();

  return (
    <section className="grid gap-6">
      <ScreenHeader
        support={t("contact.support")}
        title={t("contact.title")}
      />

      <FormGrid>
        <TextField
          label={t("contact.name")}
          onChange={(value) =>
            setContact((current) => ({ ...current, name: value }))
          }
          value={contact.name}
        />
        <TextField
          label={t("contact.phone")}
          onChange={(value) =>
            setContact((current) => ({ ...current, phone: value }))
          }
          type="tel"
          value={contact.phone}
        />
        <TextField
          label={t("contact.relationship")}
          onChange={(value) =>
            setContact((current) => ({ ...current, relationship: value }))
          }
          value={contact.relationship}
        />
      </FormGrid>

      <div className="grid gap-4">
        <div>
          <h2 className="text-[length:var(--text-title)] font-semibold">
            {t("contact.aboutYou")}
          </h2>
          <p className="mt-1 text-[var(--muted)]">
            {t("contact.aboutYouSupport")}
          </p>
        </div>
        <FormGrid>
          <TextField
            label={t("contact.displayName")}
            onChange={(value) =>
              setDemographics((current) => ({
                ...current,
                displayName: value,
              }))
            }
            value={demographics.displayName}
          />
          <TextField
            label={t("contact.age")}
            onChange={(value) =>
              setDemographics((current) => ({
                ...current,
                age: Number(value),
              }))
            }
            type="number"
            value={String(demographics.age)}
          />
          <TextField
            label={t("contact.livingSituation")}
            onChange={(value) =>
              setDemographics((current) => ({
                ...current,
                livingSituation: value,
              }))
            }
            value={demographics.livingSituation}
          />
        </FormGrid>
      </div>

      <div className="flex items-start gap-3 rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-4 text-[length:var(--text-label)] text-[var(--muted-strong)]">
        <Lock aria-hidden className="mt-0.5 shrink-0 text-[var(--primary)]" size={18} />
        <p>{t("contact.trustNote")}</p>
      </div>
    </section>
  );
}
