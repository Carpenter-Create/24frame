import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import { SETTINGS, SETTINGS_ABSENT } from "@/lib/settings";
import { getOrgContext } from "@/lib/supabase/context";
import { signedAvatarUrl } from "@/lib/s3-avatars";
import { ProfileSettings } from "./profile-settings";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
  useRouter: () => ({ refresh: vi.fn(), prefetch: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/s3-avatars", () => ({ signedAvatarUrl: vi.fn() }));
vi.mock("@/app/(app)/account/actions", () => ({
  saveAccountName: vi.fn(),
  uploadAccountPhoto: vi.fn(),
}));

function ctx(name: string | null, email = "ada@example.com") {
  return {
    user: { id: "u1", email, name },
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
const src = readFileSync(join(here, "profile-settings.tsx"), "utf8");

describe("ProfileSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(signedAvatarUrl).mockResolvedValue(null);
  });

  it("shows account identity only — no Edit public profile door", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx(null) as never);
    const html = renderToStaticMarkup(await ProfileSettings());
    expect(html).toContain('data-settings-hub="profile"');
    expect(html).toMatch(/<h1[^>]*>Profile<\/h1>/);
    expect(html).not.toMatch(/<h1[^>]*>Settings<\/h1>/);
    expect(html).not.toMatch(/<h2[^>]*>Profile<\/h2>/);
    expect(html).toContain(SETTINGS.profile);
    expect(src).toContain("settingsPaneTitle");
    expect(src).not.toContain("SETTINGS.title");
    expect(html).toContain(ACCOUNT_PROFILE.emailHint);
    expect(html).toContain(ACCOUNT_PROFILE.emailLocked);
    expect(html).toContain("ada@example.com");
    expect(html).toContain(ACCOUNT_PROFILE.save);
    expect(html).toContain('data-settings-profile-index=""');
    expect(html).toContain('data-settings-drill-row="name"');
    expect(html).toContain(ACCOUNT_PROFILE.emptyValue);
    expect(html).toContain(`href="${SETTINGS.profileNameHref}"`);
    expect(html).toContain('data-settings-drill-row="email"');
    expect(html).toContain("data-settings-drill-readonly");
    expect(html).toContain("md:hidden");
    expect(html).toContain("hidden md:block");
    expect(html).not.toContain("Edit public profile");
    expect(html).not.toContain("/social/profile/edit");
    expect(html).not.toContain("data-settings-edit-public-profile");
    expect(src).not.toContain("editPublicProfile");
    expect(src).not.toContain("SETTINGS_QUIET_ROW_CLASS");
    expect(src).not.toContain("next/link");
    expect(html).not.toContain('data-settings-section="company"');
    expect(html).not.toContain("data-company-profile-form");
    expect(src).not.toContain("CompanyProfileForm");
    expect(src).toContain("AccountProfileForm");
    expect(src).toContain("SettingsDrillRow");
    expect(src).toContain("AccountPhotoField");
    for (const absent of SETTINGS_ABSENT) {
      expect(html).not.toContain(absent);
    }
  });

  it("sends an unauthenticated visitor to login", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(null as never);
    await expect(ProfileSettings()).rejects.toThrow("REDIRECT:/login");
  });
});
