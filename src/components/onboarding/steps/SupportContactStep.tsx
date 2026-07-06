"use client";

import { useState } from "react";
import { TextField } from "@/components/assessment/ui/Fields";
import { shellCopy } from "@/components/layout/copy";
import type { SupportContact, UserProfile } from "@/types/profile";

const copy = shellCopy.onboarding;

/**
 * Optional care-partner contact. "Skip for now" is a first-class choice and
 * writes `supportContact: null` (rendered as "Not connected" in Profile).
 */
export function SupportContactStep({
  profile,
  onBack,
  onContinue,
}: {
  profile: UserProfile | null;
  onBack: () => void;
  onContinue: (contact: SupportContact | null) => void;
}) {
  const [name, setName] = useState(profile?.supportContact?.name ?? "");
  const [phone, setPhone] = useState(profile?.supportContact?.phone ?? "");
  const [relationship, setRelationship] = useState(
    profile?.supportContact?.relationship ?? "",
  );

  function handleContinue() {
    const trimmed = {
      name: name.trim(),
      phone: phone.trim(),
      relationship: relationship.trim(),
    };
    // A fully-empty form is a skip, not an empty contact.
    const hasContent =
      trimmed.name !== "" || trimmed.phone !== "" || trimmed.relationship !== "";
    onContinue(hasContent ? trimmed : null);
  }

  return (
    <section className="grid gap-4">
      <div className="grid gap-1">
        <h1 className="text-[length:var(--text-display)] font-bold">
          {copy.supportContact.title}
        </h1>
        <p className="text-[var(--muted)]">{copy.supportContact.support}</p>
      </div>

      <TextField
        label={copy.supportContact.nameLabel}
        onChange={setName}
        value={name}
      />
      <TextField
        label={copy.supportContact.phoneLabel}
        onChange={setPhone}
        type="tel"
        value={phone}
      />
      <TextField
        label={copy.supportContact.relationshipLabel}
        onChange={setRelationship}
        value={relationship}
      />

      <div className="grid gap-3 pt-2">
        <button className="primary-action w-full" onClick={handleContinue} type="button">
          {copy.continueLabel}
        </button>
        <button
          className="secondary-action w-full"
          onClick={() => onContinue(null)}
          type="button"
        >
          {copy.supportContact.skip}
        </button>
        <button className="link-action" onClick={onBack} type="button">
          {copy.back}
        </button>
      </div>
    </section>
  );
}
