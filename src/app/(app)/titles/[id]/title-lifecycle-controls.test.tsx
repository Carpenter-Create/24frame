import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { TITLE_LIFECYCLE } from "@/lib/titles-lifecycle";
import { TitleLifecycleControls } from "./title-lifecycle-controls";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

describe("TitleLifecycleControls", () => {
  it("offers a quiet Delete confirm for an owner draft", () => {
    const html = renderToStaticMarkup(
      createElement(TitleLifecycleControls, {
        titleId: "t1",
        status: "draft",
        isStaff: false,
        flags: {
          canDelete: true,
          canArchive: false,
          canRestore: false,
          offerArchiveFromDelete: false,
        },
      }),
    );
    expect(html).toContain("data-title-lifecycle");
    expect(html).toContain("data-title-lifecycle-delete");
    expect(html).toContain(TITLE_LIFECYCLE.deleteLabel);
    expect(html).not.toContain("data-title-lifecycle-archive");
    expect(html).not.toContain("cannot be undone");
    expect(html).not.toContain("bg-accent");
  });

  it("offers Archive when delete is refused for reporting history", () => {
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
    expect(html).toContain("data-title-lifecycle-archive");
    expect(html).toContain(TITLE_LIFECYCLE.archiveLabel);
    expect(html).not.toContain("data-title-lifecycle-delete");
  });

  it("offers Restore on an archived title", () => {
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
    expect(html).toContain("data-title-lifecycle-restore");
    expect(html).toContain(TITLE_LIFECYCLE.restoreLabel);
  });
});
