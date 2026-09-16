"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CaretDown } from "@phosphor-icons/react";

import { AppearanceCheck } from "./appearance-check";
import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
import { persistWorkspaceCookie, workspaceHome, type WorkspaceMode } from "@/lib/workspace";
import {
  availableWorkspaceOptions,
  type WorkspaceMenuOption,
  workspaceModeLabel,
} from "@/lib/workspace-menu";
import {
  WORKSPACE_SWITCHER,
  WORKSPACE_SWITCHER_CHEVRON_CLASS,
  WORKSPACE_SWITCHER_OPTION_CLASS,
  WORKSPACE_SWITCHER_PANEL_CLASS,
  WORKSPACE_SWITCHER_STATIC_CLASS,
  WORKSPACE_SWITCHER_TRIGGER_CLASS,
  workspaceSwitcherShowsChevron,
} from "@/lib/workspace-switcher";

export function WorkspaceSwitcher({
  current,
  options = availableWorkspaceOptions(),
  defaultOpen = false,
}: {
  current: WorkspaceMode;
  options?: readonly WorkspaceMenuOption[];
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const hostRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(defaultOpen);
  const label = workspaceModeLabel(current);
  const canSwitch = workspaceSwitcherShowsChevron(options);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: MouseEvent) => {
      const host = hostRef.current;
      if (host && !host.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  if (options.length === 0) return null;

  if (!canSwitch) {
    return (
      <span data-workspace-switcher="" data-workspace-switcher-current="" className={WORKSPACE_SWITCHER_STATIC_CLASS}>
        {label}
      </span>
    );
  }

  return (
    <div ref={hostRef} data-workspace-switcher="" className="relative">
      <button
        type="button"
        data-workspace-switcher-trigger=""
        aria-label={WORKSPACE_SWITCHER.label}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((next) => !next)}
        className={WORKSPACE_SWITCHER_TRIGGER_CLASS}
      >
        <span data-workspace-switcher-current="">{label}</span>
        <CaretDown
          data-workspace-switcher-chevron=""
          className={WORKSPACE_SWITCHER_CHEVRON_CLASS}
          weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
        />
      </button>
      {open ? (
        <div
          data-workspace-switcher-popover=""
          role="listbox"
          aria-label={WORKSPACE_SWITCHER.label}
          className={WORKSPACE_SWITCHER_PANEL_CLASS}
        >
          {options.map((option) => (
            <button
              key={option.mode}
              type="button"
              role="option"
              data-workspace-switcher-option={option.mode}
              aria-selected={current === option.mode}
              className={WORKSPACE_SWITCHER_OPTION_CLASS}
              onClick={() => {
                persistWorkspaceCookie(option.mode);
                setOpen(false);
                if (current !== option.mode) router.push(workspaceHome(option.mode));
              }}
            >
              <AppearanceCheck selected={current === option.mode} />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
