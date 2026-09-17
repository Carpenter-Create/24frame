import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { TITLE_LIFECYCLE } from "@/lib/titles-lifecycle";
import { TitleLifecycleControls } from "./title-lifecycle-controls";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "title-lifecycle-controls.tsx"), "utf8");
const pageSrc = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "page.tsx"), "utf8");

const DELETE_FLAGS = {
  canDelete: true,
  canArchive: false,
  canRestore: false,
  offerArchiveFromDelete: false,
} as const;

describe("TitleLifecycleControls", () => {
  it("shows the house actions menu and Delete confirm when flags allow", () => {
    const html = renderToStaticMarkup(
      createElement(TitleLifecycleControls, {
        titleId: "t1",
        status: "draft",
        isStaff: false,
        flags: DELETE_FLAGS,
      }),
    );
    expect(html).toContain("data-title-lifecycle");
    expect(html).toContain("data-title-lifecycle-menu");
    expect(html).toContain(TITLE_LIFECYCLE.moreLabel);
    expect(html).toContain("data-title-lifecycle-delete-confirm");
    expect(html).toContain(TITLE_LIFECYCLE.deleteLabel);
    expect(html).not.toContain("data-title-lifecycle-archive-confirm");
    expect(html).not.toContain("cannot be undone");
    expect(html).not.toContain("bg-accent");
  });

  it("offers Archive confirm when delete is refused for reporting history", () => {
    const html = renderToStaticMarkup(
      createElement(TitleLifecycleControls, {
        titleId: "t1",
        status: "live",
        isStaff: true,
        flags: {
          canDelete: false,
          canArchive: true,
          canRestore: false,
          offerArchiveFromDelete: true,
        },
      }),
    );
    expect(html).toContain("data-title-lifecycle-menu");
    expect(html).toContain("data-title-lifecycle-archive-confirm");
    expect(html).toContain(TITLE_LIFECYCLE.archiveLabel);
    expect(html).not.toContain("data-title-lifecycle-delete-confirm");
  });

  it("offers Restore confirm on an archived title", () => {
    const html = renderToStaticMarkup(
      createElement(TitleLifecycleControls, {
        titleId: "t1",
        status: "archived",
        isStaff: false,
        flags: {
          canDelete: false,
          canArchive: false,
          canRestore: true,
          offerArchiveFromDelete: false,
        },
      }),
    );
    expect(html).toContain("data-title-lifecycle-menu");
    expect(html).toContain("data-title-lifecycle-restore-confirm");
    expect(html).toContain(TITLE_LIFECYCLE.restoreLabel);
  });

  it("hides the control when no lifecycle flags are offered", () => {
    const html = renderToStaticMarkup(
      createElement(TitleLifecycleControls, {
        titleId: "t1",
        status: "live",
        isStaff: false,
        flags: {
          canDelete: false,
          canArchive: false,
          canRestore: false,
          offerArchiveFromDelete: false,
        },
      }),
    );
    expect(html).toBe("");
    expect(html).not.toContain("data-title-lifecycle");
    expect(html).not.toContain("data-title-lifecycle-menu");
    expect(html).not.toContain(TITLE_LIFECYCLE.deleteLabel);
  });

  it("uses the house menu surface with danger Delete, not a muted mid-page link", () => {
    expect(src).toContain("MenuSurfaceContent");
    expect(src).toContain("MenuSurfaceItem");
    expect(src).toContain("danger");
    expect(src).toContain("data-title-lifecycle-delete");
    expect(src).toContain("TITLE_LIFECYCLE.moreLabel");
    expect(src).not.toContain('className="t-body-sm text-ink-2 hover:text-ink"');
  });

  it("mounts on the title-detail hero overflow, not mid-page alone", () => {
    expect(pageSrc).toContain("overflow={");
    expect(pageSrc).toContain("<TitleLifecycleControls");
    expect(pageSrc).toContain("isStaff={ctx.isGcStaff}");
    expect(pageSrc.indexOf("overflow={")).toBeLessThan(pageSrc.indexOf("<TitleLifecycleControls"));
    expect(pageSrc).toContain("titleRole");
    expect(pageSrc).toContain("ctx.activeRole");
  });
});
