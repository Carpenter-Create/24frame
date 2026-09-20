"use client";

import { Suspense, use } from "react";
import Link from "next/link";
import { Bell } from "@phosphor-icons/react";

import {
  ACTIVITY_BELL_TRIGGER_CLASS,
  ACTIVITY_HREF,
  ACTIVITY_PAGE,
  type ActivityItem,
} from "@/lib/activity";
import { HOUSE_HEADER_TRAILING_PHONE_SLOT_CLASS } from "@/lib/house-lead-chrome";
import {
  HOUSE_HEADER_TRAILING_DESKTOP_CLASS,
  HOUSE_HEADER_TRAILING_PHONE_CLASS,
  HOUSE_PHONE_CHROME_ICON_WEIGHT,
} from "@/lib/house-phone-shell";
import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";

function isPromise<T>(value: T | Promise<T>): value is Promise<T> {
  return typeof value === "object" && value !== null && "then" in value;
}

export function ActivityBell({
  unread = 0,
}: {
  unread?: Promise<number> | number;
  items?: Promise<ActivityItem[]> | ActivityItem[];
  defaultOpen?: boolean;
  now?: number;
}) {
  if (isPromise(unread)) {
    return (
      <Suspense fallback={<ActivityBellTriggers count={0} />}>
        <ActivityBellLive unread={unread} />
      </Suspense>
    );
  }
  return <ActivityBellTriggers count={unread} />;
}

function ActivityBellLive({ unread }: { unread: Promise<number> }) {
  return <ActivityBellTriggers count={use(unread)} />;
}

function ActivityBellTriggers({ count }: { count: number }) {
  return (
    <>
      <div data-activity-bell-phone="" className={HOUSE_HEADER_TRAILING_PHONE_SLOT_CLASS}>
        <ActivityBellTrigger count={count} register="phone" />
      </div>
      <div data-activity-bell-desktop="" className="relative hidden md:block">
        <ActivityBellTrigger count={count} register="desktop" />
      </div>
    </>
  );
}

function ActivityBellTrigger({
  count,
  register = "desktop",
}: {
  count: number;
  register?: "phone" | "desktop";
}) {
  const phone = register === "phone";
  return (
    <Link
      href={ACTIVITY_HREF}
      data-activity-bell=""
      aria-label={ACTIVITY_PAGE.bellLabel}
      className={ACTIVITY_BELL_TRIGGER_CLASS}
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
    </Link>
  );
}
