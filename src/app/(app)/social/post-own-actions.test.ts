import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SOCIAL } from "@/lib/social";
import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteSocialPost, updateSocialPostCaption } from "./light-actions";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));
vi.mock("@/lib/supabase/auth", () => ({ getAuthUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/social-hot-cache", () => ({
  bustSocialFeedHotCache: vi.fn(async () => {}),
  bustSocialFollowHotCache: vi.fn(async () => {}),
  withSocialHotCache: vi.fn(async (_key: string, load: () => Promise<unknown>) => load()),
  socialHotSet: vi.fn(async () => {}),
  socialHotGet: vi.fn(async () => null),
  socialHotDel: vi.fn(async () => {}),
}));

const profile = {
  id: "u1",
  handle: "ada",
  display_name: "Ada",
  status: "active",
  bio: null,
};

function mockClient(post: {
  id: string;
  author_id: string;
  body: string | null;
  media: unknown;
  status: string;
} | null, saved: { id: string } | null = { id: "p1" }) {
  const updates: { table: string; row: unknown }[] = [];
  const from = vi.fn((table: string) => {
    let writing = false;
    const chain: Record<string, unknown> = {};
    const self = () => chain;
    chain.select = vi.fn(self);
    chain.eq = vi.fn(self);
    chain.update = vi.fn((row: unknown) => {
      updates.push({ table, row });
      writing = true;
      return chain;
    });
    chain.maybeSingle = vi.fn(async () => {
      if (table === "profiles") return { data: profile, error: null };
      if (writing) return { data: saved, error: null };
      return { data: post, error: null };
    });
    return chain;
  });
  vi.mocked(createClient).mockResolvedValue({ from } as never);
  return { updates };
}

describe("own-post server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthUser).mockResolvedValue({ id: "u1", email: "ada@example.com" });
  });

  it("saves the author caption and does not send media", async () => {
    const { updates } = mockClient({
      id: "p1",
      author_id: "u1",
      body: "hello",
      media: [{ kind: "image", key: "posts/u1/a.jpg" }],
      status: "active",
    });
    const form = new FormData();
    form.set("post_id", "p1");
    form.set("body", "  revised  ");
    expect(await updateSocialPostCaption(form)).toEqual({});
    expect(updates).toEqual([
      {
        table: "posts",
        row: { body: "revised", edited_at: expect.any(String) },
      },
    ]);
    expect(updates[0]?.row).not.toHaveProperty("media");
    expect(updates[0]?.row).not.toHaveProperty("status");
  });

  it("refuses a non-author before any update", async () => {
    const { updates } = mockClient({
      id: "p1",
      author_id: "u2",
      body: "hello",
      media: [],
      status: "active",
    });
    const form = new FormData();
    form.set("post_id", "p1");
    form.set("body", "stolen");
    expect(await updateSocialPostCaption(form)).toEqual({ error: SOCIAL.post.notAuthor });
    expect(await deleteSocialPost(form)).toEqual({ error: SOCIAL.post.notAuthor });
    expect(updates).toEqual([]);
  });

  it("soft-deletes the author post as removed and does not hard-delete", async () => {
    const { updates } = mockClient({
      id: "p1",
      author_id: "u1",
      body: "hello",
      media: [],
      status: "active",
    });
    const form = new FormData();
    form.set("post_id", "p1");
    expect(await deleteSocialPost(form)).toEqual({});
    expect(updates).toEqual([{ table: "posts", row: { status: "removed" } }]);
    const src = readFileSync("src/app/(app)/social/light-actions.ts", "utf8");
    const remove = src.slice(src.indexOf("export async function deleteSocialPost"));
    expect(remove).toContain('from("posts")');
    expect(remove).not.toContain(".delete(");
    expect(remove).not.toContain('from("stories")');
  });

  it("refuses an empty caption when the post has no media", async () => {
    const { updates } = mockClient({
      id: "p1",
      author_id: "u1",
      body: "hello",
      media: [],
      status: "active",
    });
    const form = new FormData();
    form.set("post_id", "p1");
    form.set("body", "   ");
    expect(await updateSocialPostCaption(form)).toEqual({ error: SOCIAL.home.emptyPost });
    expect(updates).toEqual([]);
  });
});
