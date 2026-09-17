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
  WORKSPACE_SWITCHER_HEADER_CLASS,
  WORKSPACE_SWITCHER_MARK_CLASS,
  WORKSPACE_SWITCHER_OPTION_CHECK_CLASS,
  WORKSPACE_SWITCHER_OPTION_CHECK_GUTTER_CLASS,
  WORKSPACE_SWITCHER_OPTION_LABEL_CLASS,
  WORKSPACE_SWITCHER_TRIGGER_NAME_CLASS,
  type WorkspaceSwitcherTone,
  workspaceSwitcherChevronClass,
  workspaceSwitcherMarkLetter,
  workspaceSwitcherOptionClass,
  workspaceSwitcherPanelClass,
  workspaceSwitcherShowsChevron,
  workspaceSwitcherStaticClass,
  workspaceSwitcherTriggerClass,
} from "@/lib/workspace-switcher";

function WorkspaceMark({ mode }: { mode: WorkspaceMode }) {
  return (
    <span
      data-workspace-switcher-mark={mode}
      className={WORKSPACE_SWITCHER_MARK_CLASS}
      aria-hidden="true"
    >
      {workspaceSwitcherMarkLetter(mode)}
    </span>
  );
}

export function WorkspaceSwitcher({
  current,
  options = availableWorkspaceOptions(),
  defaultOpen = false,
  tone = "plain",
}: {
  current: WorkspaceMode;
  options?: readonly WorkspaceMenuOption[];
  defaultOpen?: boolean;
  tone?: WorkspaceSwitcherTone;
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
      <span
        data-workspace-switcher=""
        data-workspace-switcher-tone={tone}
        className={workspaceSwitcherStaticClass(tone)}
      >
        <span data-workspace-switcher-current="" className={WORKSPACE_SWITCHER_TRIGGER_NAME_CLASS}>
          {label}
        </span>
      </span>
    );
  }

  return (
    <div
      ref={hostRef}
      data-workspace-switcher=""
      data-workspace-switcher-tone={tone}
      className="relative min-w-0"
    >
      <button
        type="button"
        data-workspace-switcher-trigger=""
        aria-label={WORKSPACE_SWITCHER.label}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((next) => !next)}
        className={workspaceSwitcherTriggerClass(tone)}
      >
        <span data-workspace-switcher-current="" className={WORKSPACE_SWITCHER_TRIGGER_NAME_CLASS}>
          {label}
        </span>
        <CaretDown
          data-workspace-switcher-chevron=""
          data-workspace-switcher-chevron-open={open ? "" : undefined}
          className={workspaceSwitcherChevronClass(open, tone)}
          weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
        />
      </button>
      {open ? (
        <div
          data-workspace-switcher-popover=""
          className={workspaceSwitcherPanelClass(tone)}
        >
          <div data-workspace-switcher-header="" className={WORKSPACE_SWITCHER_HEADER_CLASS}>
            {WORKSPACE_SWITCHER.heading}
          </div>
          <div
            role="listbox"
            aria-label={WORKSPACE_SWITCHER.heading}
            className="flex flex-col"
          >
            {options.map((option) => {
              const selected = current === option.mode;
              return (
                <button
                  key={option.mode}
                  type="button"
                  role="option"
                  data-workspace-switcher-option={option.mode}
                  aria-selected={selected}
                  className={workspaceSwitcherOptionClass(selected)}
                  onClick={() => {
                    persistWorkspaceCookie(option.mode);
                    setOpen(false);
                    if (current !== option.mode) router.push(workspaceHome(option.mode));
                  }}
                >
                  <WorkspaceMark mode={option.mode} />
                  <span
                    data-workspace-switcher-option-label=""
                    className={WORKSPACE_SWITCHER_OPTION_LABEL_CLASS}
                  >
                    {option.label}
                  </span>
                  <span
                    data-workspace-switcher-option-check=""
                    className={WORKSPACE_SWITCHER_OPTION_CHECK_GUTTER_CLASS}
                    aria-hidden="true"
                  >
                    <AppearanceCheck
                      selected={selected}
                      className={WORKSPACE_SWITCHER_OPTION_CHECK_CLASS}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
