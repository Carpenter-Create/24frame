import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
  useRouter: () => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/components/settings/profile-settings", () => ({
  ProfileSettings: () => <div data-settings-hub="profile" />,
}));

import SettingsPage from "./page";

const here = dirname(fileURLToPath(import.meta.url));

describe("SettingsPage", () => {
  it("renders the mobile list and desktop Profile — no query or legacy redirect", async () => {
    const pageSrc = readFileSync(join(here, "page.tsx"), "utf8");
    const html = renderToStaticMarkup(await SettingsPage());
    expect(html).toContain("data-settings-hub-list");
    expect(html).toContain("md:hidden");
    expect(html).toContain("hidden md:block");
    expect(html).toContain('data-settings-hub="profile"');
    expect(pageSrc).toContain("SettingsHubList");
    expect(pageSrc).toContain("ProfileSettings");
    expect(pageSrc).not.toContain("settingsPathFromQuery");
    expect(pageSrc).not.toContain("permanentRedirect");
    expect(pageSrc).not.toContain("searchParams");
    expect(pageSrc).not.toContain("SETTINGS.profileHref");
  });
});
