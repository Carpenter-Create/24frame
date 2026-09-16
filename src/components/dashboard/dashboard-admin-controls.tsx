"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { CaretDown, DotsThree } from "@phosphor-icons/react";

import { AppearanceCheck } from "@/components/chrome/appearance-check";
import { Close44 } from "@/components/chrome/house";
import { Input } from "@/components/ui/input";
import {
  DASHBOARD_ADMIN,
  dashboardHref,
  dashboardPeriodMenuGroups,
  dashboardPeriodOption,
  filterDashboardUsers,
  type DashboardPeriodOption,
} from "@/lib/dashboard-admin";
import {
  DASHBOARD_PERIOD_CHEVRON_CLASS,
  DASHBOARD_PERIOD_GROUP_CLASS,
  DASHBOARD_PERIOD_OPTION_CHECK_CLASS,
  DASHBOARD_PERIOD_OPTION_CHECK_GUTTER_CLASS,
  DASHBOARD_PERIOD_OPTION_LABEL_CLASS,
  DASHBOARD_PERIOD_PANEL_CLASS,
  DASHBOARD_PERIOD_TRIGGER_CLASS,
  DASHBOARD_PERIOD_TRIGGER_LABEL_CLASS,
  DASHBOARD_USER_FIELD_DESKTOP_CLASS,
  DASHBOARD_USER_OVERFLOW_CLASS,
  DASHBOARD_USER_SHEET_HOST_CLASS,
  dashboardPeriodOptionClass,
} from "@/lib/dashboard-craft";
import {
  APP_SHEET_HEAD_CLASS,
  APP_SHEET_SCRIM_CLASS,
  APP_SHEET_SURFACE_CLASS,
} from "@/lib/house-sheet";
import { PHOSPHOR_CHROME_ICON_CLASS, PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
import type { ReportsUserOption } from "@/lib/reports";

export function DashboardAdminControls({
  periodKey,
  options,
  userId,
  users,
  defaultOpen = false,
  userSheetOpen = false,
}: {
  periodKey: string;
  options: readonly DashboardPeriodOption[];
  userId: string | null;
  users: readonly ReportsUserOption[];
  defaultOpen?: boolean;
  userSheetOpen?: boolean;
}) {
  const router = useRouter();
  const hostRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(defaultOpen);
  const [sheetOpen, setSheetOpen] = useState(userSheetOpen);
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
      if (host && !host.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  useEffect(() => {
    if (!sheetOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheetOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [sheetOpen]);

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
              <div data-dashboard-period-menu="" className={DASHBOARD_PERIOD_PANEL_CLASS}>
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
                            onClick={() => {
                              setOpen(false);
                              go({ period: option.key });
                            }}
                          >
                            <span
                              data-dashboard-period-option-label=""
                              className={DASHBOARD_PERIOD_OPTION_LABEL_CLASS}
                            >
                              {option.label}
                            </span>
                            <span
                              data-dashboard-period-option-check=""
                              className={DASHBOARD_PERIOD_OPTION_CHECK_GUTTER_CLASS}
                              aria-hidden="true"
                            >
                              <AppearanceCheck
                                selected={isSelected}
                                className={DASHBOARD_PERIOD_OPTION_CHECK_CLASS}
                              />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
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
      <button
        type="button"
        data-dashboard-user-overflow=""
        aria-label={DASHBOARD_ADMIN.findUser}
        aria-expanded={sheetOpen}
        aria-haspopup="dialog"
        className={DASHBOARD_USER_OVERFLOW_CLASS}
        onClick={() => setSheetOpen(true)}
      >
        <DotsThree className={PHOSPHOR_CHROME_ICON_CLASS} weight={PHOSPHOR_CHROME_IDLE_WEIGHT} />
      </button>
      {sheetOpen ? <DashboardUserSheet
        query={query}
        selected={selected}
        matches={matches}
        onQuery={setQuery}
        onPick={(id) => {
          setQuery("");
          setSheetOpen(false);
          go({ user: id });
        }}
        onClear={() => {
          setQuery("");
          go({ user: null });
        }}
        onClose={() => setSheetOpen(false)}
      /> : null}
    </div>
  );
}

function DashboardUserField({
  query,
  selected,
  matches,
  onQuery,
  onPick,
  onClear,
  sheet = false,
}: {
  query: string;
  selected: ReportsUserOption | null;
  matches: readonly ReportsUserOption[];
  onQuery: (value: string) => void;
  onPick: (id: string) => void;
  onClear: () => void;
  sheet?: boolean;
}) {
  const resultsId = sheet ? "dashboard-user-sheet-results" : "dashboard-user-results";
  return (
    <>
      <label className="flex items-center gap-[var(--space-2)]">
        <span className="t-label text-ink-3">{DASHBOARD_ADMIN.findUser}</span>
        <Input
          data-dashboard-user={sheet ? undefined : ""}
          data-dashboard-user-sheet-input={sheet ? "" : undefined}
          type="text"
          role="combobox"
          aria-expanded={matches.length > 0}
          aria-controls={resultsId}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={selected?.label ?? DASHBOARD_ADMIN.allCompany}
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          className={sheet ? "w-full" : "w-56"}
        />
      </label>
      {matches.length > 0 ? (
        <ul
          id={resultsId}
          data-dashboard-user-results={sheet ? undefined : ""}
          data-dashboard-user-sheet-results={sheet ? "" : undefined}
          className={
            sheet
              ? "mt-[var(--space-2)] overflow-hidden rounded-[var(--radius)] border border-hairline bg-surface shadow-none"
              : "absolute right-0 z-10 mt-[var(--space-2)] w-full overflow-hidden rounded-[var(--radius)] border border-hairline bg-surface shadow-none"
          }
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

function DashboardUserSheet({
  query,
  selected,
  matches,
  onQuery,
  onPick,
  onClear,
  onClose,
}: {
  query: string;
  selected: ReportsUserOption | null;
  matches: readonly ReportsUserOption[];
  onQuery: (value: string) => void;
  onPick: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const sheet = (
    <div data-dashboard-user-sheet="" role="dialog" aria-label={DASHBOARD_ADMIN.findUser} className={DASHBOARD_USER_SHEET_HOST_CLASS}>
      <button type="button" aria-label={DASHBOARD_ADMIN.findUserClose} className={APP_SHEET_SCRIM_CLASS} onClick={onClose} />
      <div className={`${APP_SHEET_SURFACE_CLASS} relative z-10 shadow-none`}>
        <div className={`${APP_SHEET_HEAD_CLASS} justify-between`}>
          <p className="t-label text-ink-3">{DASHBOARD_ADMIN.findUser}</p>
          <Close44 label={DASHBOARD_ADMIN.findUserClose} onClick={onClose} />
        </div>
        <DashboardUserField
          sheet
          query={query}
          selected={selected}
          matches={matches}
          onQuery={onQuery}
          onPick={onPick}
          onClear={onClear}
        />
      </div>
    </div>
  );
  return typeof document !== "undefined" ? createPortal(sheet, document.body) : sheet;
}
