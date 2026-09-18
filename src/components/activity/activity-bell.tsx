"use client";

import { Suspense, use, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "@phosphor-icons/react";

import { markNotificationsRead } from "@/app/(app)/messages/actions";
import { ACTIVITY_HREF, ACTIVITY_PAGE, type ActivityItem } from "@/lib/activity";
import { HOUSE_THEME_TOGGLE_CLASS } from "@/lib/house-lead-chrome";
import { NOTIFICATION_EMAIL, NOTIFICATION_KIND_LABEL } from "@/lib/notifications";
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
}: {
  unread?: Promise<number> | number;
  items?: Promise<ActivityItem[]> | ActivityItem[];
  defaultOpen?: boolean;
}) {
  if (isPromise(unread) || isPromise(items)) {
    return (
      <Suspense fallback={<ActivityBellTrigger count={0} />}>
        <ActivityBellLive
          unread={isPromise(unread) ? unread : Promise.resolve(unread)}
          items={isPromise(items) ? items : Promise.resolve(items)}
          defaultOpen={defaultOpen}
        />
      </Suspense>
    );
  }
  return <ActivityBellChrome count={unread} items={items} defaultOpen={defaultOpen} />;
}

function ActivityBellLive({
  unread,
  items,
  defaultOpen,
}: {
  unread: Promise<number>;
  items: Promise<ActivityItem[]>;
  defaultOpen: boolean;
}) {
  const count = use(unread);
  const openItems = use(items);
  return <ActivityBellChrome count={count} items={openItems} defaultOpen={defaultOpen} />;
}

function ActivityBellChrome({
  count,
  items,
  defaultOpen,
}: {
  count: number;
  items: ActivityItem[];
  defaultOpen: boolean;
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
        aria-expanded={open}
        onClick={() => setOpen((next) => !next)}
      />
      {open ? (
        <div
          data-activity-bell-popover=""
          className={cn(REPORTS_USER_PANEL_CLASS, "right-0 min-w-[18rem]")}
        >
          {items.length === 0 ? (
            <p className="px-[var(--space-4)] py-[var(--space-4)] t-body-sm text-ink-3">
              {ACTIVITY_PAGE.bellEmpty}
            </p>
          ) : (
            <ul className="flex flex-col">
              {items.map((item) => {
                const refs = (item.source_refs ?? {}) as { title_id?: string };
                const href = NOTIFICATION_EMAIL[item.kind].path({ titleId: refs.title_id });
                return (
                  <li
                    key={item.id}
                    data-activity-bell-item={item.id}
                    className="flex items-start justify-between gap-[var(--space-3)] border-b border-hairline px-[var(--space-4)] py-[var(--space-3)]"
                  >
                    <Link href={href} className="min-w-0 flex-1">
                      <p className="t-body-sm font-medium text-ink">{item.title}</p>
                      <p className="t-label text-ink-3">{NOTIFICATION_KIND_LABEL[item.kind]}</p>
                    </Link>
                    <BellMarkDone id={item.id} />
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
  ...props
}: {
  count: number;
} & React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-activity-bell=""
      aria-label={ACTIVITY_PAGE.bellLabel}
      className={cn(HOUSE_THEME_TOGGLE_CLASS, "relative")}
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
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      data-activity-bell-done=""
      disabled={pending}
      onClick={() =>
        start(async () => {
          await markNotificationsRead([id]);
          router.refresh();
        })
      }
      className="shrink-0 t-label text-ink-3 underline-offset-2 hover:text-ink-2 hover:underline disabled:opacity-50"
    >
      {ACTIVITY_PAGE.done}
    </button>
  );
}
