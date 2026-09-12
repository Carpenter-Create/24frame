import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { SOCIAL } from "@/lib/social";
import SocialProfilePage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/app/(app)/social/actions", () => ({
  createSocialProfile: vi.fn(),
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

function stubProfile(profile: { id: string; handle: string; display_name: string; status: string } | null) {
  const maybeSingle = vi.fn(async () => ({ data: profile, error: null }));
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle,
  };
  const from = vi.fn((table: string) => {
    if (table === "profiles") return chain;
    throw new Error(`unexpected from(${table})`);
  });
  vi.mocked(createClient).mockResolvedValue({ from } as never);
  return { from, maybeSingle };
}

describe("Social profile opt-in", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the create form and does not insert on render", async () => {
    const { from } = stubProfile(null);
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = renderToStaticMarkup(await SocialProfilePage());
    expect(html).toContain("data-social-profile");
    expect(html).toContain("data-social-profile-form");
    expect(html).toContain(SOCIAL.profile.handle);
    expect(html).toContain(SOCIAL.profile.displayName);
    expect(html).toContain(SOCIAL.profile.emptyBody);
    expect(html).not.toContain("Globee");
    expect(from).toHaveBeenCalledWith("profiles");
    expect(from).not.toHaveBeenCalledWith("memberships");
  });

  it("renders an existing creator profile without a second create form", async () => {
    stubProfile({ id: "u1", handle: "ada", display_name: "Ada Lovelace", status: "active" });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = renderToStaticMarkup(await SocialProfilePage());
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("@ada");
    expect(html).toContain("AL");
    expect(html).not.toContain("data-social-profile-form");
  });
});
