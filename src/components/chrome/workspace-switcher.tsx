"use client";

import { usePathname, useRouter } from "next/navigation";

import { cn } from "@/lib/cn";
import { WORKSPACE_AGGREGATION_LABEL, WORKSPACE_SOCIAL_LABEL } from "@/lib/product";
import {
  persistWorkspaceCookie,
  resolveWorkspaceMode,
  workspaceHome,
  type WorkspaceMode,
} from "@/lib/workspace";

const OPTIONS: { mode: WorkspaceMode; label: string }[] = [
  { mode: "aggregation", label: WORKSPACE_AGGREGATION_LABEL },
  { mode: "social", label: WORKSPACE_SOCIAL_LABEL },
];

export function WorkspaceSwitcher({
  defaultWorkspace,
}: {
  defaultWorkspace: WorkspaceMode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const current = resolveWorkspaceMode(pathname, defaultWorkspace);

  const select = (mode: WorkspaceMode) => {
    persistWorkspaceCookie(mode);
    if (current !== mode) router.push(workspaceHome(mode));
  };

  return (
    <div
      data-workspace-switcher=""
      role="group"
      aria-label="Workspace"
      className="flex items-center gap-1 rounded-[var(--radius)] border border-hairline bg-surface p-0.5 shadow-none"
    >
      {OPTIONS.map((option) => {
        const active = current === option.mode;
        return (
          <button
            key={option.mode}
            type="button"
            data-workspace-option={option.mode}
            aria-pressed={active}
            onClick={() => select(option.mode)}
            className={cn(
              "rounded-[var(--radius)] px-2 py-1 t-body-sm leading-4 shadow-none transition-colors",
              active
                ? "bg-surface-muted font-medium text-ink"
                : "font-normal text-ink-2 hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
