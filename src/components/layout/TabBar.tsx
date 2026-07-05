"use client";

import { BookOpen, ClipboardCheck, Users } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import type { MessageKey } from "@/lib/i18n/messages";

export type ShellTab = "assessment" | "community" | "resources";

const tabs: { id: ShellTab; labelKey: MessageKey; Icon: typeof ClipboardCheck }[] = [
  { id: "assessment", labelKey: "shell.tabs.assessment", Icon: ClipboardCheck },
  { id: "community", labelKey: "shell.tabs.community", Icon: Users },
  { id: "resources", labelKey: "shell.tabs.resources", Icon: BookOpen },
];

/** Fixed bottom tab bar — visible only on the three main signed-in tabs. */
export function TabBar({
  active,
  onSelect,
}: {
  active: ShellTab;
  onSelect: (tab: ShellTab) => void;
}) {
  const { t } = useLanguage();

  return (
    <nav aria-label="Main" className="tab-bar">
      {tabs.map(({ id, labelKey, Icon }) => (
        <button
          aria-current={active === id ? "page" : undefined}
          className="tab-item"
          key={id}
          onClick={() => onSelect(id)}
          type="button"
        >
          <span className="tab-item__icon">
            <Icon aria-hidden />
          </span>
          <span>{t(labelKey)}</span>
        </button>
      ))}
    </nav>
  );
}
