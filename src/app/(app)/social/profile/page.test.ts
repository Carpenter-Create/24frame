import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { signedAvatarUrl } from "@/lib/s3-avatars";
import { SOCIAL } from "@/lib/social";
import { ensureOwnSocialProfileResult } from "@/lib/social-profile";
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
vi.mock("@/lib/social-profile", () => ({
  ensureOwnSocialProfileResult: vi.fn(),
}));
vi.mock("@/app/(app)/social/actions", () => ({
  createSocialProfile: vi.fn(),
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

function stubProfile(profile: { id: string; handle: string; display_name: string; status: string; bio?: string | null } | null) {
  const maybeSingle = vi.fn(async () => ({ data: profile, error: null }));
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    gt: vi.fn(() => chain),
    order: vi.fn(() => chain),
    range: vi.fn(async () => ({ data: [], error: null })),
    maybeSingle,
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data: [], error: null }).then(resolve),
  };
  const from = vi.fn((table: string) => {
    if (table === "profiles") return chain;
    if (table === "stories") return chain;
    throw new Error(`unexpected from(${table})`);
  });
  vi.mocked(createClient).mockResolvedValue({ from } as never);
  return { from, maybeSingle };
}

describe("Social profile opt-in", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(signedAvatarUrl).mockResolvedValue(null);
    vi.mocked(ensureOwnSocialProfileResult).mockResolvedValue({
      profile: {
        id: "u1",
        handle: "ada",
        display_name: "Ada Lovelace",
        status: "active",
        bio: null,
      },
      error: null,
    });
  });

  it("shows the handle field after ensure and does not insert on render", async () => {
    const { from } = stubProfile({
      id: "u1",
      handle: "ada",
      display_name: "Ada Lovelace",
      status: "active",
    });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = renderToStaticMarkup(await SocialProfilePage());
    expect(html).toContain("data-social-profile");
    expect(html).toContain("data-social-profile-form");
    expect(html).toContain("data-social-handle-field");
    expect(html).toContain(SOCIAL.profile.handlePlaceholder);
    expect(html).toContain("https://24frame.co/@ada");
    expect(html).toContain("@ada");
    expect(html).not.toContain("Globee");
    expect(html).not.toContain("app.24frame.co");
    expect(from).not.toHaveBeenCalledWith("memberships");
  });

  it("renders the ensured creator profile with the handle editor", async () => {
    stubProfile({ id: "u1", handle: "ada", display_name: "Ada Lovelace", status: "active" });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = renderToStaticMarkup(await SocialProfilePage());
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("@ada");
    expect(html).toContain("AL");
    expect(html).toContain("data-social-profile-form");
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
    expect(html).toContain("data-social-profile-form");

    const src = readFileSync("src/app/(app)/social/profile/page.tsx", "utf8");
    expect(src).toContain("signedAvatarUrl");
    expect(src).not.toContain("putAvatarObject");
    expect(src).not.toContain("uploadAccountPhoto");
    expect(src).not.toContain("S3_AVATARS_BUCKET");
  });

  it("shows @handle after ensure, not an empty create form", async () => {
    stubProfile({ id: "u1", handle: "ada", display_name: "Ada Lovelace", status: "active" });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = renderToStaticMarkup(await SocialProfilePage());
    expect(html).toContain("@ada");
    expect(html).toContain("https://24frame.co/@ada");
    expect(html).toContain('value="@ada"');
    expect(html).toContain("Ada Lovelace");
  });

  it("keeps SocialHandleField on the empty create form when ensure fails", async () => {
    stubProfile(null);
    vi.mocked(ensureOwnSocialProfileResult).mockResolvedValue({
      profile: null,
      error: "null value in column birth_date",
    });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = renderToStaticMarkup(await SocialProfilePage());
    expect(html).toContain("data-social-handle-field");
    expect(html).toContain('value="@"');
    expect(html).toContain("data-social-handle-url");
    expect(html).toContain("https://24frame.co/@");
    expect(html).toContain(SOCIAL.profile.handlePlaceholder);
    expect(html).toContain("null value in column birth_date");
    expect(html).not.toContain("Ada Lovelace");
  });
});
