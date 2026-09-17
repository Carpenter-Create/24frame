"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { CaretDown } from "@phosphor-icons/react";

import { Close44 } from "@/components/chrome/house";
import { AppearanceCheck } from "@/components/chrome/appearance-check";
import {
  DASHBOARD_PERIOD_CHEVRON_CLASS,
  DASHBOARD_PERIOD_GROUP_CLASS,
  DASHBOARD_PERIOD_OPTION_CHECK_CLASS,
  DASHBOARD_PERIOD_OPTION_CHECK_GUTTER_CLASS,
  DASHBOARD_PERIOD_OPTION_LABEL_CLASS,
  DASHBOARD_PERIOD_SHEET_HOST_CLASS,
  dashboardPeriodOptionClass,
} from "@/lib/dashboard-craft";
import {
  APP_SHEET_HEAD_CLASS,
  APP_SHEET_SCRIM_CLASS,
  APP_SHEET_SURFACE_CLASS,
} from "@/lib/house-sheet";
import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
import { cn } from "@/lib/cn";
import {
  REPORTS_PAGE,
  REPORTS_PERIOD_PRESETS,
  filterReportsUsers,
  reportsHref,
  type ReportsPeriod,
  type ReportsPeriodKind,
  type ReportsPeriodOption,
  type ReportsUserOption,
} from "@/lib/reports";
import {
  REPORTS_CONTROLS_CLASS,
  REPORTS_DOWNLOAD_CLASS,
  REPORTS_DOWNLOAD_OFF_CLASS,
  REPORTS_DOWNLOAD_PRIMARY_OFF_CLASS,
  REPORTS_PERIOD_CHIP_CLASS,
  REPORTS_PERIOD_CHIP_OFF_CLASS,
  REPORTS_PERIOD_CHIP_ON_CLASS,
  REPORTS_PERIOD_CHIP_STUB_CLASS,
  REPORTS_PERIOD_CLUSTER_CLASS,
  REPORTS_PERIOD_TRIGGER_CLASS,
  REPORTS_RELATED_GAP_CLASS,
  REPORTS_USER_PANEL_CLASS,
  REPORTS_USER_TRIGGER_CLASS,
} from "@/lib/reports-craft";

function grainForPeriod(period: ReportsPeriod): ReportsPeriodKind {
  return period.kind;
}

export function ReportsControls({
  period,
  options,
  userIds,
  users,
  downloadHref,
  showUserScope = true,
  periodSheetOpen = false,
}: {
  period: ReportsPeriod;
  options: readonly ReportsPeriodOption[];
  userIds: readonly string[];
  users: readonly ReportsUserOption[];
  downloadHref: string | null;
  showUserScope?: boolean;
  periodSheetOpen?: boolean;
}) {
  const router = useRouter();
  const concrete = period.kind !== "all";

  function go(next: { period?: string; users?: readonly string[] }) {
    router.push(
      reportsHref({
        period: next.period ?? period.key,
        users: next.users ?? userIds,
      }),
    );
  }

  return (
    <div data-reports-controls="" className={REPORTS_CONTROLS_CLASS}>
      <ReportsPeriodCluster
        period={period}
        options={options}
        defaultSheetOpen={periodSheetOpen}
        onPick={(key) => go({ period: key })}
      />
      {showUserScope ? (
        <ReportsUserScope
          userIds={userIds}
          users={users}
          onChange={(next) => go({ users: next })}
        />
      ) : null}
      {downloadHref ? (
        <a
          data-reports-download=""
          data-reports-export=""
          href={downloadHref}
          className={concrete ? REPORTS_DOWNLOAD_CLASS : REPORTS_DOWNLOAD_OFF_CLASS}
        >
          {REPORTS_PAGE.download}
        </a>
      ) : (
        <span
          data-reports-download-off=""
          data-reports-export=""
          className={concrete ? REPORTS_DOWNLOAD_PRIMARY_OFF_CLASS : REPORTS_DOWNLOAD_OFF_CLASS}
        >
          {REPORTS_PAGE.download}
        </span>
      )}
    </div>
  );
}

