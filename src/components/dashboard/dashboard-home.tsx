import Link from "next/link";
import { Pulse } from "@phosphor-icons/react/ssr";

import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";

import { cn } from "@/lib/cn";
import {
  DASHBOARD_CARD_CLASS,
  DASHBOARD_CARD_PAD_LIST,
  DASHBOARD_DO_NEXT_SECONDARY_CLASS,
  DASHBOARD_SECTION_TITLE_CLASS,
  DASHBOARD_RELATED_GAP_CLASS,
  DASHBOARD_ROW_CLASS,
  DASHBOARD_ROW_LIST_CLASS,
} from "@/lib/dashboard-craft";
import { AGGREGATION_LEAD_TITLE } from "@/lib/aggregation-lead-title";
import { TITLES_HREF } from "@/lib/title-public-id";
import { DASHBOARD_ATTENTION_CLEAR } from "@/lib/findings";
import {
  DASHBOARD_HOME,
  dashboardJustInDate,
  dashboardTitleStatusLabel,
  type ClientHomeDoNextItem,
  type ClientHomeJustInItem,
} from "@/lib/dashboard-home";

// Client-home chrome only. Not the shared Card — a Card/table change must not
// restyle Titles, Deliveries, Catalog Health, or staff surfaces.

export function DashboardHomePanel({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        DASHBOARD_CARD_CLASS,
        className,
      )}
      {...props}
    />
  );
}

export function DashboardHomePillLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "dashboard-home-pill inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-accent px-3.5 t-body-sm font-medium text-accent-contrast transition hover:opacity-90",
        className,
      )}
    >
      <Pulse className="size-[14px]" weight={PHOSPHOR_CHROME_IDLE_WEIGHT} aria-hidden />
      {children}
    </Link>
  );
}

export function DashboardHomeStatusPill({ label }: { label: string }) {
  return (
    <span
      data-dashboard-status-pill=""
      className="inline-flex shrink-0 items-center rounded-full border border-hairline bg-surface-muted px-2 py-[3px] t-body-sm text-ink-2"
    >
      {label}
    </span>
  );
}

export function DashboardHomeEmpty({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="dashboard-home-empty flex flex-1 flex-col justify-center border-t border-hairline px-[var(--space-4)] py-[var(--space-6)]">
      <p className="t-body-sm text-ink-3">{children}</p>
      {action}
    </div>
  );
}

export function DashboardOrgIdentity() {
  return (
    <header className="dashboard-home-identity min-w-0">
      <h1 className="t-title text-ink">{AGGREGATION_LEAD_TITLE}</h1>
    </header>
  );
}

