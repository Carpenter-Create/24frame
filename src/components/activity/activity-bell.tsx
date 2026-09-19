"use client";

import { Suspense, use, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, FilmSlate, PaperPlaneTilt, X } from "@phosphor-icons/react";

import { markNotificationsRead } from "@/app/(app)/aggregation/messages/actions";
import { AppSheetHairline, Close44 } from "@/components/chrome/house";
import { MenuSurfaceAccent } from "@/components/chrome/menu-surface";
import {
  ACCOUNT_SHEET_HEAD_CLASS,
  ACCOUNT_SHEET_HOST_CLASS,
  ACCOUNT_SHEET_SCROLL_CLASS,
  ACCOUNT_SHEET_STAGE_CLASS,
  ACCOUNT_SHEET_SURFACE_CLASS,
} from "@/lib/account-sheet";
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
import { HOUSE_HEADER_TRAILING_PHONE_SLOT_CLASS } from "@/lib/house-lead-chrome";
import {
  HOUSE_HEADER_TRAILING_DESKTOP_CLASS,
  HOUSE_HEADER_TRAILING_PHONE_CLASS,
  HOUSE_PHONE_CHROME_ICON_WEIGHT,
} from "@/lib/house-phone-shell";
import { APP_SHEET_SCRIM_CLASS } from "@/lib/house-sheet";
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
      <Suspense fallback={<ActivityBellTriggers count={0} />}>
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
  return (
    <>
      <ActivityBellPhone count={count} items={items} defaultOpen={defaultOpen} now={now} />
      <ActivityBellDesktop count={count} items={items} defaultOpen={defaultOpen} now={now} />
    </>
  );
}

function ActivityBellTriggers({
  count,
  phoneOpen = false,
  desktopOpen = false,
  onPhoneClick,
  onDesktopClick,
}: {
  count: number;
  phoneOpen?: boolean;
  desktopOpen?: boolean;
  onPhoneClick?: () => void;
  onDesktopClick?: () => void;
}) {
  return (
    <>
      <div data-activity-bell-phone="" className={HOUSE_HEADER_TRAILING_PHONE_SLOT_CLASS}>
        <ActivityBellTrigger
          count={count}
          open={phoneOpen}
          register="phone"
          aria-expanded={phoneOpen}
          aria-controls="activity-bell-sheet"
          onClick={onPhoneClick}
        />
      </div>
      <div data-activity-bell-desktop="" className="relative hidden md:block">
        <ActivityBellTrigger
          count={count}
          open={desktopOpen}
          register="desktop"
          aria-expanded={desktopOpen}
          aria-controls="activity-bell-popover"
          onClick={onDesktopClick}
        />
      </div>
    </>
  );
}

function useActivityBellSheetDismiss(onClose: () => void) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);
}

