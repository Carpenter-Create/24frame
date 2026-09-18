"use client";

import { Suspense, use, useState, useTransition, type MouseEvent, type PointerEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Checks, FilmSlate, PaperPlaneTilt, X } from "@phosphor-icons/react";

import { markActivityDone } from "@/app/(app)/activity/actions";
import {
  MenuSurfaceContent,
  MenuSurfaceSeparator,
} from "@/components/chrome/menu-surface";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  ACTIVITY,
  ACTIVITY_BELL_DISMISS_CLASS,
  ACTIVITY_BELL_DOT_CLASS,
  ACTIVITY_BELL_PLATE_CLASS,
  ACTIVITY_BELL_FOOTER_CLASS,
  ACTIVITY_BELL_HEAD_CLASS,
  ACTIVITY_BELL_MENU_CLASS,
  ACTIVITY_BELL_ROW_CLASS,
  ACTIVITY_BELL_TARGET_CLASS,
  ACTIVITY_HREF,
  EMPTY_ACTIVITY_BELL,
  activityBellVisibleItems,
  activityBellVisibleOpenCount,
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

function keepBellOpen(event: PointerEvent<HTMLButtonElement> | MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
  event.stopPropagation();
}

export function ActivityBell({
  preview,
  openCount,
}: {
  preview?: Promise<ActivityBellPreview> | ActivityBellPreview;
  openCount?: Promise<number> | number;
}) {
  const [open, setOpen] = useState(false);
  const [doneIds, setDoneIds] = useState<ReadonlySet<string>>(() => new Set());
  const previewPromise = asPromise(preview ?? EMPTY_ACTIVITY_BELL);

  function rememberDone(ids: readonly string[]) {
    setDoneIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
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
              preview={previewPromise}
              openCount={openCount}
              doneIds={doneIds}
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
          <ActivityBellBody
            preview={previewPromise}
            doneIds={doneIds}
            onDone={rememberDone}
          />
        </Suspense>
      </MenuSurfaceContent>
    </DropdownMenu>
  );
}

function ActivityBellBadge({
  preview,
  openCount,
  doneIds,
}: {
  preview: Promise<ActivityBellPreview>;
  openCount?: Promise<number> | number;
  doneIds: ReadonlySet<string>;
}) {
  const data = use(preview);
  const count = use(asPromise(openCount ?? data.openCount));
  const open = activityBellVisibleOpenCount(count, data.items, doneIds);
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

function ActivityBellBody({
  preview,
  doneIds,
  onDone,
}: {
  preview: Promise<ActivityBellPreview>;
  doneIds: ReadonlySet<string>;
  onDone: (ids: readonly string[]) => void;
}) {
  const data = use(preview);
  const items = activityBellVisibleItems(data.items, doneIds);
  const ids = items.map((item) => item.id);

  return (
    <>
      <div data-activity-bell-head="" className={ACTIVITY_BELL_HEAD_CLASS}>
        <p className="t-heading text-ink">{ACTIVITY.title}</p>
        {ids.length > 0 ? <MarkAllDone ids={ids} onDone={onDone} /> : null}
      </div>
      {items.length === 0 ? (
        <p className="px-[var(--space-3)] py-[var(--space-2)] t-body-sm text-ink-3">
          {ACTIVITY.emptyOpen}
        </p>
      ) : (
        <div data-activity-bell-items="">
          {items.map((item) => (
            <ActivityBellRow key={item.id} item={item} onDone={onDone} />
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

function ActivityBellRow({
  item,
  onDone,
}: {
  item: ActivityItem;
  onDone: (ids: readonly string[]) => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const Glyph = KIND_GLYPH[activityKindGlyph(item.kind)];

  return (
    <div data-activity-bell-row="" className={ACTIVITY_BELL_ROW_CLASS}>
      <Link href={item.href} data-activity-bell-target="" className={ACTIVITY_BELL_TARGET_CLASS}>
        <span data-activity-bell-plate="" className={ACTIVITY_BELL_PLATE_CLASS}>
          <Glyph
            data-activity-bell-kind={item.kind}
            className={`${HOUSE_HEADER_CHROME_ICON_CLASS} text-ink-3`}
            weight={HOUSE_HEADER_CHROME_ICON_WEIGHT}
            aria-hidden="true"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-[var(--space-2)]">
            <span className="min-w-0 t-body-sm text-ink">{item.title}</span>
            <span className="flex shrink-0 items-center gap-[var(--space-2)]">
              <time className="t-label text-ink-3" dateTime={item.at} data-activity-bell-time="">
                {formatActivityRelativeTime(item.at)}
              </time>
              <span data-activity-bell-dot="" className={ACTIVITY_BELL_DOT_CLASS} aria-hidden />
            </span>
          </span>
          <span className="t-body-sm text-ink-3">{item.body}</span>
        </span>
      </Link>
      <button
        type="button"
        data-activity-bell-mark-done=""
        disabled={pending}
        aria-label={ACTIVITY.markDone}
        onPointerDown={keepBellOpen}
        onClick={(event) => {
          keepBellOpen(event);
          start(async () => {
            onDone([item.id]);
            await markActivityDone([item.id]);
            router.refresh();
          });
        }}
        className={ACTIVITY_BELL_DISMISS_CLASS}
      >
        <X
          className={HOUSE_HEADER_CHROME_ICON_CLASS}
          weight={HOUSE_HEADER_CHROME_ICON_WEIGHT}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

function MarkAllDone({
  ids,
  onDone,
}: {
  ids: string[];
  onDone: (ids: readonly string[]) => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      data-activity-bell-mark-all-done=""
      disabled={pending}
      onPointerDown={keepBellOpen}
      onClick={(event) => {
        keepBellOpen(event);
        start(async () => {
          onDone(ids);
          await markActivityDone(ids);
          router.refresh();
        });
      }}
      aria-label={ACTIVITY.markAllDone}
      className={ACTIVITY_BELL_DISMISS_CLASS}
    >
      <Checks
        className={HOUSE_HEADER_CHROME_ICON_CLASS}
        weight={HOUSE_HEADER_CHROME_ICON_WEIGHT}
        aria-hidden="true"
      />
    </button>
  );
}
