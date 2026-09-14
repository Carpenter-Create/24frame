import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { SOCIAL } from "@/lib/social";
import SocialCreatePage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/social-profile", () => ({
  ensureOwnSocialProfile: vi.fn().mockResolvedValue({
    id: "u1",
    handle: "ada",
    display_name: "Ada Lovelace",
    status: "active",
  }),
}));
vi.mock("@/app/(app)/social/actions", () => ({
  createSocialPost: vi.fn(),
  presignSocialMediaUpload: vi.fn(),
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
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => ({ data: profile, error: null })),
  };
  vi.mocked(createClient).mockResolvedValue({ from: vi.fn(() => chain) } as never);
}

describe("Social Create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
  });

  it("is its own compose destination and not Home chrome", async () => {
    stubProfile({ id: "u1", handle: "ada", display_name: "Ada Lovelace", status: "active" });
    const html = renderToStaticMarkup(await SocialCreatePage());
    expect(html).toContain("data-social-create");
    expect(html).toContain(SOCIAL.create.title);
    expect(html).toContain("data-social-create-form");
    expect(html).toContain(SOCIAL.create.text);
    expect(html).toContain(SOCIAL.create.photo);
    expect(html).toContain(SOCIAL.create.video);
    expect(html).not.toContain("data-social-lenses");
    expect(readFileSync("src/app/(app)/social/page.tsx", "utf8")).not.toContain("SocialCreateCompose");
    expect(readFileSync("src/app/(app)/social/page.tsx", "utf8")).not.toContain("SocialPostCompose");
  });
});
