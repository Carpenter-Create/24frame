"use client";

// House standard for in-page filter/select menus.
// Dashboard All time (period) is the SoT — quiet trigger, desktop menu,
// phone bottom sheet, trailing Sporty Blue AppearanceCheck. Do not invent
// a second select grammar for Titles, Home Revenue, or other filters.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CaretDown } from "@phosphor-icons/react";

import { AppearanceCheck } from "@/components/chrome/appearance-check";
import { Close44 } from "@/components/chrome/house";
import {
  HOUSE_PAGE_SELECT_CHEVRON_CLASS,
  HOUSE_PAGE_SELECT_GROUP_CLASS,
  HOUSE_PAGE_SELECT_MENU_DESKTOP_CLASS,
  HOUSE_PAGE_SELECT_OPTION_CHECK_CLASS,
  HOUSE_PAGE_SELECT_OPTION_CHECK_GUTTER_CLASS,
  HOUSE_PAGE_SELECT_OPTION_LABEL_CLASS,
  HOUSE_PAGE_SELECT_PANEL_ALIGN_START_CLASS,
  HOUSE_PAGE_SELECT_PANEL_CLASS,
  HOUSE_PAGE_SELECT_SHEET_HOST_CLASS,
  HOUSE_PAGE_SELECT_TRIGGER_CLASS,
  HOUSE_PAGE_SELECT_TRIGGER_LABEL_CLASS,
  housePageSelectFlatGroup,
  housePageSelectOptionClass,
  type HousePageSelectGroup,
  type HousePageSelectOption,
} from "@/lib/house-page-select";
import {
  APP_SHEET_HEAD_CLASS,
  APP_SHEET_SCRIM_CLASS,
  APP_SHEET_SURFACE_CLASS,
} from "@/lib/house-sheet";
import { menuHostClass } from "@/lib/menu-host";
import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
import { cn } from "@/lib/cn";

export type { HousePageSelectGroup, HousePageSelectOption };

export type HousePageSelectAttrs = {
  host?: Record<string, string | undefined>;
  trigger?: Record<string, string | undefined>;
  current?: Record<string, string | undefined>;
  chevron?: Record<string, string | undefined>;
  menu?: Record<string, string | undefined>;
  sheet?: Record<string, string | undefined>;
  group?: (id: string) => Record<string, string | undefined>;
  groupLabel?: Record<string, string | undefined>;
  option?: (key: string) => Record<string, string | undefined>;
  optionLabel?: Record<string, string | undefined>;
  optionCheck?: Record<string, string | undefined>;
};

