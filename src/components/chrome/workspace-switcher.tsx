"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
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
  WORKSPACE_SWITCHER_SEGMENT_LABEL_CLASS,
  WORKSPACE_SWITCHER_SEGMENTS_CLASS,
  WORKSPACE_SWITCHER_TRIGGER_NAME_CLASS,
  type WorkspaceSwitcherPresentation,
  type WorkspaceSwitcherTone,
  workspaceSwitcherChevronClass,
  workspaceSwitcherMarkLetter,
  workspaceSwitcherNextSegmentIndex,
  workspaceSwitcherOptionClass,
  workspaceSwitcherPanelClass,
  workspaceSwitcherSegmentClass,
  workspaceSwitcherSegmentLabel,
  workspaceSwitcherSegmentTabIndex,
  workspaceSwitcherShowsChevron,
  workspaceSwitcherShowsSegments,
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

function selectWorkspace(
  current: WorkspaceMode,
  option: WorkspaceMenuOption,
  router: ReturnType<typeof useRouter>,
) {
  persistWorkspaceCookie(option.mode);
  if (current !== option.mode) router.push(workspaceHome(option.mode));
}

function WorkspaceSwitcherPills({
  current,
  options,
}: {
  current: WorkspaceMode;
  options: readonly WorkspaceMenuOption[];
}) {
  const router = useRouter();
  const segmentRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const label = workspaceSwitcherSegmentLabel(current);
  const canSwitch = workspaceSwitcherShowsSegments(options);

  function onSegmentKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = workspaceSwitcherNextSegmentIndex(
      index,
      options.length,
      event.key === "ArrowRight" ? 1 : -1,
    );
    segmentRefs.current[next]?.focus();
  }

  if (!canSwitch) {
    return (
      <span
        data-workspace-switcher=""
        data-workspace-switcher-presentation="pills"
        className={workspaceSwitcherStaticClass("plain")}
      >
        <span data-workspace-switcher-current="" className={WORKSPACE_SWITCHER_SEGMENT_LABEL_CLASS}>
          {label}
        </span>
      </span>
    );
  }

  return (
    <div
      data-workspace-switcher=""
      data-workspace-switcher-presentation="pills"
      data-workspace-switcher-pills=""
      role="tablist"
      aria-label={WORKSPACE_SWITCHER.label}
      className={WORKSPACE_SWITCHER_SEGMENTS_CLASS}
    >
      {options.map((option, index) => {
        const selected = current === option.mode;
        return (
          <button
            key={option.mode}
            ref={(node) => {
              segmentRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            data-workspace-switcher-segment={option.mode}
            aria-selected={selected}
            tabIndex={workspaceSwitcherSegmentTabIndex(selected)}
            className={workspaceSwitcherSegmentClass(selected)}
            onClick={() => selectWorkspace(current, option, router)}
            onKeyDown={(event) => onSegmentKeyDown(event, index)}
          >
            {workspaceSwitcherSegmentLabel(option.mode)}
          </button>
        );
      })}
    </div>
  );
}

export function WorkspaceSwitcher({
  current,
  options = availableWorkspaceOptions(),
  defaultOpen = false,
  tone = "plain",
  presentation = "menu",
}: {
  current: WorkspaceMode;
  options?: readonly WorkspaceMenuOption[];
  defaultOpen?: boolean;
  tone?: WorkspaceSwitcherTone;
  presentation?: WorkspaceSwitcherPresentation;
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

  if (presentation === "pills") {
    return <WorkspaceSwitcherPills current={current} options={options} />;
  }

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
                    selectWorkspace(current, option, router);
                    setOpen(false);
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
