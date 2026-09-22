import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LOCATION } from "@/lib/location";
import { SETTINGS } from "@/lib/settings";
import { getOrgContext } from "@/lib/supabase/context";
import SettingsPreferencesLocationPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("./actions", () => ({
  loadProfileLocation: vi.fn(async () => ({ city: "Austin", region: "TX", country: "US" })),
  searchProfilePlaces: vi.fn(async () => []),
  saveProfileLocation: vi.fn(),
  clearProfileLocation: vi.fn(),
}));
vi.mock("@/app/(app)/settings/preferences/location/actions", () => ({
  loadProfileLocation: vi.fn(async () => ({ city: "Austin", region: "TX", country: "US" })),
  searchProfilePlaces: vi.fn(async () => []),
  saveProfileLocation: vi.fn(),
  clearProfileLocation: vi.fn(),
}));

function ctx() {
  return {
    user: { id: "u1", email: "ada@example.com", name: "Ada" },
    rows: [],
    orgs: [],
    activeOrg: null,
    activeRole: null,
    canOperate: true,
    isGcStaff: false,
    unread: Promise.resolve(0),
  };
}

const here = dirname(fileURLToPath(import.meta.url));
const pageSrc = readFileSync(join(here, "page.tsx"), "utf8");

describe("SettingsPreferencesLocationPage", () => {
  beforeEach(() => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
  });

  it("is a Location edit pane that backs to Preferences", async () => {
    const html = renderToStaticMarkup(await SettingsPreferencesLocationPage());
    expect(html).toContain('data-settings-edit-pane=""');
    expect(html).toContain('data-settings-hub="preferences"');
    expect(html).toMatch(/<h1[^>]*>Location<\/h1>/);
    expect(html).toContain(LOCATION.helper);
    expect(html).toContain(`href="${SETTINGS.preferencesHref}"`);
    expect(html).toContain("Preferences");
    expect(html).toContain("Austin, TX, US");
    expect(html).toContain('data-location-search=""');
    expect(html).toContain('data-location-clear=""');
    expect(html).toContain(LOCATION.clear);
    expect(html).toContain(LOCATION.searchPlaceholder);
    expect(html).not.toContain(SETTINGS.themeHelper);
    expect(html).not.toContain("Learn from typed and dictated text");
    expect(pageSrc).toContain("SettingsEditPane");
    expect(pageSrc).toContain("SETTINGS.locationHref");
    expect(pageSrc).not.toContain("@phosphor-icons/react");
  });

  it("sends an unauthenticated visitor to login", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(null as never);
    await expect(SettingsPreferencesLocationPage()).rejects.toThrow("REDIRECT:/login");
  });
});
