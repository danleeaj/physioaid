"use client";

import { BookOpen, ClipboardCheck, Users } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { shellCopy } from "@/components/layout/copy";

export type ShellTab = "assessment" | "community" | "resources";

/** Fixed bottom tab bar — visible only on the three main signed-in tabs. */
export function TabBar({
  active,
  onSelect,
}: {
  active: ShellTab;
  onSelect: (tab: ShellTab) => void;
}) {
  const { lang } = useLanguage();
  const tabs: { id: ShellTab; label: string; Icon: typeof ClipboardCheck }[] = [
    { id: "assessment", label: shellCopy[lang].tabs.assessment, Icon: ClipboardCheck },
    { id: "community", label: shellCopy[lang].tabs.community, Icon: Users },
    { id: "resources", label: shellCopy[lang].tabs.resources, Icon: BookOpen },
  ];
  return (
    <nav aria-label="Main" className="tab-bar">
      {tabs.map(({ id, label, Icon }) => (
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
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