export function HousePageSelect({
  value,
  label,
  options,
  groups,
  ariaLabel,
  sheetTitle,
  closeLabel = "Close",
  defaultOpen = false,
  onPick,
  menuAlign = "end",
  triggerClassName,
  attrs,
}: {
  value: string;
  label: string;
  options?: readonly HousePageSelectOption[];
  groups?: readonly HousePageSelectGroup[];
  ariaLabel: string;
  sheetTitle?: string;
  closeLabel?: string;
  defaultOpen?: boolean;
  onPick: (key: string) => void;
  menuAlign?: "start" | "end";
  triggerClassName?: string;
  attrs?: HousePageSelectAttrs;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(defaultOpen);
  const resolvedGroups =
    groups ?? housePageSelectFlatGroup(options ?? []);
  const title = sheetTitle ?? ariaLabel;
  const panelClass =
    menuAlign === "start"
      ? HOUSE_PAGE_SELECT_PANEL_ALIGN_START_CLASS
      : HOUSE_PAGE_SELECT_PANEL_CLASS;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: MouseEvent) => {
      const host = hostRef.current;
      if (!host || host.contains(event.target as Node)) return;
      if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  useEffect(() => {
    if (!open || typeof window === "undefined") return undefined;
    if (!window.matchMedia("(max-width: 767px)").matches) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  function pick(key: string) {
    setOpen(false);
    onPick(key);
  }

  const optionsList = (
    <HousePageSelectOptions
      groups={resolvedGroups}
      value={value}
      ariaLabel={ariaLabel}
      onPick={pick}
      attrs={attrs}
    />
  );

  return (
    <div
      data-house-page-select=""
      data-menu-family="C"
      className="relative min-w-0 w-auto shrink-0"
      ref={hostRef}
      {...attrs?.host}
    >
      <button
        type="button"
        data-house-page-select-trigger=""
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((next) => !next)}
        className={cn(HOUSE_PAGE_SELECT_TRIGGER_CLASS, triggerClassName)}
        {...attrs?.trigger}
      >
        <span
          data-house-page-select-current=""
          className={HOUSE_PAGE_SELECT_TRIGGER_LABEL_CLASS}
          {...attrs?.current}
        >
          {label}
        </span>
        <CaretDown
          data-house-page-select-chevron=""
          className={HOUSE_PAGE_SELECT_CHEVRON_CLASS}
          weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
          {...attrs?.chevron}
        />
      </button>
      {open ? (
        <div
          data-house-page-select-menu=""
          data-menu-host="desktop"
          data-menu-family="desktop"
          className={cn(panelClass, menuHostClass("desktop", "panel"), HOUSE_PAGE_SELECT_MENU_DESKTOP_CLASS)}
          {...attrs?.menu}
        >
          {optionsList}
        </div>
      ) : null}
      {open ? (
        <HousePageSelectSheet
          title={title}
          closeLabel={closeLabel}
          onClose={() => setOpen(false)}
          attrs={attrs}
        >
          {optionsList}
        </HousePageSelectSheet>
      ) : null}
    </div>
  );
}

function HousePageSelectOptions({
  groups,
  value,
  ariaLabel,
  onPick,
  attrs,
}: {
  groups: readonly HousePageSelectGroup[];
  value: string;
  ariaLabel: string;
  onPick: (key: string) => void;
  attrs?: HousePageSelectAttrs;
}) {
  return (
    <div role="listbox" aria-label={ariaLabel} className="flex flex-col">
      {groups.map((group) => (
        <div
          key={group.id}
          data-house-page-select-group={group.id}
          {...attrs?.group?.(group.id)}
        >
          {group.hideLabel || !group.label ? null : (
            <div
              data-house-page-select-group-label=""
              className={HOUSE_PAGE_SELECT_GROUP_CLASS}
              {...attrs?.groupLabel}
            >
              {group.label}
            </div>
          )}
          {group.options.map((option) => {
            const isSelected = option.key === value;
            return (
              <button
                key={option.key}
                type="button"
                role="option"
                data-house-page-select-option={option.key}
                aria-selected={isSelected}
                className={housePageSelectOptionClass(isSelected)}
                onClick={() => onPick(option.key)}
                {...attrs?.option?.(option.key)}
              >
                <span
                  data-house-page-select-option-label=""
                  className={HOUSE_PAGE_SELECT_OPTION_LABEL_CLASS}
                  {...attrs?.optionLabel}
                >
                  {option.label}
                </span>
                <span
                  data-house-page-select-option-check=""
                  className={HOUSE_PAGE_SELECT_OPTION_CHECK_GUTTER_CLASS}
                  aria-hidden="true"
                  {...attrs?.optionCheck}
                >
                  <AppearanceCheck
                    selected={isSelected}
                    className={HOUSE_PAGE_SELECT_OPTION_CHECK_CLASS}
                  />
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function HousePageSelectSheet({
  title,
  closeLabel,
  onClose,
  children,
  attrs,
}: {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  attrs?: HousePageSelectAttrs;
}) {
  const sheet = (
    <div
      data-house-page-select-sheet=""
      data-menu-host="phone"
      data-menu-family="C"
      role="dialog"
      aria-label={title}
      className={cn(HOUSE_PAGE_SELECT_SHEET_HOST_CLASS, menuHostClass("phone"))}
      {...attrs?.sheet}
    >
      <button type="button" aria-label={closeLabel} className={APP_SHEET_SCRIM_CLASS} onClick={onClose} />
      <div className={`${APP_SHEET_SURFACE_CLASS} relative z-10 shadow-none`}>
        <div className={`${APP_SHEET_HEAD_CLASS} justify-between`}>
          <p className="t-label text-ink-3">{title}</p>
          <Close44 label={closeLabel} onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
  return typeof document !== "undefined" ? createPortal(sheet, document.body) : sheet;
}
