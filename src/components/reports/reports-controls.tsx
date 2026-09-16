"use client";

import { useRouter } from "next/navigation";

import { REPORTS_PAGE, reportsHref, type ReportsMonthOption, type ReportsUserOption } from "@/lib/reports";
import {
  REPORTS_DOWNLOAD_CLASS,
  REPORTS_DOWNLOAD_OFF_CLASS,
  REPORTS_SELECT_CLASS,
} from "@/lib/reports-craft";

export function ReportsControls({
  periodKey,
  months,
  userId,
  users,
  downloadHref,
}: {
  periodKey: string;
  months: readonly ReportsMonthOption[];
  userId: string | null;
  users: readonly ReportsUserOption[];
  downloadHref: string | null;
}) {
  const router = useRouter();

  function go(next: { period?: string; user?: string | null }) {
    router.push(
      reportsHref({
        period: next.period ?? periodKey,
        user: next.user === undefined ? userId : next.user,
      }),
    );
  }

  return (
    <div data-reports-controls="" className="flex flex-wrap items-center justify-end gap-[var(--space-4)]">
      <label className="flex items-center gap-[var(--space-2)]">
        <span className="t-label text-ink-3">{REPORTS_PAGE.period}</span>
        <select
          data-reports-period=""
          aria-label={REPORTS_PAGE.period}
          className={REPORTS_SELECT_CLASS}
          value={periodKey}
          onChange={(event) => go({ period: event.target.value })}
        >
          <option value="all">{REPORTS_PAGE.allTime}</option>
          <option value="this-month">{REPORTS_PAGE.thisMonth}</option>
          {months.map((month) => (
            <option key={month.key} value={month.key}>
              {month.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-[var(--space-2)]">
        <span className="t-label text-ink-3">{REPORTS_PAGE.scope}</span>
        <select
          data-reports-user=""
          aria-label={REPORTS_PAGE.scope}
          className={REPORTS_SELECT_CLASS}
          value={userId ?? "all"}
          onChange={(event) => go({ user: event.target.value === "all" ? null : event.target.value })}
        >
          <option value="all">{REPORTS_PAGE.allActivity}</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.label}
            </option>
          ))}
        </select>
      </label>
      {downloadHref ? (
        <a data-reports-download="" href={downloadHref} className={REPORTS_DOWNLOAD_CLASS}>
          {REPORTS_PAGE.download}
        </a>
      ) : (
        <span data-reports-download-off="" className={REPORTS_DOWNLOAD_OFF_CLASS}>
          {REPORTS_PAGE.download}
        </span>
      )}
    </div>
  );
}
