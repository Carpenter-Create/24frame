import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  DIALOG_BODY_CLASS,
  DIALOG_FOOTER_CLASS,
  DIALOG_PANEL_CLASS,
  DIALOG_SIZES,
  HOUSE_DIALOG_HEADER_CLASS,
} from "./dialog";
import {
  HOUSE_DIALOG_CONFIRM_CLASS,
  HOUSE_DIALOG_FORM_CLASS,
} from "@/lib/house-overlay";

const src = readFileSync("src/components/ui/dialog.tsx", "utf8");
const titles = readFileSync(
  "src/app/(app)/aggregation/titles/[id]/title-lifecycle-controls.tsx",
  "utf8",
);
const header = readFileSync("src/components/chrome/messages-app-header.tsx", "utf8");

describe("dialog confirm grammar", () => {
  it("is HouseDialog — centered, hairline, no shadow, confirm 400 / form 480", () => {
    expect(DIALOG_PANEL_CLASS).toContain("m-auto");
    expect(DIALOG_PANEL_CLASS).toContain("h-fit");
    expect(DIALOG_PANEL_CLASS).toContain("max-h-[80vh]");
    expect(DIALOG_PANEL_CLASS).toContain("overflow-visible");
    expect(DIALOG_PANEL_CLASS).toContain("rounded-[16px]");
    expect(DIALOG_PANEL_CLASS).toContain("border-hairline");
    expect(DIALOG_PANEL_CLASS).toContain("p-[var(--space-6)]");
    expect(DIALOG_PANEL_CLASS).toContain("shadow-none");
    expect(DIALOG_PANEL_CLASS).toContain("backdrop:bg-ink/40");
    expect(DIALOG_PANEL_CLASS).not.toContain("backdrop-blur");
    expect(DIALOG_PANEL_CLASS).not.toContain("shadow-[var(--elevation)]");
    expect(DIALOG_BODY_CLASS).toBe("pt-[var(--space-4)]");
    expect(HOUSE_DIALOG_HEADER_CLASS).toContain("border-hairline");
    expect(DIALOG_FOOTER_CLASS).toBe(
      "mt-[var(--space-3)] flex justify-end gap-[var(--space-2)]",
    );
    expect(DIALOG_SIZES.sm).toBe(HOUSE_DIALOG_CONFIRM_CLASS);
    expect(DIALOG_SIZES.md).toBe(HOUSE_DIALOG_FORM_CLASS);
    expect(DIALOG_SIZES.sm).toContain("400px");
    expect(DIALOG_SIZES.md).toContain("480px");
    expect(src).toContain("export function DialogFooter");
    expect(src).toContain("data-dialog-size");
    expect(src).toContain('data-house-overlay-host="house-dialog"');
    expect(src).toContain("AppSheetFrame");
    expect(src).toContain('size !== "xl" && "max-md:hidden"');
    expect(src).not.toContain("DIALOG_SHEET_CLASS");
    expect(src).not.toContain("presentation");
    expect(src).not.toContain("max-md:mt-auto");
  });

  it("puts confirm footers on DialogFooter + Button, not a Titles-only height hack", () => {
    const deleteDialog = titles.slice(
      titles.indexOf("title={titleDeleteConfirmTitle"),
      titles.indexOf("title={titleArchiveConfirmTitle"),
    );
    expect(titles).toContain("DialogFooter");
    expect(titles).toContain('size="sm"');
    expect(deleteDialog).toContain("DialogFooter");
    expect(deleteDialog).not.toContain("min-h-");
    expect(deleteDialog).not.toContain("h-[");
    expect(header).toContain("DialogFooter");
    expect(header).toContain('size="sm"');
  });
});
