"use client";

import { Suspense, use, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, FilmSlate, PaperPlaneTilt } from "@phosphor-icons/react";

import { markNotificationsRead } from "@/app/(app)/messages/actions";
import {
  ACTIVITY_BELL_OPEN_DOT_CLASS,
  ACTIVITY_BELL_TRIGGER_CLASS,
  ACTIVITY_BELL_TRIGGER_OPEN_CLASS,
  ACTIVITY_HREF,
  ACTIVITY_PAGE,
  activityItemHref,
  activityKindIcon,
  activityRelativeTime,
  type ActivityItem,
} from "@/lib/activity";
import { PHOSPHOR_CHROME_ICON_CLASS, PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
import { REPORTS_USER_PANEL_CLASS } from "@/lib/reports-craft";
import { cn } from "@/lib/cn";

function isPromise<T>(value: T | Promise<T>): value is Promise<T> {
  return typeof value === "object" && value !== null && "then" in value;
}

export function ActivityBell({
  unread = 0,
  items = [],
  defaultOpen = false,
  now,
}: {
  unread?: Promise<number> | number;
  items?: Promise<ActivityItem[]> | ActivityItem[];
  defaultOpen?: boolean;
  now?: number;
}) {
  if (isPromise(unread) || isPromise(items)) {
    return (
      <Suspense fallback={<ActivityBellTrigger count={0} />}>
        <ActivityBellLive
          unread={isPromise(unread) ? unread : Promise.resolve(unread)}
          items={isPromise(items) ? items : Promise.resolve(items)}
          defaultOpen={defaultOpen}
          now={now}
        />
      </Suspense>
    );
  }
  return (
    <ActivityBellChrome count={unread} items={items} defaultOpen={defaultOpen} now={now} />
  );
}

function ActivityBellLive({
  unread,
  items,
  defaultOpen,
  now,
}: {
  unread: Promise<number>;
  items: Promise<ActivityItem[]>;
  defaultOpen: boolean;
  now?: number;
}) {
  const count = use(unread);
  const openItems = use(items);
  return (
    <ActivityBellChrome count={count} items={openItems} defaultOpen={defaultOpen} now={now} />
  );
}

function ActivityBellChrome({
  count,
  items,
  defaultOpen,
  now,
}: {
  count: number;
  items: ActivityItem[];
  defaultOpen: boolean;
  now?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event: PointerEvent) {
      const root = rootRef.current;
      if (!root || !(event.target instanceof Node) || root.contains(event.target)) return;
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <ActivityBellTrigger
        count={count}
        open={open}
        aria-expanded={open}
        onClick={() => setOpen((next) => !next)}
      />
      {open ? (
        <div
          data-activity-bell-popover=""
          className={cn(REPORTS_USER_PANEL_CLASS, "right-0 min-w-[20rem]")}
        >
          <div
            data-activity-bell-header=""
            className="flex items-center justify-between gap-[var(--space-3)] border-b border-hairline px-[var(--space-4)] py-[var(--space-3)]"
          >
            <p data-activity-bell-title="" className="t-body-sm font-medium text-ink">
              {ACTIVITY_PAGE.title}
            </p>
            {items.length > 0 ? <BellMarkAllDone ids={items.map((item) => item.id)} /> : null}
          </div>
          {items.length === 0 ? (
            <p className="px-[var(--space-4)] py-[var(--space-4)] t-body-sm text-ink-3">
              {ACTIVITY_PAGE.bellEmpty}
            </p>
          ) : (
            <ul className="flex flex-col">
              {items.map((item) => {
                const href = activityItemHref(item);
                const kind = activityKindIcon(item.kind);
                const KindIcon = kind === "film-slate" ? FilmSlate : PaperPlaneTilt;
                return (
                  <li
                    key={item.id}
                    data-activity-bell-item={item.id}
                    data-activity-bell-kind={kind}
                    className="flex items-start gap-[var(--space-3)] border-b border-hairline px-[var(--space-4)] py-[var(--space-3)]"
                  >
                    <KindIcon
                      data-activity-bell-type-icon={kind}
                      className={cn(PHOSPHOR_CHROME_ICON_CLASS, "mt-0.5 text-ink-3")}
                      weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="t-body-sm font-medium text-ink">{item.title}</p>
                      <p
                        data-activity-bell-detail=""
                        className="truncate t-label text-ink-3"
                      >
                        {item.body}
                      </p>
                      <p data-activity-bell-time="" className="t-label text-ink-3">
                        {activityRelativeTime(item.created_at, now)}
                      </p>
                    </div>
                    <span
                      data-activity-bell-open-dot=""
                      aria-hidden="true"
                      className={ACTIVITY_BELL_OPEN_DOT_CLASS}
                    />
                    <div className="flex shrink-0 flex-col items-end gap-[var(--space-1)]">
                      <Link
                        href={href}
                        data-activity-bell-view=""
                        className="t-label text-accent"
                      >
                        {ACTIVITY_PAGE.view}
                      </Link>
                      <BellMarkDone id={item.id} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href={ACTIVITY_HREF}
            data-activity-bell-view-all=""
            className="block px-[var(--space-4)] py-[var(--space-3)] t-body-sm text-accent"
          >
            {ACTIVITY_PAGE.viewAll}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function ActivityBellTrigger({
  count,
  open = false,
  ...props
}: {
  count: number;
  open?: boolean;
} & React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-activity-bell=""
      data-activity-bell-open={open ? "" : undefined}
      aria-label={ACTIVITY_PAGE.bellLabel}
      className={cn(
        ACTIVITY_BELL_TRIGGER_CLASS,
        open && ACTIVITY_BELL_TRIGGER_OPEN_CLASS,
      )}
      {...props}
    >
      <Bell className={PHOSPHOR_CHROME_ICON_CLASS} weight={PHOSPHOR_CHROME_IDLE_WEIGHT} />
      {count > 0 ? (
        <span
          data-activity-bell-badge=""
          className="absolute right-0 top-0 min-w-4 rounded-full bg-accent px-1 text-center t-label text-[var(--accent-contrast)]"
        >
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </button>
  );
}

function BellMarkDone({ id }: { id: string }) {
  return <BellMarkRead ids={[id]} label={ACTIVITY_PAGE.done} dataAttr="data-activity-bell-done" />;
}

function BellMarkAllDone({ ids }: { ids: string[] }) {
  return (
    <BellMarkRead
      ids={ids}
      label={ACTIVITY_PAGE.markAllDone}
      dataAttr="data-activity-bell-mark-all"
    />
  );
}

function BellMarkRead({
  ids,
  label,
  dataAttr,
}: {
  ids: string[];
  label: string;
  dataAttr: "data-activity-bell-done" | "data-activity-bell-mark-all";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      {...{ [dataAttr]: "" }}
      disabled={pending}
      onClick={() =>
        start(async () => {
          await markNotificationsRead(ids);
          router.refresh();
        })
      }
      className="shrink-0 t-label text-ink-3 underline-offset-2 hover:text-ink-2 hover:underline disabled:opacity-50"
    >
      {label}
    </button>
  );
}
