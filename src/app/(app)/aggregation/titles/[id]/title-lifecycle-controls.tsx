"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DotsThree } from "@phosphor-icons/react";

import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";

import { Button } from "@/components/ui/button";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { InlineNotice } from "@/components/ui/inline-notice";
import { MenuSurfaceContent, MenuSurfaceItem } from "@/components/chrome/menu-surface";
import { cn } from "@/lib/cn";
import { HOUSE_ICON_BUTTON_CLASS } from "@/lib/house-shell";
import {
  TITLE_LIFECYCLE,
  titleArchiveConfirmBody,
  titleArchiveConfirmTitle,
  titleDeleteConfirmBody,
  titleDeleteConfirmTitle,
  titleHasLifecycleActions,
  titleRestoreConfirmBody,
  titleRestoreConfirmTitle,
  type TitleLifecycleFlags,
} from "@/lib/titles-lifecycle";
import type { TitleStatus } from "@/lib/titles";
import { archiveTitle, deleteTitle, restoreTitle } from "./actions";

export function TitleLifecycleControls({
  titleId,
  titleName,
  status,
  isStaff,
  flags,
}: {
  titleId: string;
  titleName: string;
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
            <DotsThree className="size-4" weight={PHOSPHOR_CHROME_IDLE_WEIGHT} />
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
        title={titleDeleteConfirmTitle(titleName)}
        size="sm"
      >
        <p className="t-body-sm text-ink-2">{titleDeleteConfirmBody({ isStaff, status, name: titleName })}</p>
        {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(null)}>
            {TITLE_LIFECYCLE.cancelLabel}
          </Button>
          <Button
            type="button"
            variant="danger"
            data-title-lifecycle-delete-confirm=""
            disabled={saving}
            onClick={() =>
              void run(() => deleteTitle(titleId), () => router.push("/titles"))
            }
          >
            {TITLE_LIFECYCLE.deleteConfirm}
          </Button>
        </DialogFooter>
      </Dialog>
      ) : null}

      {flags.canArchive ? (
      <Dialog
        open={open === "archive"}
        onClose={() => setOpen(null)}
        title={titleArchiveConfirmTitle(titleName)}
        size="sm"
      >
        <p className="t-body-sm text-ink-2">
          {titleArchiveConfirmBody(flags.offerArchiveFromDelete, titleName)}
        </p>
        {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(null)}>
            {TITLE_LIFECYCLE.cancelLabel}
          </Button>
          <Button
            type="button"
            variant="danger"
            data-title-lifecycle-archive-confirm=""
            disabled={saving}
            onClick={() => void run(() => archiveTitle(titleId))}
          >
            {TITLE_LIFECYCLE.archiveConfirm}
          </Button>
        </DialogFooter>
      </Dialog>
      ) : null}

      {flags.canRestore ? (
      <Dialog
        open={open === "restore"}
        onClose={() => setOpen(null)}
        title={titleRestoreConfirmTitle(titleName)}
        size="sm"
      >
        <p className="t-body-sm text-ink-2">{titleRestoreConfirmBody(titleName)}</p>
        {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(null)}>
            {TITLE_LIFECYCLE.cancelLabel}
          </Button>
          <Button
            type="button"
            variant="danger"
            data-title-lifecycle-restore-confirm=""
            disabled={saving}
            onClick={() => void run(() => restoreTitle(titleId))}
          >
            {TITLE_LIFECYCLE.restoreConfirm}
          </Button>
        </DialogFooter>
      </Dialog>
      ) : null}
    </div>
  );
}
