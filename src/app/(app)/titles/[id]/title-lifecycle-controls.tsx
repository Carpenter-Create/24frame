"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Dialog } from "@/components/ui/dialog";
import { InlineNotice } from "@/components/ui/inline-notice";
import { cn } from "@/lib/cn";
import {
  MENU_SURFACE_ITEM_CLASS,
  MENU_SURFACE_ITEM_DANGER_CLASS,
} from "@/lib/menu-surface";
import {
  TITLE_LIFECYCLE,
  titleArchiveConfirmBody,
  titleDeleteConfirmBody,
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

  if (!flags.canDelete && !flags.canArchive && !flags.canRestore) return null;

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
    <div className="flex flex-col gap-[var(--space-2)]" data-title-lifecycle="">
      <div className="flex flex-wrap gap-[var(--space-3)]">
        {flags.canDelete ? (
          <button
            type="button"
            data-title-lifecycle-delete=""
            className="t-body-sm text-ink-2 hover:text-ink"
            onClick={() => {
              setError("");
              setOpen("delete");
            }}
          >
            {TITLE_LIFECYCLE.deleteLabel}
          </button>
        ) : null}
        {flags.canArchive ? (
          <button
            type="button"
            data-title-lifecycle-archive=""
            className="t-body-sm text-ink-2 hover:text-ink"
            onClick={() => {
              setError("");
              setOpen("archive");
            }}
          >
            {TITLE_LIFECYCLE.archiveLabel}
          </button>
        ) : null}
        {flags.canRestore ? (
          <button
            type="button"
            data-title-lifecycle-restore=""
            className="t-body-sm text-ink-2 hover:text-ink"
            onClick={() => {
              setError("");
              setOpen("restore");
            }}
          >
            {TITLE_LIFECYCLE.restoreLabel}
          </button>
        ) : null}
      </div>
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}

      {flags.canDelete ? (
      <Dialog
        open={open === "delete"}
        onClose={() => setOpen(null)}
        title={TITLE_LIFECYCLE.deleteTitle}
      >
        <p className="t-body-sm text-ink-2">{titleDeleteConfirmBody({ isStaff, status })}</p>
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
