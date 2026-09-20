import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { SOCIAL } from "@/lib/social";
import { createSocialProfile } from "./actions";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/auth", () => ({ getAuthUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

function user() {
  return { id: "u1", email: "ada@example.com" };
}

function stub({
  profile = { id: "u1", handle: "ada", display_name: "Ada Lovelace", status: "active" },
  handleOwner = null as { id: string } | null,
}: {
  profile?: { id: string; handle: string; display_name: string; status: string } | null;
  handleOwner?: { id: string } | null;
} = {}) {
  const updates: { table: string; row: unknown }[] = [];
  const inserts: { table: string; row: unknown }[] = [];
  const from = vi.fn((table: string) => {
    const filters: Record<string, string> = {};
    const chain: Record<string, unknown> = {};
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn((col: string, val: string) => {
      filters[col] = val;
      return chain;
    });
    chain.maybeSingle = vi.fn(async () => {
      if (filters.handle !== undefined) return { data: handleOwner, error: null };
      return { data: profile, error: null };
    });
    chain.insert = vi.fn(async (row: unknown) => {
      inserts.push({ table, row });
      return { data: null, error: null };
    });
    chain.update = vi.fn((row: unknown) => {
      updates.push({ table, row });
      return chain;
    });
    chain.then = (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data: null, error: null }).then(resolve);
    return chain;
  });
  vi.mocked(createClient).mockResolvedValue({ from } as never);
  return { from, updates, inserts };
}

describe("createSocialProfile handle uniqueness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthUser).mockResolvedValue(user() as never);
  });

  it("returns a clear taken error when another owner already has the handle", async () => {
    const { updates } = stub({ handleOwner: { id: "u2" } });
    const form = new FormData();
    form.set("handle", "@OtherUser");
    expect(await createSocialProfile(form)).toEqual({ error: SOCIAL.profile.handleTaken });
    expect(updates).toEqual([]);
  });

  it("saves when the handle is free", async () => {
    const { updates } = stub({ handleOwner: null });
    const form = new FormData();
    form.set("handle", "@new_handle");
    form.set("display_name", "Ada Lovelace");
    expect(await createSocialProfile(form)).toEqual({});
    expect(updates).toEqual([
      {
        table: "profiles",
        row: { handle: "new_handle", display_name: "Ada Lovelace" },
      },
    ]);
  });

  it("lets the owner keep their own handle, including a casing-only edit", async () => {
    const { updates } = stub({
      profile: { id: "u1", handle: "ada", display_name: "Ada Lovelace", status: "active" },
      handleOwner: { id: "u1" },
    });
    const form = new FormData();
    form.set("handle", "@ADA");
    form.set("display_name", "Ada Lovelace");
    expect(await createSocialProfile(form)).toEqual({});
    expect(updates).toEqual([
      {
        table: "profiles",
        row: { handle: "ADA", display_name: "Ada Lovelace" },
      },
    ]);
  });
});
