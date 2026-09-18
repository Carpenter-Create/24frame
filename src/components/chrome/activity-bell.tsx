"use client";

import { Suspense, use, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "@phosphor-icons/react";

import { markActivityDone } from "@/app/(app)/activity/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ACTIVITY,
  ACTIVITY_HREF,
  EMPTY_ACTIVITY_BELL,
  type ActivityBellPreview,
  type ActivityItem,
} from "@/lib/activity";
import { HOUSE_THEME_TOGGLE_CLASS } from "@/lib/house-lead-chrome";
import { PHOSPHOR_CHROME_ICON_CLASS, PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";

function asPromise<T>(value: T | Promise<T>): Promise<T> {
  return typeof value === "object" && value !== null && "then" in value
    ? (value as Promise<T>)
    : Promise.resolve(value);
}

export function ActivityBell({
  preview,
  openCount,
}: {
  preview?: Promise<ActivityBellPreview> | ActivityBellPreview;
  openCount?: Promise<number> | number;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-activity-bell=""
          aria-label={ACTIVITY.bellLabel}
          className={`relative ${HOUSE_THEME_TOGGLE_CLASS}`}
        >
          <Bell
            className={PHOSPHOR_CHROME_ICON_CLASS}
            weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
            aria-hidden="true"
          />
          <Suspense fallback={null}>
            <ActivityBellBadge
              count={asPromise(openCount ?? previewOpenCount(preview))}
            />
          </Suspense>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" data-activity-bell-menu="" className="min-w-[20rem]">
        <DropdownMenuLabel>{ACTIVITY.title}</DropdownMenuLabel>
        <Suspense
          fallback={
            <p className="px-2.5 py-1.5 t-body-sm text-ink-3">{ACTIVITY.emptyOpen}</p>
          }
        >
          <ActivityBellItems preview={asPromise(preview ?? EMPTY_ACTIVITY_BELL)} />
        </Suspense>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={ACTIVITY_HREF} data-activity-bell-view-all="">
            {ACTIVITY.viewAll}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function previewOpenCount(
  preview?: Promise<ActivityBellPreview> | ActivityBellPreview,
): Promise<number> | number {
  if (!preview) return 0;
  if (typeof preview === "object" && "then" in preview) {
    return preview.then((data) => data.openCount);
  }
  return preview.openCount;
}

function ActivityBellBadge({ count }: { count: Promise<number> }) {
  const open = use(count);
  if (open <= 0) return null;
  return (
    <span
      data-activity-bell-badge=""
      className="absolute right-1 top-1 min-w-4 rounded-full bg-accent px-1 text-center t-label text-[var(--accent-contrast)] md:right-0 md:top-0"
    >
      {open > 9 ? "9+" : open}
    </span>
  );
}

function ActivityBellItems({ preview }: { preview: Promise<ActivityBellPreview> }) {
  const data = use(preview);
  if (data.items.length === 0) {
    return <p className="px-2.5 py-1.5 t-body-sm text-ink-3">{ACTIVITY.emptyOpen}</p>;
  }
  return (
    <div data-activity-bell-items="">
      {data.items.map((item) => (
        <ActivityBellRow key={item.id} item={item} />
      ))}
    </div>
  );
}

function ActivityBellRow({ item }: { item: ActivityItem }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div data-activity-bell-row="" className="flex flex-col gap-1 px-2.5 py-1.5">
      <Link href={item.href} className="t-body-sm font-medium text-ink hover:text-ink-2">
        {item.title}
      </Link>
      <div className="flex items-center justify-between gap-2">
        <span className="t-label text-ink-3">{item.kindLabel}</span>
        <button
          type="button"
          data-activity-bell-mark-done=""
          disabled={pending}
          onClick={() =>
            start(async () => {
              await markActivityDone([item.id]);
              router.refresh();
            })
          }
          className="t-label text-ink-3 underline-offset-2 hover:text-ink-2 hover:underline disabled:opacity-50"
        >
          {ACTIVITY.markDone}
        </button>
      </div>
    </div>
  );
}
