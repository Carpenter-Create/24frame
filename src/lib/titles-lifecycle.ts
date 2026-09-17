import type { TitleStatus } from "@/lib/titles";

// Titles delete + archive. Copy and UI gates live here, not in JSX.
// Write authority is the SECURITY DEFINER RPCs. This module only decides
// which control to offer. Confirm copy stays one line — no scare-copy.

export const TITLE_LIFECYCLE = {
  moreLabel: "Title actions",
  deleteLabel: "Delete",
  deleteTitle: "Delete title",
  deleteDraftBody: "This removes the draft and its files from the catalog.",
  deleteStaffBody: "This removes the title and its files from the catalog.",
  deleteConfirm: "Delete",
  archiveLabel: "Archive",
  archiveTitle: "Archive title",
  archiveBody: "This leaves the active catalog. Assets, rights, and reporting stay on record.",
  archiveFromDeleteBody:
    "This title has reporting history and cannot be deleted. Archive it to remove it from the active catalog.",
  archiveConfirm: "Archive",
  restoreLabel: "Restore",
  restoreTitle: "Restore title",
  restoreBody: "This returns the title to the active catalog.",
  restoreConfirm: "Restore",
  cancelLabel: "Cancel",
  afterSubmit: "Submitted titles cannot be deleted. Archive instead.",
  reportingHistory: "This title has reporting history. Archive it instead.",
  purgeFailed:
    "The title left the catalog. Stored files could not be removed; the system will retry.",
} as const;

export type TitleLifecycleActor = {
  isStaff: boolean;
  canOperate: boolean;
};

export type TitleLifecycleFlags = {
  canDelete: boolean;
  canArchive: boolean;
  canRestore: boolean;
  offerArchiveFromDelete: boolean;
};

const DRAFT: TitleStatus = "draft";
const ARCHIVED: TitleStatus = "archived";

export function isArchivedTitleStatus(status: string): boolean {
  return status === ARCHIVED;
}

export function isDraftTitleStatus(status: string): boolean {
  return status === DRAFT;
}

export function titleLifecycleFlags(
  actor: TitleLifecycleActor,
  status: TitleStatus | string,
  hasReportingActivity: boolean,
): TitleLifecycleFlags {
  const archived = isArchivedTitleStatus(status);
  const draft = isDraftTitleStatus(status);
  const operate = actor.canOperate || actor.isStaff;

  if (archived) {
    return {
      canDelete: false,
      canArchive: false,
      canRestore: operate,
      offerArchiveFromDelete: false,
    };
  }

  if (draft) {
    return {
      canDelete: operate,
      canArchive: false,
      canRestore: false,
      offerArchiveFromDelete: false,
    };
  }

  // Submitted / Complete / Live (and later lifecycle). Owner never deletes
  // after submit. Staff may delete only when the hard money/reporting
  // predicate is empty; otherwise Archive is the offered path.
  if (actor.isStaff) {
    const blocked = hasReportingActivity;
    return {
      canDelete: !blocked,
      canArchive: true,
      canRestore: false,
      offerArchiveFromDelete: blocked,
    };
  }

  return {
    canDelete: false,
    canArchive: operate,
    canRestore: false,
    offerArchiveFromDelete: operate,
  };
}

export function quoteTitleName(name: string): string {
  return `“${name.trim()}”`;
}

export function titleDeleteConfirmTitle(name: string): string {
  return `${TITLE_LIFECYCLE.deleteLabel} ${quoteTitleName(name)}`;
}

export function titleArchiveConfirmTitle(name: string): string {
  return `${TITLE_LIFECYCLE.archiveLabel} ${quoteTitleName(name)}`;
}

export function titleRestoreConfirmTitle(name: string): string {
  return `${TITLE_LIFECYCLE.restoreLabel} ${quoteTitleName(name)}`;
}

export function titleDeleteConfirmBody(input: {
  isStaff: boolean;
  status: TitleStatus | string;
  name: string;
}): string {
  const quoted = quoteTitleName(input.name);
  return input.isStaff && !isDraftTitleStatus(input.status)
    ? `This removes ${quoted} and its files from the catalog.`
    : `This removes the draft ${quoted} and its files from the catalog.`;
}

export function titleArchiveConfirmBody(offerFromDelete: boolean, name: string): string {
  const quoted = quoteTitleName(name);
  return offerFromDelete
    ? `${quoted} has reporting history and cannot be deleted. Archive it to remove it from the active catalog.`
    : `${quoted} leaves the active catalog. Assets, rights, and reporting stay on record.`;
}

export function titleRestoreConfirmBody(name: string): string {
  return `This returns ${quoteTitleName(name)} to the active catalog.`;
}

export function titleHasLifecycleActions(flags: TitleLifecycleFlags): boolean {
  return flags.canDelete || flags.canArchive || flags.canRestore;
}

// List rows cannot run per-title reporting RPCs. Treat post-submit titles as
// blocked so Delete is not offered without the hard predicate. Detail runs
// title_has_reporting_activity before offering staff Delete.
export function titleListHasReportingActivity(status: TitleStatus | string): boolean {
  return !isDraftTitleStatus(status) && !isArchivedTitleStatus(status);
}

export function excludeArchivedTitles<T extends { status: string }>(rows: T[]): T[] {
  return rows.filter((row) => !isArchivedTitleStatus(row.status));
}
