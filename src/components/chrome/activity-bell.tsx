"use client";

import { Suspense, use, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Checks, FilmSlate, PaperPlaneTilt } from "@phosphor-icons/react";

import { markActivityDone } from "@/app/(app)/activity/actions";
import {
  MenuSurfaceContent,
  MenuSurfaceSeparator,
} from "@/components/chrome/menu-surface";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  ACTIVITY,
  ACTIVITY_BELL_DOT_CLASS,
  ACTIVITY_BELL_PLATE_CLASS,
  ACTIVITY_BELL_FOOTER_CLASS,
  ACTIVITY_BELL_HEAD_CLASS,
  ACTIVITY_BELL_MENU_CLASS,
  ACTIVITY_BELL_ROW_CLASS,
  ACTIVITY_HREF,
  EMPTY_ACTIVITY_BELL,
  activityKindGlyph,
  formatActivityRelativeTime,
  type ActivityBellPreview,
  type ActivityItem,
} from "@/lib/activity";
import {
  HOUSE_HEADER_CHROME_ICON_CLASS,
  HOUSE_HEADER_CHROME_ICON_WEIGHT,
  HOUSE_HEADER_ICON_GHOST_CLASS,
} from "@/lib/house-lead-chrome";
import { TEXT_ACTION_CLASS } from "@/lib/house-sheet";
import { type PhosphorIcon } from "@/lib/phosphor-icon";

const KIND_GLYPH: Record<ReturnType<typeof activityKindGlyph>, PhosphorIcon> = {
  "film-slate": FilmSlate,
  "paper-plane": PaperPlaneTilt,
};

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
          className={`relative ${HOUSE_HEADER_ICON_GHOST_CLASS}`}
        >
          <Bell
            className={HOUSE_HEADER_CHROME_ICON_CLASS}
            weight={HOUSE_HEADER_CHROME_ICON_WEIGHT}
            aria-hidden="true"
          />
          <Suspense fallback={null}>
            <ActivityBellBadge
              count={asPromise(openCount ?? previewOpenCount(preview))}
            />
          </Suspense>
        </button>
      </DropdownMenuTrigger>
      <MenuSurfaceContent
        align="end"
        density="panel"
        data-activity-bell-menu=""
        className={ACTIVITY_BELL_MENU_CLASS}
      >
        <Suspense
          fallback={
            <p className="px-[var(--space-3)] py-[var(--space-2)] t-body-sm text-ink-3">
              {ACTIVITY.emptyOpen}
            </p>
          }
        >
          <ActivityBellBody preview={asPromise(preview ?? EMPTY_ACTIVITY_BELL)} />
        </Suspense>
      </MenuSurfaceContent>
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

function ActivityBellBody({ preview }: { preview: Promise<ActivityBellPreview> }) {
  const data = use(preview);
  const ids = data.items.map((item) => item.id);

  return (
    <>
      <div data-activity-bell-head="" className={ACTIVITY_BELL_HEAD_CLASS}>
        <p className="t-heading text-ink">{ACTIVITY.title}</p>
        {ids.length > 0 ? <MarkAllDone ids={ids} /> : null}
      </div>
      {data.items.length === 0 ? (
        <p className="px-[var(--space-3)] py-[var(--space-2)] t-body-sm text-ink-3">
          {ACTIVITY.emptyOpen}
        </p>
      ) : (
        <div data-activity-bell-items="">
          {data.items.map((item) => (
            <ActivityBellRow key={item.id} item={item} />
          ))}
        </div>
      )}
      <MenuSurfaceSeparator />
      <div className={ACTIVITY_BELL_FOOTER_CLASS}>
        <Link
          href={ACTIVITY_HREF}
          data-activity-bell-view-all=""
          className={TEXT_ACTION_CLASS}
        >
          {ACTIVITY.viewAll}
        </Link>
      </div>
    </>
  );
}

function ActivityBellRow({ item }: { item: ActivityItem }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const Glyph = KIND_GLYPH[activityKindGlyph(item.kind)];

  return (
    <div data-activity-bell-row="" className={ACTIVITY_BELL_ROW_CLASS}>
      <span data-activity-bell-plate="" className={ACTIVITY_BELL_PLATE_CLASS}>
        <Glyph
          data-activity-bell-kind={item.kind}
          className={`${HOUSE_HEADER_CHROME_ICON_CLASS} text-ink-3`}
          weight={HOUSE_HEADER_CHROME_ICON_WEIGHT}
          aria-hidden="true"
        />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-[var(--space-2)]">
          <p className="min-w-0 t-body-sm text-ink">{item.title}</p>
          <span className="flex shrink-0 items-center gap-[var(--space-2)]">
            <time className="t-label text-ink-3" dateTime={item.at} data-activity-bell-time="">
              {formatActivityRelativeTime(item.at)}
            </time>
            <span data-activity-bell-dot="" className={ACTIVITY_BELL_DOT_CLASS} aria-hidden />
          </span>
        </div>
        <p className="t-body-sm text-ink-3">{item.body}</p>
        <div className="flex items-center gap-[var(--space-4)] pt-[var(--space-1)]">
          <Link href={item.href} data-activity-bell-view="" className={TEXT_ACTION_CLASS}>
            {ACTIVITY.view}
          </Link>
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
            {ACTIVITY.done}
          </button>
        </div>
      </div>
    </div>
  );
}

function MarkAllDone({ ids }: { ids: string[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      data-activity-bell-mark-all-done=""
      disabled={pending}
      onClick={() =>
        start(async () => {
          await markActivityDone(ids);
          router.refresh();
        })
      }
      aria-label={ACTIVITY.markAllDone}
      className="flex size-8 items-center justify-center rounded-full text-ink-3 hover:bg-surface-muted hover:text-ink-2 disabled:opacity-50"
    >
      <Checks
        className={HOUSE_HEADER_CHROME_ICON_CLASS}
        weight={HOUSE_HEADER_CHROME_ICON_WEIGHT}
        aria-hidden="true"
      />
    </button>
  );
}
