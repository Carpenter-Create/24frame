import { describe, expect, it } from "vitest";

import { TITLE_STATUS_LABELS, titleDisplayStatus } from "@/lib/titles";
import {
  TITLE_LIFECYCLE,
  excludeArchivedTitles,
  isArchivedTitleStatus,
  titleArchiveConfirmBody,
  titleDeleteConfirmBody,
  titleLifecycleFlags,
} from "@/lib/titles-lifecycle";

describe("title lifecycle gates", () => {
  it("lets an owner delete a draft and never a submitted title", () => {
    const owner = { isStaff: false, canOperate: true };
    expect(titleLifecycleFlags(owner, "draft", false)).toEqual({
      canDelete: true,
      canArchive: false,
      canRestore: false,
      offerArchiveFromDelete: false,
    });
    expect(titleLifecycleFlags(owner, "in_review", false)).toEqual({
      canDelete: false,
      canArchive: true,
      canRestore: false,
      offerArchiveFromDelete: true,
    });
    expect(titleLifecycleFlags(owner, "live", true)).toEqual({
      canDelete: false,
      canArchive: true,
      canRestore: false,
      offerArchiveFromDelete: true,
    });
  });

  it("lets staff delete drafts and Live only when reporting facts are empty", () => {
    const staff = { isStaff: true, canOperate: true };
    expect(titleLifecycleFlags(staff, "draft", false).canDelete).toBe(true);
    expect(titleLifecycleFlags(staff, "live", false)).toEqual({
      canDelete: true,
      canArchive: true,
      canRestore: false,
      offerArchiveFromDelete: false,
    });
    expect(titleLifecycleFlags(staff, "live", true)).toEqual({
      canDelete: false,
      canArchive: true,
      canRestore: false,
      offerArchiveFromDelete: true,
    });
    expect(titleLifecycleFlags(staff, "submitted", true).canDelete).toBe(false);
  });

  it("restores archived titles and does not offer delete", () => {
    const owner = { isStaff: false, canOperate: true };
    expect(titleLifecycleFlags(owner, "archived", true)).toEqual({
      canDelete: false,
      canArchive: false,
      canRestore: true,
      offerArchiveFromDelete: false,
    });
    expect(isArchivedTitleStatus("archived")).toBe(true);
    expect(isArchivedTitleStatus("live")).toBe(false);
  });

  it("hides controls from a read-only member", () => {
    const viewer = { isStaff: false, canOperate: false };
    expect(titleLifecycleFlags(viewer, "draft", false).canDelete).toBe(false);
    expect(titleLifecycleFlags(viewer, "live", false).canArchive).toBe(false);
    expect(titleLifecycleFlags(viewer, "archived", false).canRestore).toBe(false);
  });
});

describe("title lifecycle copy", () => {
  it("keeps confirm copy to one professional line", () => {
    expect(TITLE_LIFECYCLE.deleteDraftBody).toBe(
      "This removes the draft and its files from the catalog.",
    );
    expect(TITLE_LIFECYCLE.archiveBody).toBe(
      "This leaves the active catalog. Assets, rights, and reporting stay on record.",
    );
    expect(titleDeleteConfirmBody({ isStaff: false, status: "draft" })).toBe(
      TITLE_LIFECYCLE.deleteDraftBody,
    );
    expect(titleDeleteConfirmBody({ isStaff: true, status: "live" })).toBe(
      TITLE_LIFECYCLE.deleteStaffBody,
    );
    expect(titleArchiveConfirmBody(true)).toBe(TITLE_LIFECYCLE.archiveFromDeleteBody);
    expect(titleArchiveConfirmBody(false)).toBe(TITLE_LIFECYCLE.archiveBody);
    expect(TITLE_LIFECYCLE.deleteDraftBody).not.toMatch(/cannot be undone|permanent|warning/i);
    expect(TITLE_LIFECYCLE.archiveBody).not.toMatch(/irreversible|forever|warning/i);
  });

  it("labels archived as a first-class title status", () => {
    expect(TITLE_STATUS_LABELS.archived).toBe("Archived");
    expect(titleDisplayStatus("archived", 2, 3)).toBe("Archived");
    expect(titleDisplayStatus("live", 2, 3)).toBe("Live · 2 of 3 platforms");
  });
});

describe("excludeArchivedTitles", () => {
  it("drops archived rows from an active catalog list", () => {
    const rows = [
      { id: "a", status: "live" },
      { id: "b", status: "archived" },
      { id: "c", status: "draft" },
    ];
    expect(excludeArchivedTitles(rows).map((row) => row.id)).toEqual(["a", "c"]);
  });
});
