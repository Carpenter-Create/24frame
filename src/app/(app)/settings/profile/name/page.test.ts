import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import { SETTINGS } from "@/lib/settings";
import { getOrgContext } from "@/lib/supabase/context";
import SettingsProfileNamePage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
  useRouter: () => ({ refresh: vi.fn(), prefetch: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/app/(app)/account/actions", () => ({
  saveAccountName: vi.fn(),
  uploadAccountPhoto: vi.fn(),
}));

function ctx(name: string | null) {
  return {
    user: { id: "u1", email: "ada@example.com", name },
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

describe("SettingsProfileNamePage", () => {
  beforeEach(() => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx("Ada Lovelace") as never);
  });

  it("is a Name edit pane with the shared name form — back to Profile", async () => {
    const html = renderToStaticMarkup(await SettingsProfileNamePage());
    expect(html).toContain('data-settings-edit-pane=""');
    expect(html).toContain('data-settings-hub="profile"');
    expect(html).toMatch(/<h1[^>]*>Name<\/h1>/);
    expect(html).toContain(ACCOUNT_PROFILE.nameHelper);
    expect(html).toContain(`href="${SETTINGS.profileHref}"`);
    expect(html).toContain("Profile");
    expect(html).toContain('data-account-name-form=""');
    expect(html).toContain('id="account-name"');
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain(ACCOUNT_PROFILE.save);
    expect(html).not.toContain(ACCOUNT_PROFILE.emailLabel);
    expect(html).not.toContain("ada@example.com");
    expect(html).not.toContain("data-account-photo");
    expect(pageSrc).toContain("AccountNameForm");
    expect(pageSrc).toContain("labeled={false}");
    expect(pageSrc).toContain("SettingsEditPane");
    expect(pageSrc).not.toContain("AccountProfileForm");
    expect(pageSrc).not.toContain("AccountEmailField");
  });

  it("sends an unauthenticated visitor to login", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(null as never);
    await expect(SettingsProfileNamePage()).rejects.toThrow("REDIRECT:/login");
  });
});
