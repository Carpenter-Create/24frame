import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { signedAvatarUrl } from "@/lib/s3-avatars";
import { SOCIAL } from "@/lib/social";
import SocialProfilePage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/s3-avatars", () => ({
  signedAvatarUrl: vi.fn().mockResolvedValue(null),
  signedAvatarUrls: vi.fn().mockResolvedValue(new Map()),
}));
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
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(signedAvatarUrl).mockResolvedValue(null);
  });

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
    expect(html).not.toContain("<img");
  });

  it("renders the signed account face and does not add a second upload", async () => {
    stubProfile({ id: "u1", handle: "ada", display_name: "Ada Lovelace", status: "active" });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    vi.mocked(signedAvatarUrl).mockResolvedValue("https://s3.example/signed-avatar");

    const html = renderToStaticMarkup(await SocialProfilePage());
    expect(html).toContain('src="https://s3.example/signed-avatar"');
    expect(html).toContain("Ada Lovelace");
    expect(html).not.toContain("AL");
    expect(html).not.toContain("type=\"file\"");
    expect(html).not.toContain("data-social-profile-form");

    const src = readFileSync("src/app/(app)/social/profile/page.tsx", "utf8");
    expect(src).toContain("signedAvatarUrl");
    expect(src).not.toContain("putAvatarObject");
    expect(src).not.toContain("uploadAccountPhoto");
    expect(src).not.toContain("S3_AVATARS_BUCKET");
  });
});
