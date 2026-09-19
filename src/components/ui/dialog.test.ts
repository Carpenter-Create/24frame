import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  DIALOG_BODY_CLASS,
  DIALOG_FOOTER_CLASS,
  DIALOG_HEADER_CLASS,
  DIALOG_PANEL_CLASS,
  DIALOG_SIZES,
} from "./dialog";

const src = readFileSync("src/components/ui/dialog.tsx", "utf8");
const titles = readFileSync(
  "src/app/(app)/aggregation/titles/[id]/title-lifecycle-controls.tsx",
  "utf8",
);
const header = readFileSync("src/components/chrome/messages-app-header.tsx", "utf8");

describe("dialog confirm grammar", () => {
  it("hugs content — m-auto without h-fit stretches into a tall empty panel", () => {
    expect(DIALOG_PANEL_CLASS).toContain("m-auto");
    expect(DIALOG_PANEL_CLASS).toContain("h-fit");
    expect(DIALOG_BODY_CLASS).toBe("px-5 py-3");
    expect(DIALOG_HEADER_CLASS).toContain("py-3");
    expect(DIALOG_FOOTER_CLASS).toBe(
      "mt-[var(--space-3)] flex justify-end gap-[var(--space-2)]",
    );
    expect(DIALOG_FOOTER_CLASS).not.toContain("space-4");
    expect(DIALOG_SIZES.sm).toBe("w-[min(92vw,22rem)]");
    expect(src).toContain("export function DialogFooter");
    expect(src).toContain("data-dialog-size");
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
