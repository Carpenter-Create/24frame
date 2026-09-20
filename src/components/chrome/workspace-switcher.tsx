"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CaretDown } from "@phosphor-icons/react";

import { AppearanceCheck } from "./appearance-check";
import { SegmentedTrack } from "@/components/ui/segmented-track";
import { SEGMENTED_TRACK_PERSIST, segmentedItemOn } from "@/lib/segmented-track";
import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
import {
  overviewLeadActiveIndex,
  overviewLeadPills,
  overviewLeadSelected,
  overviewLeadShouldNavigate,
  overviewTriggerLabel,
  type OverviewLeadPill,
  type OverviewLeadPillId,
} from "@/lib/overview";
import { workspaceHome, type WorkspaceMode } from "@/lib/workspace";
import { prefetchHrefList } from "@/lib/house-nav-pending";
import {
  HouseNavPendingProbe,
  useHouseNavPending,
} from "@/components/chrome/use-house-nav-pending";
import {
  availableWorkspaceOptions,
  type WorkspaceMenuOption,
  workspaceModeLabel,
} from "@/lib/workspace-menu";
import {
  WORKSPACE_SWITCHER,
  WORKSPACE_SWITCHER_HEADER_CLASS,
  WORKSPACE_SWITCHER_HOST_CLASS,
  WORKSPACE_SWITCHER_MARK_CLASS,
  WORKSPACE_SWITCHER_OPTION_CHECK_CLASS,
  WORKSPACE_SWITCHER_OPTION_CHECK_GUTTER_CLASS,
  WORKSPACE_SWITCHER_OPTION_LABEL_CLASS,
  WORKSPACE_SWITCHER_SEGMENT_LABEL_CLASS,
  WORKSPACE_SWITCHER_SEGMENTS_CLASS,
  WORKSPACE_SWITCHER_SEGMENTS_THUMB_CLASS,
  WORKSPACE_SWITCHER_SHEET_HOST_CLASS,
  WORKSPACE_SWITCHER_SHEET_SCRIM_CLASS,
  WORKSPACE_SWITCHER_SHEET_SURFACE_CLASS,
  WORKSPACE_SWITCHER_TRIGGER_NAME_CLASS,
  type WorkspaceSwitcherPresentation,
  type WorkspaceSwitcherTone,
  phoneWorkspaceSwitcherPills,
  phoneWorkspaceSwitcherPrefetchHrefs,
  workspaceSwitcherChevronClass,
  workspaceSwitcherChromeClearanceBottoms,
  workspaceSwitcherLeadMarkLetter,
  workspaceSwitcherMenuStyle,
  workspaceSwitcherNextSegmentIndex,
  workspaceSwitcherOptionClass,
  workspaceSwitcherPanelClass,
  workspaceSwitcherSegmentClass,
  workspaceSwitcherSegmentLabel,
  workspaceSwitcherSegmentTabIndex,
  workspaceSwitcherStaticClass,
  workspaceSwitcherTriggerClass,
  workspaceSwitcherPersistLane,
  workspaceSwitcherTriggerMarkId,
} from "@/lib/workspace-switcher";

