"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  DASHBOARD_ADMIN,
  dashboardHref,
  filterDashboardUsers,
} from "@/lib/dashboard-admin";
import { FORM_CONTROL_TEXT_CLASS } from "@/lib/form-control";
import { REPORTS_SELECT_CLASS } from "@/lib/reports-craft";
import type { DashboardPeriodOption } from "@/lib/dashboard-admin";
import type { ReportsUserOption } from "@/lib/reports";

export function DashboardAdminControls({
  periodKey,
  options,
  userId,
  users,
}: {
  periodKey: string;
  options: readonly DashboardPeriodOption[];
  userId: string | null;
  users: readonly ReportsUserOption[];
}) {
  const router = useRouter();
  const selected = users.find((user) => user.id === userId) ?? null;
  const [query, setQuery] = useState("");

  function go(next: { period?: string; user?: string | null }) {
    router.replace(
      dashboardHref({
        period: next.period ?? periodKey,
        user: next.user === undefined ? userId : next.user,
      }),
      { scroll: false },
    );
  }

  const matches = useMemo(() => filterDashboardUsers(users, query), [users, query]);

  return (
    <div
      data-dashboard-admin-controls=""
      className="flex flex-wrap items-center justify-end gap-[var(--space-4)]"
    >
      <label className="flex items-center gap-[var(--space-2)]">
        <span className="t-label text-ink-3">{DASHBOARD_ADMIN.period}</span>
        <select
          data-dashboard-period=""
          aria-label={DASHBOARD_ADMIN.period}
          className={REPORTS_SELECT_CLASS}
          value={periodKey}
          onChange={(event) => go({ period: event.target.value })}
        >
          {options.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <div className="relative">
        <label className="flex items-center gap-[var(--space-2)]">
          <span className="t-label text-ink-3">{DASHBOARD_ADMIN.findUser}</span>
          <input
            data-dashboard-user=""
            type="text"
            role="combobox"
            aria-expanded={matches.length > 0}
            aria-controls="dashboard-user-results"
            aria-autocomplete="list"
            autoComplete="off"
            placeholder={selected?.label ?? DASHBOARD_ADMIN.allCompany}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={`${FORM_CONTROL_TEXT_CLASS} ${REPORTS_SELECT_CLASS} w-56`}
          />
        </label>
        {matches.length > 0 ? (
          <ul
            id="dashboard-user-results"
            data-dashboard-user-results=""
            className="absolute right-0 z-10 mt-[var(--space-2)] w-full overflow-hidden rounded-[var(--radius-sm)] border border-hairline bg-surface"
          >
            {matches.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  data-dashboard-user-option={user.id}
                  className="w-full px-[var(--space-4)] py-[var(--space-2)] text-left t-body-sm text-ink hover:bg-surface-muted"
                  onClick={() => {
                    setQuery("");
                    go({ user: user.id });
                  }}
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
            className="mt-[var(--space-2)] t-body-sm text-ink-3 hover:text-ink-2"
            onClick={() => {
              setQuery("");
              go({ user: null });
            }}
          >
            {DASHBOARD_ADMIN.allCompany}
          </button>
        ) : null}
      </div>
    </div>
  );
}
