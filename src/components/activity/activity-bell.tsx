"use client";

import { Suspense, use, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bell } from "@phosphor-icons/react";

import { Close44 } from "@/components/chrome/house";
import { ActivityFeedRow } from "@/components/activity/activity-feed-row";
import {
  ACTIVITY_BELL_LIST_CLASS,
  ACTIVITY_BELL_POPOVER_CLASS,
  ACTIVITY_BELL_SHEET_HOST_CLASS,
  ACTIVITY_BELL_SHEET_SURFACE_CLASS,
  ACTIVITY_BELL_TRIGGER_CLASS,
  ACTIVITY_BELL_TRIGGER_OPEN_CLASS,
  ACTIVITY_BELL_VIEW_ALL_CLASS,
  ACTIVITY_HREF,
  ACTIVITY_PAGE,
  type ActivityItem,
} from "@/lib/activity";
import { HOUSE_HEADER_TRAILING_PHONE_SLOT_CLASS } from "@/lib/house-lead-chrome";
import { APP_SHEET_HEAD_CLASS, APP_SHEET_SCRIM_CLASS } from "@/lib/house-sheet";
import {
  HOUSE_HEADER_TRAILING_DESKTOP_CLASS,
  HOUSE_HEADER_TRAILING_PHONE_CLASS,
  HOUSE_PHONE_CHROME_ICON_WEIGHT,
} from "@/lib/house-phone-shell";
import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
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
  now?: number;
}) {
  if (isPromise(unread)) {
    if (isPromise(items)) {
      return (
        <Suspense fallback={<ActivityBellTriggers count={0} items={[]} />}>
          <ActivityBellBoth unread={unread} items={items} defaultOpen={defaultOpen} />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<ActivityBellTriggers count={0} items={[]} />}>
        <ActivityBellUnread unread={unread} items={items} defaultOpen={defaultOpen} />
      </Suspense>
    );
  }
  if (isPromise(items)) {
    return (
      <Suspense fallback={<ActivityBellTriggers count={0} items={[]} />}>
        <ActivityBellItems unread={unread} items={items} defaultOpen={defaultOpen} />
      </Suspense>
    );
  }
  return <ActivityBellTriggers count={unread} items={items} defaultOpen={defaultOpen} />;
}

function ActivityBellBoth({
  unread,
  items,
  defaultOpen,
}: {
  unread: Promise<number>;
  items: Promise<ActivityItem[]>;
  defaultOpen?: boolean;
}) {
  return <ActivityBellTriggers count={use(unread)} items={use(items)} defaultOpen={defaultOpen} />;
}

function ActivityBellUnread({
  unread,
  items,
  defaultOpen,
}: {
  unread: Promise<number>;
  items: ActivityItem[];
  defaultOpen?: boolean;
}) {
  return <ActivityBellTriggers count={use(unread)} items={items} defaultOpen={defaultOpen} />;
}

function ActivityBellItems({
  unread,
  items,
  defaultOpen,
}: {
  unread: number;
  items: Promise<ActivityItem[]>;
  defaultOpen?: boolean;
}) {
  return <ActivityBellTriggers count={unread} items={use(items)} defaultOpen={defaultOpen} />;
}

