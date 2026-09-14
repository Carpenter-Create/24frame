import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

import { WorkspaceSwitcher } from "./workspace-switcher";

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "workspace-switcher.tsx"), "utf8");

describe("WorkspaceSwitcher", () => {
  it("uses one flat active wash in both modes with no chip shadow", () => {
    const html = renderToStaticMarkup(createElement(WorkspaceSwitcher, { defaultWorkspace: "aggregation" }));
    expect(html).toContain("data-workspace-switcher");
    expect(html).toContain("shadow-none");
    expect(html).not.toMatch(/shadow-(?:sm|md|lg)|elevation/);
    expect(src).toContain("bg-surface-muted font-medium text-ink");
    expect(src).not.toContain("shadow-[");
    expect(src).not.toContain("hover:-translate");
    expect(src.match(/bg-surface-muted font-medium text-ink/g)?.length).toBe(1);
  });
});
