"use client";

import { BookOpen, ClipboardCheck, Users } from "lucide-react";
import { shellCopy } from "@/components/layout/copy";

export type ShellTab = "assessment" | "community" | "resources";

const tabs: { id: ShellTab; label: string; Icon: typeof ClipboardCheck }[] = [
  { id: "assessment", label: shellCopy.tabs.assessment, Icon: ClipboardCheck },
  { id: "community", label: shellCopy.tabs.community, Icon: Users },
  { id: "resources", label: shellCopy.tabs.resources, Icon: BookOpen },
];

/** Fixed bottom tab bar — visible only on the three main signed-in tabs. */
export function TabBar({
  active,
  onSelect,
}: {
  active: ShellTab;
  onSelect: (tab: ShellTab) => void;
}) {
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