export function DashboardSnapshot({
  catalog,
  needsAttention,
  live,
}: {
  catalog: string;
  needsAttention: string;
  live: string;
}) {
  const stats = [
    { key: "catalog", label: DASHBOARD_HOME.catalog, value: catalog, highlight: false },
    {
      key: "needsAttention",
      label: DASHBOARD_HOME.needsAttention,
      value: needsAttention,
      highlight: true,
    },
    { key: "live", label: DASHBOARD_HOME.live, value: live, highlight: false },
  ] as const;

  return (
    <dl
      className="dashboard-home-snapshot grid grid-cols-1 overflow-hidden rounded-[var(--radius-lg)] border border-hairline bg-surface sm:grid-cols-3"
      data-dashboard-snapshot=""
    >
      {stats.map((stat, i) => (
        <div
          key={stat.key}
          className={cn(
            "flex flex-col gap-2 p-[var(--space-6)]",
            i > 0 && "border-t border-hairline sm:border-t-0 sm:border-l",
          )}
        >
          <dt className="t-label text-ink-3">{stat.label}</dt>
          <dd
            data-dashboard-stat={stat.key}
            className={cn(
              // One large moment on `/` — org name stays t-title (title step).
              "t-display t-data leading-none",
              stat.highlight ? "text-accent" : "text-ink",
            )}
          >
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function DashboardDoNext({
  items,
  secondary = false,
}: {
  items: ClientHomeDoNextItem[];
  secondary?: boolean;
}) {
  return (
    <DashboardHomePanel
      aria-label={DASHBOARD_HOME.doNext}
      data-dashboard-do-next=""
      data-dashboard-do-next-secondary={secondary ? "" : undefined}
      className={secondary ? DASHBOARD_DO_NEXT_SECONDARY_CLASS : undefined}
    >
      <span className={cn(DASHBOARD_CARD_PAD_LIST, DASHBOARD_SECTION_TITLE_CLASS)}>{DASHBOARD_HOME.doNext}</span>
      {items.length === 0 ? (
        <DashboardHomeEmpty>{DASHBOARD_ATTENTION_CLEAR}</DashboardHomeEmpty>
      ) : (
        <ul className={DASHBOARD_ROW_LIST_CLASS}>
          {items.map((item) => {
            const statusLabel = dashboardTitleStatusLabel(item.status);
            return (
              <li
                key={item.id}
                data-dashboard-do-next-row={item.id}
                className={DASHBOARD_ROW_CLASS}
              >
                <div className="min-w-0">
                  <Link
                    href={`${TITLES_HREF}/${item.id}`}
                    className="t-body-sm font-medium text-ink transition-colors hover:text-ink-2"
                  >
                    {item.title}
                  </Link>
                  {item.reason ? (
                    <p className="mt-0.5 t-body-sm text-ink-3">{item.reason}</p>
                  ) : null}
                </div>
                {statusLabel ? <DashboardHomeStatusPill label={statusLabel} /> : null}
              </li>
            );
          })}
        </ul>
      )}
    </DashboardHomePanel>
  );
}

export function DashboardJustIn({
  titles,
  catalogEmpty = false,
  canAddTitle = false,
}: {
  titles: ClientHomeJustInItem[];
  catalogEmpty?: boolean;
  canAddTitle?: boolean;
}) {
  const emptyCopy = catalogEmpty ? DASHBOARD_HOME.catalogEmpty : DASHBOARD_HOME.justInEmpty;
  const emptyAction =
    catalogEmpty && canAddTitle ? (
      <Link
        href={DASHBOARD_HOME.addTitleHref}
        data-dashboard-add-title=""
        className="mt-[var(--space-3)] t-body-sm text-accent transition-colors hover:underline"
      >
        {DASHBOARD_HOME.addTitle}
      </Link>
    ) : undefined;

  return (
    <DashboardHomePanel aria-label={DASHBOARD_HOME.justIn} data-dashboard-just-in="">
      <span className={cn(DASHBOARD_CARD_PAD_LIST, DASHBOARD_SECTION_TITLE_CLASS)}>{DASHBOARD_HOME.justIn}</span>
      {titles.length === 0 ? (
        <DashboardHomeEmpty action={emptyAction}>{emptyCopy}</DashboardHomeEmpty>
      ) : (
        <ul className={DASHBOARD_ROW_LIST_CLASS}>
          {titles.map((t) => {
            const statusLabel = dashboardTitleStatusLabel(t.status);
            return (
              <li
                key={t.id}
                data-dashboard-just-in-row={t.id}
                className={DASHBOARD_ROW_CLASS}
              >
                <span
                  data-dashboard-just-in-cluster=""
                  className={cn("flex min-w-0 flex-wrap items-center", DASHBOARD_RELATED_GAP_CLASS)}
                >
                  <Link
                    href={`${TITLES_HREF}/${t.id}`}
                    className="t-body-sm font-medium text-ink transition-colors hover:text-ink-2"
                  >
                    {t.title}
                  </Link>
                  {statusLabel ? <DashboardHomeStatusPill label={statusLabel} /> : null}
                </span>
                <time
                  className="t-body-sm shrink-0 text-ink-3"
                  dateTime={t.created_at}
                >
                  {dashboardJustInDate(t.created_at)}
                </time>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardHomePanel>
  );
}
