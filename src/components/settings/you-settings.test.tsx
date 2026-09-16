import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import { SETTINGS, SETTINGS_ABSENT } from "@/lib/settings";
import { getOrgContext } from "@/lib/supabase/context";
import { signedAvatarUrl } from "@/lib/s3-avatars";
import { YouSettings } from "./you-settings";

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
const src = readFileSync(join(here, "you-settings.tsx"), "utf8");

describe("YouSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(signedAvatarUrl).mockResolvedValue(null);
  });

  it("shows identity already in product and deep-links Edit public profile", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx(null) as never);
    const html = renderToStaticMarkup(await YouSettings());
    expect(html).toContain('data-settings-hub="you"');
    expect(html).toContain(SETTINGS.title);
    expect(html).toContain(SETTINGS.you);
    expect(html).toContain(ACCOUNT_PROFILE.emailHint);
    expect(html).toContain("ada@example.com");
    expect(html).toContain(SETTINGS.editPublicProfile);
    expect(html).toContain(`href="${SETTINGS.editPublicProfileHref}"`);
    expect(html).toContain('data-settings-edit-public-profile=""');
    expect(html).not.toContain('data-settings-section="company"');
    expect(html).not.toContain("data-company-profile-form");
    expect(src).not.toContain("CompanyProfileForm");
    expect(src).toContain("AccountProfileForm");
    for (const absent of SETTINGS_ABSENT) {
      expect(html).not.toContain(absent);
    }
  });

  it("sends an unauthenticated visitor to login", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(null as never);
    await expect(YouSettings()).rejects.toThrow("REDIRECT:/login");
  });
});
