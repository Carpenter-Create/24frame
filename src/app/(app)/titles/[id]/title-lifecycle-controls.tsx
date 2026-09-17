"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";

import { Dialog } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { InlineNotice } from "@/components/ui/inline-notice";
import { MenuSurfaceContent, MenuSurfaceItem } from "@/components/chrome/menu-surface";
import { cn } from "@/lib/cn";
import { HOUSE_ICON_BUTTON_CLASS } from "@/lib/house-shell";
import {
  MENU_SURFACE_ITEM_CLASS,
  MENU_SURFACE_ITEM_DANGER_CLASS,
} from "@/lib/menu-surface";
import {
  TITLE_LIFECYCLE,
  titleArchiveConfirmBody,
  titleDeleteConfirmBody,
  titleHasLifecycleActions,
  type TitleLifecycleFlags,
} from "@/lib/titles-lifecycle";
import type { TitleStatus } from "@/lib/titles";
import { archiveTitle, deleteTitle, restoreTitle } from "./actions";

export function TitleLifecycleControls({
  titleId,
  status,
  isStaff,
  flags,
}: {
  titleId: string;
  status: TitleStatus;
  isStaff: boolean;
  flags: TitleLifecycleFlags;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<"delete" | "archive" | "restore" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!titleHasLifecycleActions(flags)) return null;

  async function run(
    action: () => Promise<{ error?: string }>,
    after?: () => void,
  ) {
    setSaving(true);
    setError("");
    const res = await action();
    if (res.error) {
      setError(res.error);
      setSaving(false);
      return;
    }
    setOpen(null);
    setSaving(false);
    after?.();
    router.refresh();
  }

  return (
    <div className="relative" data-title-lifecycle="">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            data-title-lifecycle-menu=""
            aria-label={TITLE_LIFECYCLE.moreLabel}
            className={cn(
              "flex size-[44px] min-h-[44px] min-w-[44px] shrink-0 items-center justify-center text-ink hover:bg-surface-muted",
              HOUSE_ICON_BUTTON_CLASS,
            )}
          >
            <MoreHorizontal className="size-4" strokeWidth={1.33} />
          </button>
        </DropdownMenuTrigger>
        <MenuSurfaceContent align="end" data-title-lifecycle-menu-surface="">
          {flags.canDelete ? (
            <MenuSurfaceItem
              danger
              data-title-lifecycle-delete=""
              onSelect={() => {
                setError("");
                setOpen("delete");
              }}
            >
              {TITLE_LIFECYCLE.deleteLabel}
            </MenuSurfaceItem>
          ) : null}
          {flags.canArchive ? (
            <MenuSurfaceItem
              data-title-lifecycle-archive=""
              onSelect={() => {
                setError("");
                setOpen("archive");
              }}
            >
              {TITLE_LIFECYCLE.archiveLabel}
            </MenuSurfaceItem>
          ) : null}
          {flags.canRestore ? (
            <MenuSurfaceItem
              data-title-lifecycle-restore=""
              onSelect={() => {
                setError("");
                setOpen("restore");
              }}
            >
              {TITLE_LIFECYCLE.restoreLabel}
            </MenuSurfaceItem>
          ) : null}
        </MenuSurfaceContent>
      </DropdownMenu>

      {flags.canDelete ? (
      <Dialog
        open={open === "delete"}
        onClose={() => setOpen(null)}
        title={TITLE_LIFECYCLE.deleteTitle}
      >
        <p className="t-body-sm text-ink-2">{titleDeleteConfirmBody({ isStaff, status })}</p>
        {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
        <div className="mt-[var(--space-4)] flex justify-end gap-[var(--space-2)]">
          <button
            type="button"
            className={MENU_SURFACE_ITEM_CLASS}
            onClick={() => setOpen(null)}
          >
            {TITLE_LIFECYCLE.cancelLabel}
          </button>
          <button
            type="button"
            data-title-lifecycle-delete-confirm=""
            disabled={saving}
            className={cn(MENU_SURFACE_ITEM_CLASS, MENU_SURFACE_ITEM_DANGER_CLASS)}
            onClick={() =>
              void run(() => deleteTitle(titleId), () => router.push("/titles"))
            }
          >
            {TITLE_LIFECYCLE.deleteConfirm}
          </button>
        </div>
      </Dialog>
      ) : null}

      {flags.canArchive ? (
      <Dialog
        open={open === "archive"}
        onClose={() => setOpen(null)}
        title={TITLE_LIFECYCLE.archiveTitle}
      >
        <p className="t-body-sm text-ink-2">
          {titleArchiveConfirmBody(flags.offerArchiveFromDelete)}
        </p>
        {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
        <div className="mt-[var(--space-4)] flex justify-end gap-[var(--space-2)]">
          <button
            type="button"
            className={MENU_SURFACE_ITEM_CLASS}
            onClick={() => setOpen(null)}
          >
            {TITLE_LIFECYCLE.cancelLabel}
          </button>
          <button
            type="button"
            data-title-lifecycle-archive-confirm=""
            disabled={saving}
            className={MENU_SURFACE_ITEM_CLASS}
            onClick={() => void run(() => archiveTitle(titleId))}
          >
            {TITLE_LIFECYCLE.archiveConfirm}
          </button>
        </div>
      </Dialog>
      ) : null}

      {flags.canRestore ? (
      <Dialog
        open={open === "restore"}
        onClose={() => setOpen(null)}
        title={TITLE_LIFECYCLE.restoreTitle}
      >
        <p className="t-body-sm text-ink-2">{TITLE_LIFECYCLE.restoreBody}</p>
        {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
        <div className="mt-[var(--space-4)] flex justify-end gap-[var(--space-2)]">
          <button
            type="button"
            className={MENU_SURFACE_ITEM_CLASS}
            onClick={() => setOpen(null)}
          >
            {TITLE_LIFECYCLE.cancelLabel}
          </button>
          <button
            type="button"
            data-title-lifecycle-restore-confirm=""
            disabled={saving}
            className={MENU_SURFACE_ITEM_CLASS}
            onClick={() => void run(() => restoreTitle(titleId))}
          >
            {TITLE_LIFECYCLE.restoreConfirm}
          </button>
        </div>
      </Dialog>
      ) : null}
    </div>
  );
}