function ReportsPeriodCluster({
  period,
  options,
  onPick,
  defaultSheetOpen,
}: {
  period: ReportsPeriod;
  options: readonly ReportsPeriodOption[];
  onPick: (key: string) => void;
  defaultSheetOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultSheetOpen);
  const selectedGrain = grainForPeriod(period);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
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

  return (
    <div data-reports-period="" className={cn("min-w-0", REPORTS_RELATED_GAP_CLASS, "flex items-center")}>
      <div data-reports-period-cluster="" className={REPORTS_PERIOD_CLUSTER_CLASS}>
        {REPORTS_PERIOD_PRESETS.map((preset) => {
          const on = selectedGrain === preset.grain;
          const option = options.find((row) => row.group === preset.grain);
          const key = option?.key ?? preset.grain;
          return (
            <button
              key={preset.grain}
              type="button"
              data-reports-period-chip={preset.grain}
              aria-pressed={on}
              className={cn(
                REPORTS_PERIOD_CHIP_CLASS,
                on ? REPORTS_PERIOD_CHIP_ON_CLASS : REPORTS_PERIOD_CHIP_OFF_CLASS,
              )}
              onClick={() => onPick(key)}
            >
              {preset.label}
            </button>
          );
        })}
        <span
          data-reports-period-custom=""
          data-reports-period-stub=""
          title={REPORTS_PAGE.customStub}
          className={cn(REPORTS_PERIOD_CHIP_CLASS, REPORTS_PERIOD_CHIP_STUB_CLASS)}
        >
          {REPORTS_PAGE.custom}
        </span>
      </div>
      <button
        type="button"
        data-reports-period-trigger=""
        aria-label={REPORTS_PAGE.period}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((next) => !next)}
        className={REPORTS_PERIOD_TRIGGER_CLASS}
      >
        <span data-reports-period-current="">{period.label}</span>
        <CaretDown className={DASHBOARD_PERIOD_CHEVRON_CLASS} weight={PHOSPHOR_CHROME_IDLE_WEIGHT} />
      </button>
      {open ? (
        <ReportsPeriodSheet
          periodKey={period.key}
          options={options}
          onPick={(key) => {
            setOpen(false);
            onPick(key);
          }}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

function ReportsPeriodSheet({
  periodKey,
  options,
  onPick,
  onClose,
}: {
  periodKey: string;
  options: readonly ReportsPeriodOption[];
  onPick: (key: string) => void;
  onClose: () => void;
}) {
  const groups = useMemo(() => {
    const order: Array<ReportsPeriodOption["group"]> = [
      "all",
      "ytd",
      "year",
      "quarter",
      "month",
      "custom",
    ];
    return order.flatMap((group) => {
      const rows = options.filter((option) => option.group === group);
      return rows.length > 0 ? [{ group, rows }] : [];
    });
  }, [options]);

  const sheet = (
    <div
      data-reports-period-sheet=""
      role="dialog"
      aria-label={REPORTS_PAGE.period}
      className={DASHBOARD_PERIOD_SHEET_HOST_CLASS}
    >
      <button type="button" aria-label={REPORTS_PAGE.close} className={APP_SHEET_SCRIM_CLASS} onClick={onClose} />
      <div className={`${APP_SHEET_SURFACE_CLASS} relative z-10 shadow-none`}>
        <div className={`${APP_SHEET_HEAD_CLASS} justify-between`}>
          <p className="t-label text-ink-3">{REPORTS_PAGE.period}</p>
          <Close44 label={REPORTS_PAGE.close} onClick={onClose} />
        </div>
        <div role="listbox" aria-label={REPORTS_PAGE.period} className="flex flex-col">
          {groups.map((group) => (
            <div key={group.group} data-reports-period-group={group.group}>
              {group.group === "all" || group.group === "ytd" ? null : (
                <div className={DASHBOARD_PERIOD_GROUP_CLASS}>{group.rows[0]?.label && group.group}</div>
              )}
              {group.rows.map((option) => {
                const isSelected = option.key === periodKey;
                return (
                  <button
                    key={option.key}
                    type="button"
                    role="option"
                    data-reports-period-option={option.key}
                    aria-selected={isSelected}
                    className={dashboardPeriodOptionClass(isSelected)}
                    onClick={() => onPick(option.key)}
                  >
                    <span className={DASHBOARD_PERIOD_OPTION_LABEL_CLASS}>{option.label}</span>
                    <span className={DASHBOARD_PERIOD_OPTION_CHECK_GUTTER_CLASS} aria-hidden="true">
                      <AppearanceCheck selected={isSelected} className={DASHBOARD_PERIOD_OPTION_CHECK_CLASS} />
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
          <div data-reports-period-group="custom">
            <span
              data-reports-period-custom=""
              data-reports-period-stub=""
              className={cn(dashboardPeriodOptionClass(false), "cursor-not-allowed text-ink-3")}
            >
              <span className={DASHBOARD_PERIOD_OPTION_LABEL_CLASS}>{REPORTS_PAGE.custom}</span>
            </span>
            <p className="px-[var(--space-4)] pb-[var(--space-2)] t-body-sm text-ink-3">
              {REPORTS_PAGE.customStub}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
  return typeof document !== "undefined" ? createPortal(sheet, document.body) : sheet;
}

function ReportsUserScope({
  userIds,
  users,
  onChange,
}: {
  userIds: readonly string[];
  users: readonly ReportsUserOption[];
  onChange: (next: readonly string[]) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = new Set(userIds);
  const matches = filterReportsUsers(users, query);
  const label =
    userIds.length === 0
      ? REPORTS_PAGE.allActivity
      : userIds
          .map((id) => users.find((user) => user.id === id)?.label)
          .filter((name): name is string => Boolean(name))
          .join(", ") || REPORTS_PAGE.allActivity;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: MouseEvent) => {
      const host = hostRef.current;
      if (!host || host.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  function toggle(id: string) {
    const next = selected.has(id) ? userIds.filter((item) => item !== id) : [...userIds, id];
    onChange(next);
  }

  return (
    <div ref={hostRef} data-reports-user="" className="relative min-w-0">
      <button
        type="button"
        data-reports-user-trigger=""
        aria-label={REPORTS_PAGE.scope}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={REPORTS_USER_TRIGGER_CLASS}
        onClick={() => setOpen((next) => !next)}
      >
        {label}
      </button>
      {open ? (
        <div data-reports-user-panel="" className={REPORTS_USER_PANEL_CLASS}>
          <div className="flex items-center justify-between gap-[var(--space-2)] border-b border-hairline px-[var(--space-4)] py-[var(--space-2)]">
            <p className="t-label text-ink-3">{REPORTS_PAGE.findUser}</p>
            {userIds.length > 0 ? (
              <button
                type="button"
                data-reports-user-clear=""
                className="t-body-sm text-accent"
                onClick={() => onChange([])}
              >
                {REPORTS_PAGE.clearScope}
              </button>
            ) : null}
          </div>
          <label className="border-b border-hairline px-[var(--space-4)] py-[var(--space-2)]">
            <span className="sr-only">{REPORTS_PAGE.findUser}</span>
            <input
              data-reports-user-typeahead=""
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={REPORTS_PAGE.findUser}
              className="w-full bg-transparent t-body-sm text-ink placeholder:text-ink-3"
            />
          </label>
          <ul role="listbox" aria-label={REPORTS_PAGE.scope} className="max-h-56 overflow-y-auto">
            {matches.map((user) => {
              const on = selected.has(user.id);
              return (
                <li key={user.id}>
                  <button
                    type="button"
                    role="option"
                    data-reports-user-option={user.id}
                    aria-selected={on}
                    className={dashboardPeriodOptionClass(on)}
                    onClick={() => toggle(user.id)}
                  >
                    <span className={DASHBOARD_PERIOD_OPTION_LABEL_CLASS}>{user.label}</span>
                    <span className={DASHBOARD_PERIOD_OPTION_CHECK_GUTTER_CLASS} aria-hidden="true">
                      <AppearanceCheck selected={on} className={DASHBOARD_PERIOD_OPTION_CHECK_CLASS} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