function ActivityBellPhone({
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
  const close = useCallback(() => setOpen(false), []);

  const sheet = open ? <ActivityBellSheet items={items} now={now} onClose={close} /> : null;

  return (
    <div data-activity-bell-phone="" className={HOUSE_HEADER_TRAILING_PHONE_SLOT_CLASS}>
      <ActivityBellTrigger
        count={count}
        open={open}
        register="phone"
        aria-expanded={open}
        aria-controls="activity-bell-sheet"
        onClick={() => setOpen((next) => !next)}
      />
      {sheet && typeof document !== "undefined" ? createPortal(sheet, document.body) : sheet}
    </div>
  );
}

function ActivityBellDesktop({
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
    <div ref={rootRef} data-activity-bell-desktop="" className="relative hidden md:block">
      <ActivityBellTrigger
        count={count}
        open={open}
        register="desktop"
        aria-expanded={open}
        aria-controls="activity-bell-popover"
        onClick={() => setOpen((next) => !next)}
      />
      {open ? (
        <div
          id="activity-bell-popover"
          data-activity-bell-popover=""
          className={cn(REPORTS_USER_PANEL_CLASS, "right-0 min-w-[20rem]")}
        >
          <div
            data-activity-bell-header=""
            className="border-b border-hairline px-[var(--space-4)] py-[var(--space-3)]"
          >
            <p data-activity-bell-title="" className="t-body-sm font-medium text-ink">
              {ACTIVITY_PAGE.title}
            </p>
          </div>
          <ActivityBellFeed items={items} now={now} />
        </div>
      ) : null}
    </div>
  );
}

// Phone 544:561 craft — same house sheet tokens as AccountSheet.
// Portal + scrim + rise. Do not invent a second surface language.
// List IA stays the Royalogic feed (link body, per-row X, View all).
export function ActivityBellSheet({
  items,
  now,
  onClose,
}: {
  items: ActivityItem[];
  now?: number;
  onClose: () => void;
}) {
  useActivityBellSheetDismiss(onClose);

  return (
    <div
      id="activity-bell-sheet"
      role="dialog"
      aria-modal="true"
      aria-label={ACTIVITY_PAGE.bellLabel}
      data-activity-bell-sheet=""
      className={ACCOUNT_SHEET_HOST_CLASS}
    >
      <button
        type="button"
        data-activity-bell-sheet-scrim=""
        aria-label={ACTIVITY_PAGE.close}
        onClick={onClose}
        className={APP_SHEET_SCRIM_CLASS}
      />
      <div data-activity-bell-sheet-surface="" className={ACCOUNT_SHEET_SURFACE_CLASS}>
        <MenuSurfaceAccent />
        <div data-activity-bell-sheet-stage="" className={ACCOUNT_SHEET_STAGE_CLASS}>
          <div data-activity-bell-sheet-head="" className={ACCOUNT_SHEET_HEAD_CLASS}>
            <p data-activity-bell-title="" className="t-body-sm font-medium text-ink">
              {ACTIVITY_PAGE.title}
            </p>
            <Close44
              label={ACTIVITY_PAGE.close}
              data-activity-bell-sheet-close=""
              onClick={onClose}
            />
          </div>
          <AppSheetHairline data-activity-bell-sheet-rule="" />
          <div data-activity-bell-sheet-scroll="" className={ACCOUNT_SHEET_SCROLL_CLASS}>
            <ActivityBellFeed items={items} now={now} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityBellFeed({
  items,
  now,
}: {
  items: ActivityItem[];
  now?: number;
}) {
  return (
    <>
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
                className="flex items-start gap-[var(--space-2)] border-b border-hairline px-[var(--space-4)] py-[var(--space-3)]"
              >
                <Link
                  href={href}
                  data-activity-bell-item-link=""
                  className="flex min-w-0 flex-1 items-start gap-[var(--space-3)]"
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
                </Link>
                <BellDismiss id={item.id} />
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
    </>
  );
}

function ActivityBellTrigger({
  count,
  open = false,
  register = "desktop",
  ...props
}: {
  count: number;
  open?: boolean;
  register?: "phone" | "desktop";
} & React.ComponentProps<"button">) {
  const phone = register === "phone";
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
      <Bell
        className={phone ? HOUSE_HEADER_TRAILING_PHONE_CLASS : HOUSE_HEADER_TRAILING_DESKTOP_CLASS}
        weight={phone ? HOUSE_PHONE_CHROME_ICON_WEIGHT : PHOSPHOR_CHROME_IDLE_WEIGHT}
      />
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

function BellDismiss({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      data-activity-bell-dismiss=""
      aria-label={ACTIVITY_PAGE.dismiss}
      disabled={pending}
      onClick={() =>
        start(async () => {
          await markNotificationsRead([id]);
          router.refresh();
        })
      }
      className="mt-0.5 shrink-0 text-ink-3 hover:text-ink-2 disabled:opacity-50"
    >
      <X className={PHOSPHOR_CHROME_ICON_CLASS} weight={PHOSPHOR_CHROME_IDLE_WEIGHT} />
    </button>
  );
}
