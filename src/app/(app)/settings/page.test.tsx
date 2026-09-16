import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));
vi.mock("@/components/settings/you-settings", () => ({
  YouSettings: () => <div data-settings-hub="you" />,
}));

import SettingsPage from "./page";

const here = dirname(fileURLToPath(import.meta.url));

describe("SettingsPage", () => {
  it("redirects ?section= to the path contract", async () => {
    await expect(
      SettingsPage({ searchParams: Promise.resolve({ section: "education" }) }),
    ).rejects.toThrow("REDIRECT:/settings/education");
    await expect(
      SettingsPage({ searchParams: Promise.resolve({ section: "social" }) }),
    ).rejects.toThrow("REDIRECT:/settings/social");
  });

  it("renders the mobile list and desktop You — not a Profile redirect", async () => {
    const pageSrc = readFileSync(join(here, "page.tsx"), "utf8");
    const html = renderToStaticMarkup(
      await SettingsPage({ searchParams: Promise.resolve({}) }),
    );
    expect(html).toContain("data-settings-hub-list");
    expect(html).toContain("md:hidden");
    expect(html).toContain("hidden md:block");
    expect(html).toContain('data-settings-hub="you"');
    expect(pageSrc).toContain("settingsPathFromQuery");
    expect(pageSrc).toContain("SettingsHubList");
    expect(pageSrc).toContain("YouSettings");
    expect(pageSrc).not.toContain("SETTINGS.profileHref");
  });
});