function WorkspaceLeadMark({ id }: { id: OverviewLeadPillId }) {
  const letter = id === "co-productions" ? "" : workspaceSwitcherLeadMarkLetter(id);
  return (
    <span
      data-workspace-switcher-mark={id}
      className={WORKSPACE_SWITCHER_MARK_CLASS}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}

function selectLeadPill(
  current: WorkspaceMode,
  pill: Pick<OverviewLeadPill, "id" | "href">,
  options: readonly WorkspaceMenuOption[],
  router: ReturnType<typeof useRouter>,
  pathname: string,
) {
  if (!overviewLeadShouldNavigate(pathname, current, pill)) return;
  if (pill.id === "home" || pill.id === "co-productions") {
    router.push(pill.href);
    return;
  }
  const option = options.find((row) => row.mode === pill.id);
  if (!option) return;
  workspaceSwitcherPersistLane(option.mode);
  router.push(workspaceHome(option.mode));
}

function WorkspaceSwitcherPills({
  current,
  options,
}: {
  current: WorkspaceMode;
  options: readonly WorkspaceMenuOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const pills = overviewLeadPills(options);
  const segmentRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const label = overviewTriggerLabel(pathname, workspaceSwitcherSegmentLabel(current));
  const canSwitch = pills.length > 1;
  const routeIndex = overviewLeadActiveIndex(pathname, current, pills);

  function onSegmentKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = workspaceSwitcherNextSegmentIndex(
      index,
      pills.length,
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
    <SegmentedTrack
      activeIndex={routeIndex}
      persistKey={SEGMENTED_TRACK_PERSIST.workspace}
      trackClass={WORKSPACE_SWITCHER_SEGMENTS_CLASS}
      thumbClass={WORKSPACE_SWITCHER_SEGMENTS_THUMB_CLASS}
      data-workspace-switcher=""
      data-workspace-switcher-presentation="pills"
      data-workspace-switcher-pills=""
      role="tablist"
      aria-label={WORKSPACE_SWITCHER.label}
    >
      {({ selectedIndex }) =>
        pills.map((pill, index) => {
          const selected = segmentedItemOn(index, selectedIndex);
          return (
            <button
              key={pill.id}
              ref={(node) => {
                segmentRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              data-segmented-item=""
              data-workspace-switcher-segment={pill.id}
              aria-selected={selected}
              tabIndex={workspaceSwitcherSegmentTabIndex(selected)}
              className={workspaceSwitcherSegmentClass(selected)}
              onClick={() => {
                selectLeadPill(current, pill, options, router, pathname);
              }}
              onKeyDown={(event) => onSegmentKeyDown(event, index)}
            >
              {pill.label}
            </button>
          );
        })
      }
    </SegmentedTrack>
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
  const pathname = usePathname();
  const { activePath, markPending } = useHouseNavPending();
  const hostRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(defaultOpen);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const pills =
    presentation === "sheet"
      ? phoneWorkspaceSwitcherPills(options)
      : overviewLeadPills(options);
  const chromePath = presentation === "sheet" ? activePath : pathname;
  const label = overviewTriggerLabel(chromePath, workspaceModeLabel(current));
  const triggerMarkId = workspaceSwitcherTriggerMarkId(chromePath, current);
  const canSwitch = pills.length > 1;

  useEffect(() => {
    if (presentation !== "sheet") return;
    prefetchHrefList(router.prefetch, phoneWorkspaceSwitcherPrefetchHrefs(options));
  }, [options, presentation, router]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      setPanelStyle(
        workspaceSwitcherMenuStyle({
          tone,
          trigger: trigger.getBoundingClientRect(),
          chromeBottoms: workspaceSwitcherChromeClearanceBottoms(),
          viewportWidth: window.innerWidth,
        }),
      );
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, tone]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      const host = hostRef.current;
      const panel = panelRef.current;
      if (host?.contains(target) || panel?.contains(target)) return;
      setOpen(false);
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

  const optionRows = (
    <>
      <div data-workspace-switcher-header="" className={WORKSPACE_SWITCHER_HEADER_CLASS}>
        {WORKSPACE_SWITCHER.heading}
      </div>
      <div
        role="listbox"
        aria-label={WORKSPACE_SWITCHER.heading}
        className="flex flex-col"
      >
        {pills.map((pill) => {
          const selected = overviewLeadSelected(pill.id, chromePath, current);
          const optionBody = (
            <>
              <WorkspaceLeadMark id={pill.id} />
              <span
                data-workspace-switcher-option-label=""
                className={WORKSPACE_SWITCHER_OPTION_LABEL_CLASS}
              >
                {pill.label}
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
            </>
          );
          if (presentation === "sheet" && !selected) {
            return (
              <Link
                key={pill.id}
                href={pill.href}
                prefetch
                role="option"
                data-workspace-switcher-option={pill.id}
                aria-selected={false}
                className={workspaceSwitcherOptionClass(false)}
                onClick={(event) => {
                  workspaceSwitcherPersistLane(pill.id);
                  markPending(pill.href, event);
                  setOpen(false);
                }}
              >
                <HouseNavPendingProbe href={pill.href} onPending={markPending} />
                {optionBody}
              </Link>
            );
          }
          return (
            <button
              key={pill.id}
              type="button"
              role="option"
              data-workspace-switcher-option={pill.id}
              aria-selected={selected}
              className={workspaceSwitcherOptionClass(selected)}
              onClick={() => {
                selectLeadPill(current, pill, options, router, pathname);
                setOpen(false);
              }}
            >
              {optionBody}
            </button>
          );
        })}
      </div>
    </>
  );

  const panel =
    presentation === "sheet" ? (
      <div
        ref={panelRef}
        data-workspace-switcher-sheet=""
        data-workspace-switcher-presentation="sheet"
        className={WORKSPACE_SWITCHER_SHEET_HOST_CLASS}
      >
        <button
          type="button"
          aria-label={WORKSPACE_SWITCHER.close}
          data-workspace-switcher-sheet-scrim=""
          className={WORKSPACE_SWITCHER_SHEET_SCRIM_CLASS}
          onClick={() => setOpen(false)}
        />
        <div
          data-workspace-switcher-popover=""
          className={`relative z-10 ${WORKSPACE_SWITCHER_SHEET_SURFACE_CLASS}`}
        >
          {optionRows}
        </div>
      </div>
    ) : (
      <div
        ref={panelRef}
        data-workspace-switcher-popover=""
        className={workspaceSwitcherPanelClass(tone)}
        style={panelStyle}
      >
        {optionRows}
      </div>
    );

  return (
    <div
      ref={hostRef}
      data-workspace-switcher=""
      data-workspace-switcher-tone={tone}
      data-workspace-switcher-presentation={presentation}
      className={WORKSPACE_SWITCHER_HOST_CLASS}
    >
      <button
        ref={triggerRef}
        type="button"
        data-workspace-switcher-trigger=""
        aria-label={WORKSPACE_SWITCHER.label}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((next) => !next)}
        className={workspaceSwitcherTriggerClass(tone)}
      >
        {presentation === "sheet" ? <WorkspaceLeadMark id={triggerMarkId} /> : null}
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
      {open
        ? typeof document !== "undefined"
          ? createPortal(panel, document.body)
          : panel
        : null}
    </div>
  );
}
