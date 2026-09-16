"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { CaretDown } from "@phosphor-icons/react";

import { AppearanceCheck } from "@/components/chrome/appearance-check";
import { Close44 } from "@/components/chrome/house";
import { Input } from "@/components/ui/input";
import {
  DASHBOARD_ADMIN,
  dashboardHref,
  dashboardPeriodMenuGroups,
  dashboardPeriodOption,
  filterDashboardUsers,
  type DashboardPeriodMenuGroup,
  type DashboardPeriodOption,
} from "@/lib/dashboard-admin";
import {
  DASHBOARD_PERIOD_CHEVRON_CLASS,
  DASHBOARD_PERIOD_GROUP_CLASS,
  DASHBOARD_PERIOD_MENU_DESKTOP_CLASS,
  DASHBOARD_PERIOD_OPTION_CHECK_CLASS,
  DASHBOARD_PERIOD_OPTION_CHECK_GUTTER_CLASS,
  DASHBOARD_PERIOD_OPTION_LABEL_CLASS,
  DASHBOARD_PERIOD_PANEL_CLASS,
  DASHBOARD_PERIOD_SHEET_HOST_CLASS,
  DASHBOARD_PERIOD_SHEET_SCROLL_CLASS,
  DASHBOARD_PERIOD_SHEET_SURFACE_CLASS,
  DASHBOARD_PERIOD_TRIGGER_CLASS,
  DASHBOARD_PERIOD_TRIGGER_LABEL_CLASS,
  DASHBOARD_USER_FIELD_DESKTOP_CLASS,
  dashboardPeriodOptionClass,
} from "@/lib/dashboard-craft";
import {
  APP_SHEET_HEAD_CLASS,
  APP_SHEET_SCRIM_CLASS,
  APP_SHEET_SURFACE_CLASS,
} from "@/lib/house-sheet";
import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
import type { ReportsUserOption } from "@/lib/reports";

