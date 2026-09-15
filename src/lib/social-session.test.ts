import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { loadSocialSession, requireSocialSession } from "@/lib/social-session";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

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

describe("social session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue({ from: vi.fn() } as never);
  });

  it("loads auth and the page client together", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    const session = await loadSocialSession();
    expect(session?.ctx.user.id).toBe("u1");
    expect(getOrgContext).toHaveBeenCalled();
    expect(createClient).toHaveBeenCalled();
  });

  it("sends an unauthenticated visitor to login", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(null as never);
    await expect(requireSocialSession()).rejects.toThrow("REDIRECT:/login");
  });

  it("starts auth and createClient in one Promise.all", () => {
    const src = readFileSync("src/lib/social-session.ts", "utf8");
    expect(src).toContain("Promise.all([getOrgContext(), createClient()])");
    expect(src).toContain("requestCache");
    expect(src).toContain("cache(fn)");
  });
});
