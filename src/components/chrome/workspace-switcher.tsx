"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  WORKSPACE_SWITCHER_HEADER_COPY_CLASS,
  WORKSPACE_SWITCHER_HEADER_MARK_CLASS,
  WORKSPACE_SWITCHER_HEADER_NAME_CLASS,
  WORKSPACE_SWITCHER_HEADER_ROLE_CLASS,
  WORKSPACE_SWITCHER_MARK_CLASS,
  WORKSPACE_SWITCHER_OPTION_CHECK_CLASS,
  WORKSPACE_SWITCHER_OPTION_CHECK_GUTTER_CLASS,
  WORKSPACE_SWITCHER_OPTION_LABEL_CLASS,
  WORKSPACE_SWITCHER_PANEL_CLASS,
  WORKSPACE_SWITCHER_RULE_CLASS,
  WORKSPACE_SWITCHER_SETTINGS_CLASS,
  WORKSPACE_SWITCHER_STATIC_CLASS,
  WORKSPACE_SWITCHER_TRIGGER_CLASS,
  WORKSPACE_SWITCHER_TRIGGER_NAME_CLASS,
  workspaceSwitcherChevronClass,
  workspaceSwitcherMarkLetter,
  workspaceSwitcherOptionClass,
  workspaceSwitcherRole,
  workspaceSwitcherSettingsHref,
  workspaceSwitcherShowsChevron,
  workspaceSwitcherShowsSettings,
} from "@/lib/workspace-switcher";

function WorkspaceMark({
  mode,
  size,
}: {
  mode: WorkspaceMode;
  size: "sm" | "md";
}) {
  return (
    <span
      data-workspace-switcher-mark={mode}
      className={size === "md" ? WORKSPACE_SWITCHER_HEADER_MARK_CLASS : WORKSPACE_SWITCHER_MARK_CLASS}
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
  compact = false,
}: {
  current: WorkspaceMode;
  options?: readonly WorkspaceMenuOption[];
  defaultOpen?: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const hostRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(defaultOpen);
  const label = workspaceModeLabel(current);
  const canSwitch = workspaceSwitcherShowsChevron(options);
  const showSettings = workspaceSwitcherShowsSettings();
  const settingsHref = workspaceSwitcherSettingsHref(pathname);

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
      <span data-workspace-switcher="" className={WORKSPACE_SWITCHER_STATIC_CLASS}>
        <WorkspaceMark mode={current} size="sm" />
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
      data-workspace-switcher-compact={compact ? "" : undefined}
      className="relative min-w-0"
    >
      <button
        type="button"
        data-workspace-switcher-trigger=""
        aria-label={WORKSPACE_SWITCHER.label}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((next) => !next)}
        className={WORKSPACE_SWITCHER_TRIGGER_CLASS}
      >
        <WorkspaceMark mode={current} size="sm" />
        <span
          data-workspace-switcher-current=""
          className={compact ? "sr-only" : WORKSPACE_SWITCHER_TRIGGER_NAME_CLASS}
        >
          {label}
        </span>
        <CaretDown
          data-workspace-switcher-chevron=""
          data-workspace-switcher-chevron-open={open ? "" : undefined}
          className={workspaceSwitcherChevronClass(open)}
          weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
        />
      </button>
      {open ? (
        <div
          data-workspace-switcher-popover=""
          className={WORKSPACE_SWITCHER_PANEL_CLASS}
        >
          <div data-workspace-switcher-header="" className={WORKSPACE_SWITCHER_HEADER_CLASS}>
            <WorkspaceMark mode={current} size="md" />
            <div className={WORKSPACE_SWITCHER_HEADER_COPY_CLASS}>
              <div data-workspace-switcher-header-name="" className={WORKSPACE_SWITCHER_HEADER_NAME_CLASS}>
                {label}
              </div>
              <div data-workspace-switcher-header-role="" className={WORKSPACE_SWITCHER_HEADER_ROLE_CLASS}>
                {workspaceSwitcherRole(current)}
              </div>
            </div>
          </div>
          {showSettings ? (
            <div className={WORKSPACE_SWITCHER_RULE_CLASS}>
              <Link
                href={settingsHref}
                data-workspace-switcher-settings=""
                className={WORKSPACE_SWITCHER_SETTINGS_CLASS}
                onClick={() => setOpen(false)}
              >
                {WORKSPACE_SWITCHER.settings}
              </Link>
            </div>
          ) : null}
          <div
            role="listbox"
            aria-label={WORKSPACE_SWITCHER.label}
            className={WORKSPACE_SWITCHER_RULE_CLASS}
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
                  <WorkspaceMark mode={option.mode} size="sm" />
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