export function DashboardAdminControls({
  periodKey,
  options,
  userId,
  users,
  defaultOpen = false,
}: {
  periodKey: string;
  options: readonly DashboardPeriodOption[];
  userId: string | null;
  users: readonly ReportsUserOption[];
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const hostRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(defaultOpen);
  const selected = users.find((user) => user.id === userId) ?? null;
  const [query, setQuery] = useState("");
  const current = dashboardPeriodOption(options, periodKey);
  const groups = dashboardPeriodMenuGroups(options);

  function go(next: { period?: string; user?: string | null }) {
    router.replace(
      dashboardHref({
        period: next.period ?? periodKey,
        user: next.user === undefined ? userId : next.user,
      }),
      { scroll: false },
    );
  }

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

  const matches = useMemo(() => filterDashboardUsers(users, query), [users, query]);

  return (
    <div
      data-dashboard-admin-controls=""
      className="flex w-full flex-wrap items-center justify-end gap-[var(--space-4)] md:w-auto"
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-[var(--space-4)] md:flex-none">
        <div className="flex min-w-0 flex-1 items-center gap-[var(--space-2)] md:flex-none">
          <span className="t-label text-ink-3">{DASHBOARD_ADMIN.period}</span>
          <div ref={hostRef} className="relative min-w-0 flex-1 md:flex-none">
            <button
              type="button"
              data-dashboard-period=""
              data-dashboard-period-one=""
              aria-label={DASHBOARD_ADMIN.period}
              aria-expanded={open}
              aria-haspopup="listbox"
              onClick={() => setOpen((next) => !next)}
              className={DASHBOARD_PERIOD_TRIGGER_CLASS}
            >
              <span data-dashboard-period-current="" className={DASHBOARD_PERIOD_TRIGGER_LABEL_CLASS}>
                {current?.label ?? periodKey}
              </span>
              <CaretDown
                data-dashboard-period-chevron=""
                className={DASHBOARD_PERIOD_CHEVRON_CLASS}
                weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
              />
            </button>
            {open ? (
              <div
                data-dashboard-period-menu=""
                className={`${DASHBOARD_PERIOD_PANEL_CLASS} ${DASHBOARD_PERIOD_MENU_DESKTOP_CLASS}`}
              >
                <DashboardPeriodOptions
                  groups={groups}
                  periodKey={periodKey}
                  onPick={(key) => {
                    setOpen(false);
                    go({ period: key });
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className={DASHBOARD_USER_FIELD_DESKTOP_CLASS}>
        <DashboardUserField
          query={query}
          selected={selected}
          matches={matches}
          onQuery={setQuery}
          onPick={(id) => {
            setQuery("");
            go({ user: id });
          }}
          onClear={() => {
            setQuery("");
            go({ user: null });
          }}
        />
      </div>
      {open ? (
        <DashboardPeriodSheet
          groups={groups}
          periodKey={periodKey}
          onPick={(key) => {
            setOpen(false);
            go({ period: key });
          }}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

function DashboardPeriodOptions({
  groups,
  periodKey,
  onPick,
}: {
  groups: readonly DashboardPeriodMenuGroup[];
  periodKey: string;
  onPick: (key: string) => void;
}) {
  return (
    <div role="listbox" aria-label={DASHBOARD_ADMIN.period} className="flex flex-col">
      {groups.map((group) => (
        <div key={group.group} data-dashboard-period-group={group.group}>
          {group.group === "all" || group.group === "ytd" ? null : (
            <div data-dashboard-period-group-label="" className={DASHBOARD_PERIOD_GROUP_CLASS}>
              {group.label}
            </div>
          )}
          {group.options.map((option) => {
            const isSelected = option.key === periodKey;
            return (
              <button
                key={option.key}
                type="button"
                role="option"
                data-dashboard-period-option={option.key}
                aria-selected={isSelected}
                className={dashboardPeriodOptionClass(isSelected)}
                onClick={() => onPick(option.key)}
              >
                <span data-dashboard-period-option-label="" className={DASHBOARD_PERIOD_OPTION_LABEL_CLASS}>
                  {option.label}
                </span>
                <span
                  data-dashboard-period-option-check=""
                  className={DASHBOARD_PERIOD_OPTION_CHECK_GUTTER_CLASS}
                  aria-hidden="true"
                >
                  <AppearanceCheck selected={isSelected} className={DASHBOARD_PERIOD_OPTION_CHECK_CLASS} />
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function DashboardPeriodSheet({
  groups,
  periodKey,
  onPick,
  onClose,
}: {
  groups: readonly DashboardPeriodMenuGroup[];
  periodKey: string;
  onPick: (key: string) => void;
  onClose: () => void;
}) {
  const sheet = (
    <div
      data-dashboard-period-sheet=""
      role="dialog"
      aria-label={DASHBOARD_ADMIN.period}
      className={DASHBOARD_PERIOD_SHEET_HOST_CLASS}
    >
      <button type="button" aria-label={DASHBOARD_ADMIN.close} className={APP_SHEET_SCRIM_CLASS} onClick={onClose} />
      <div className={`${APP_SHEET_SURFACE_CLASS} ${DASHBOARD_PERIOD_SHEET_SURFACE_CLASS}`}>
        <div className={`${APP_SHEET_HEAD_CLASS} justify-between`}>
          <p className="t-label text-ink-3">{DASHBOARD_ADMIN.period}</p>
          <Close44 label={DASHBOARD_ADMIN.close} onClick={onClose} />
        </div>
        <div className={DASHBOARD_PERIOD_SHEET_SCROLL_CLASS}>
          <DashboardPeriodOptions groups={groups} periodKey={periodKey} onPick={onPick} />
        </div>
      </div>
    </div>
  );
  return typeof document !== "undefined" ? createPortal(sheet, document.body) : sheet;
}

function DashboardUserField({
  query,
  selected,
  matches,
  onQuery,
  onPick,
  onClear,
}: {
  query: string;
  selected: ReportsUserOption | null;
  matches: readonly ReportsUserOption[];
  onQuery: (value: string) => void;
  onPick: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <>
      <label className="flex items-center gap-[var(--space-2)]">
        <span className="t-label text-ink-3">{DASHBOARD_ADMIN.findUser}</span>
        <Input
          data-dashboard-user=""
          type="text"
          role="combobox"
          aria-expanded={matches.length > 0}
          aria-controls="dashboard-user-results"
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={selected?.label ?? DASHBOARD_ADMIN.allCompany}
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          className="w-56"
        />
      </label>
      {matches.length > 0 ? (
        <ul
          id="dashboard-user-results"
          data-dashboard-user-results=""
          className="absolute right-0 z-10 mt-[var(--space-2)] w-full overflow-hidden rounded-[var(--radius)] border border-hairline bg-surface shadow-none"
        >
          {matches.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                data-dashboard-user-option={user.id}
                className="w-full px-[var(--space-4)] py-[var(--space-2)] text-left t-body-sm text-ink hover:bg-surface-muted"
                onClick={() => onPick(user.id)}
              >
                {user.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {selected ? (
        <button
          type="button"
          data-dashboard-user-clear=""
          className="mt-[var(--space-2)] t-body-sm text-accent"
          onClick={onClear}
        >
          {DASHBOARD_ADMIN.allCompany}
        </button>
      ) : null}
    </>
  );
}
