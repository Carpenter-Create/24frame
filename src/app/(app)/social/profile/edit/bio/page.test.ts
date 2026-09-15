import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { SOCIAL } from "@/lib/social";
import { ensureOwnSocialProfileResult } from "@/lib/social-profile";
import SocialProfileBioPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/social-profile", () => ({
  ensureOwnSocialProfileResult: vi.fn(),
}));
vi.mock("@/app/(app)/social/actions", () => ({
  updateSocialBio: vi.fn(),
}));

function ctx() {
  return {
    user: { id: "u1", email: "ada@example.com" },
    rows: [],
    orgs: [],
    activeOrg: null,
    activeRole: null,
    canOperate: false,
    isGcStaff: false,
    unread: Promise.resolve(0),
  };
}

const ensured = {
  id: "u1",
  handle: "ada",
  display_name: "Ada Lovelace",
  status: "active",
  bio: "Founder\nInvestor",
};

describe("Social profile Bio page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureOwnSocialProfileResult).mockResolvedValue({
      profile: ensured,
      error: null,
    });
    vi.mocked(createClient).mockResolvedValue({ from: vi.fn() } as never);
  });

  it("renders the locked Bio editor with newlines and the 150 counter", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    const html = renderToStaticMarkup(await SocialProfileBioPage());
    expect(html).toContain("data-social-profile-bio");
    expect(html).toContain("data-social-bio-textarea");
    expect(html).toContain("Founder\nInvestor");
    expect(html).toContain("16 / 150");
    expect(html).toContain(SOCIAL.profile.bioPrivacy);
    expect(html).toContain("data-social-bio-done");
    expect(html).not.toContain("<form");
    expect(html).not.toContain("Education");
  });
});
