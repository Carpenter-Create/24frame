import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  permanentRedirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));
vi.mock("@/components/settings/profile-settings", () => ({
  ProfileSettings: () => <div data-settings-hub="profile" />,
}));

import SettingsPage from "./page";

const here = dirname(fileURLToPath(import.meta.url));

describe("SettingsPage", () => {
  it("permanently redirects ?section= aliases to the path contract", async () => {
    await expect(
      SettingsPage({ searchParams: Promise.resolve({ section: "education" }) }),
    ).rejects.toThrow("REDIRECT:/settings/preferences");
    await expect(
      SettingsPage({ searchParams: Promise.resolve({ section: "social" }) }),
    ).rejects.toThrow("REDIRECT:/settings/preferences");
    await expect(
      SettingsPage({ searchParams: Promise.resolve({ section: "you" }) }),
    ).rejects.toThrow("REDIRECT:/settings/profile");
    await expect(
      SettingsPage({ searchParams: Promise.resolve({ section: "aggregation" }) }),
    ).rejects.toThrow("REDIRECT:/settings/organization");
  });

  it("renders the mobile list and desktop Profile — not a Profile redirect", async () => {
    const pageSrc = readFileSync(join(here, "page.tsx"), "utf8");
    const html = renderToStaticMarkup(
      await SettingsPage({ searchParams: Promise.resolve({}) }),
    );
    expect(html).toContain("data-settings-hub-list");
    expect(html).toContain("md:hidden");
    expect(html).toContain("hidden md:block");
    expect(html).toContain('data-settings-hub="profile"');
    expect(pageSrc).toContain("settingsPathFromQuery");
    expect(pageSrc).toContain("SettingsHubList");
    expect(pageSrc).toContain("ProfileSettings");
    expect(pageSrc).toContain("permanentRedirect");
    expect(pageSrc).not.toContain("SETTINGS.profileHref");
  });
});