function ActivityBellTriggers({
  count,
  items,
  defaultOpen = false,
}: {
  count: number;
  items: ActivityItem[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const desktopRef = useRef<HTMLDivElement>(null);
  const popoverId = `${panelId}-popover`;
  const sheetId = `${panelId}-sheet`;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: MouseEvent) => {
      const host = desktopRef.current;
      if (!host || host.contains(event.target as Node)) return;
      const sheet = document.querySelector("[data-activity-bell-sheet]");
      if (sheet?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  return (
    <>
      <div data-activity-bell-phone="" className={HOUSE_HEADER_TRAILING_PHONE_SLOT_CLASS}>
        <ActivityBellTrigger
          count={count}
          register="phone"
          open={open}
          panelId={sheetId}
          onToggle={() => setOpen((next) => !next)}
        />
      </div>
      <div
        ref={desktopRef}
        data-activity-bell-desktop=""
        className="relative hidden md:block"
      >
        <ActivityBellTrigger
          count={count}
          register="desktop"
          open={open}
          panelId={popoverId}
          onToggle={() => setOpen((next) => !next)}
        />
        {open ? (
          <ActivityBellPeek
            items={items}
            surface="popover"
            panelId={popoverId}
            onClose={() => setOpen(false)}
          />
        ) : null}
      </div>
      {open ? (
        <ActivityBellSheet items={items} panelId={sheetId} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

function ActivityBellTrigger({
  count,
  register = "desktop",
  open,
  panelId,
  onToggle,
}: {
  count: number;
  register?: "phone" | "desktop";
  open: boolean;
  panelId: string;
  onToggle: () => void;
}) {
  const phone = register === "phone";
  return (
    <button
      type="button"
      data-activity-bell=""
      data-activity-bell-open={open ? "" : undefined}
      aria-label={ACTIVITY_PAGE.bellLabel}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-controls={panelId}
      className={cn(ACTIVITY_BELL_TRIGGER_CLASS, open && ACTIVITY_BELL_TRIGGER_OPEN_CLASS)}
      onClick={onToggle}
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

function ActivityBellBody({
  items,
  onClose,
}: {
  items: ActivityItem[];
  onClose: () => void;
}) {
  return (
    <>
      {items.length === 0 ? (
        <p data-activity-bell-empty="" className="px-[var(--space-4)] py-[var(--space-4)] t-body-sm text-ink-2">
          {ACTIVITY_PAGE.bellEmpty}
        </p>
      ) : (
        <div data-activity-bell-list="" className={ACTIVITY_BELL_LIST_CLASS}>
          {items.map((item) => (
            <ActivityFeedRow key={item.id} item={item} />
          ))}
        </div>
      )}
      <Link
        href={ACTIVITY_HREF}
        data-activity-bell-view-all=""
        className={ACTIVITY_BELL_VIEW_ALL_CLASS}
        onClick={onClose}
      >
        {ACTIVITY_PAGE.viewAll}
      </Link>
    </>
  );
}

function ActivityBellPeek({
  items,
  surface,
  panelId,
  onClose,
}: {
  items: ActivityItem[];
  surface: "popover" | "sheet";
  panelId: string;
  onClose: () => void;
}) {
  return (
    <div
      id={surface === "popover" ? panelId : undefined}
      role={surface === "popover" ? "dialog" : undefined}
      aria-label={surface === "popover" ? ACTIVITY_PAGE.title : undefined}
      data-activity-bell-popover={surface === "popover" ? "" : undefined}
      className={surface === "popover" ? ACTIVITY_BELL_POPOVER_CLASS : undefined}
    >
      <ActivityBellBody items={items} onClose={onClose} />
    </div>
  );
}

function ActivityBellSheet({
  items,
  panelId,
  onClose,
}: {
  items: ActivityItem[];
  panelId: string;
  onClose: () => void;
}) {
  const sheet = (
    <div data-activity-bell-sheet="" className={ACTIVITY_BELL_SHEET_HOST_CLASS}>
      <button
        type="button"
        aria-label={ACTIVITY_PAGE.close}
        className={APP_SHEET_SCRIM_CLASS}
        onClick={onClose}
      />
      <div
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-label={ACTIVITY_PAGE.title}
        className={ACTIVITY_BELL_SHEET_SURFACE_CLASS}
      >
        <div data-activity-bell-sheet-head="" className={APP_SHEET_HEAD_CLASS}>
          <h2 className="min-w-0 flex-1 t-heading text-ink">{ACTIVITY_PAGE.title}</h2>
          <Close44 label={ACTIVITY_PAGE.close} onClick={onClose} />
        </div>
        <ActivityBellPeek items={items} surface="sheet" panelId={panelId} onClose={onClose} />
      </div>
    </div>
  );
  return typeof document !== "undefined" ? createPortal(sheet, document.body) : sheet;
}
