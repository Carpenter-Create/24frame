import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { likeInsertRow, postInsertRow, profileInsertRow, SOCIAL } from "@/lib/social";
import {
  addSocialDmPeople,
  createSocialPost,
  createSocialProfile,
  openSocialDm,
  presignSocialMediaUpload,
  toggleSocialLike,
} from "./actions";

vi.mock("@/lib/s3-social-media", () => ({
  presignSocialMediaPut: vi.fn(),
}));

import { presignSocialMediaPut } from "@/lib/s3-social-media";

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
  profile = null,
  insertError = null,
  rpcError = null,
  rpcData = null,
}: {
  profile?: { id: string } | null;
  insertError?: { message: string; code?: string } | null;
  rpcError?: { message: string } | null;
  rpcData?: unknown;
} = {}) {
  const inserts: { table: string; row: unknown }[] = [];
  const from = vi.fn((table: string) => {
    const chain = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      delete: vi.fn(() => chain),
      maybeSingle: vi.fn(async () => ({ data: profile, error: null })),
      insert: vi.fn(async (row: unknown) => {
        inserts.push({ table, row });
        return { data: null, error: insertError };
      }),
    };
    return chain;
  });
  const rpc = vi.fn(async () => ({ data: rpcData, error: rpcError }));
  vi.mocked(createClient).mockResolvedValue({ from, rpc } as never);
  return { from, rpc, inserts };
}

describe("social actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthUser).mockResolvedValue(user() as never);
  });

  it("inserts a self profile and does not invent an org row", async () => {
    const { inserts, from } = stub();
    const form = new FormData();
    form.set("handle", "Ada_Lovelace");
    form.set("display_name", "Ada Lovelace");
    form.set("birth_date", "1990-01-02");

    const result = await createSocialProfile(form);
    expect(result).toEqual({});
    expect(inserts).toEqual([
      {
        table: "profiles",
        row: profileInsertRow({
          userId: "u1",
          handle: "ada_lovelace",
          displayName: "Ada Lovelace",
          birthDate: "1990-01-02",
        }),
      },
    ]);
    expect(from).not.toHaveBeenCalledWith("organizations");
    expect(from).not.toHaveBeenCalledWith("memberships");
  });

  it("does not auto-create a profile on a later write", async () => {
    const { inserts } = stub({ profile: null });
    const form = new FormData();
    form.set("body", "hello");
    expect(await createSocialPost(form)).toEqual({ error: SOCIAL.cta.needProfile });

    const like = new FormData();
    like.set("post_id", "p1");
    expect(await toggleSocialLike(like)).toEqual({ error: SOCIAL.cta.needProfile });

    const dm = new FormData();
    dm.set("peer_id", "u2");
    expect(await openSocialDm(dm)).toEqual({ error: SOCIAL.cta.needProfile });
    expect(inserts).toEqual([]);
  });

  it("likes a post for self when a profile exists", async () => {
    const { inserts } = stub({ profile: { id: "u1" } });
    const form = new FormData();
    form.set("post_id", "p1");
    form.set("liked", "0");
    expect(await toggleSocialLike(form)).toEqual({});
    expect(inserts).toEqual([{ table: "likes", row: likeInsertRow("u1", "p1") }]);
  });

  it("opens a DM through the RPC and never inserts conversations", async () => {
    const { from, rpc } = stub({
      profile: { id: "u1" },
      rpcData: "conv-1",
    });
    const form = new FormData();
    form.set("peer_id", "u2");
    await expect(openSocialDm(form)).rejects.toThrow("REDIRECT:/social/dms/conv-1");
    expect(rpc).toHaveBeenCalledWith("open_or_get_direct_conversation", { p_peer: "u2" });
    expect(from).not.toHaveBeenCalledWith("conversations");
    expect(from).not.toHaveBeenCalledWith("conversation_participants");
  });

  it("adds people through the RPC and never inserts participants", async () => {
    const from = vi.fn((table: string) => {
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        in: vi.fn(() => chain),
        maybeSingle: vi.fn(async () => ({ data: { id: "u1" }, error: null })),
        then: (resolve: (value: unknown) => unknown) =>
          Promise.resolve({
            data: table === "profiles" ? [{ id: "u3", handle: "carol" }] : { id: "u1" },
            error: null,
          }).then(resolve),
      };
      return chain;
    });
    const rpc = vi.fn(async () => ({ data: "conv-1", error: null }));
    vi.mocked(createClient).mockResolvedValue({ from, rpc } as never);

    const form = new FormData();
    form.set("conversation_id", "conv-1");
    form.set("handles", "carol");
    expect(await addSocialDmPeople(form)).toEqual({});
    expect(rpc).toHaveBeenCalledWith("add_conversation_participants", {
      p_conversation: "conv-1",
      p_peers: ["u3"],
    });
    expect(from).not.toHaveBeenCalledWith("conversations");
    expect(from).not.toHaveBeenCalledWith("conversation_participants");
  });

  it("quiets a blocked add-people RPC error", async () => {
    const from = vi.fn((table: string) => {
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        in: vi.fn(() => chain),
        maybeSingle: vi.fn(async () => ({ data: { id: "u1" }, error: null })),
        then: (resolve: (value: unknown) => unknown) =>
          Promise.resolve({
            data: table === "profiles" ? [{ id: "u3", handle: "carol" }] : { id: "u1" },
            error: null,
          }).then(resolve),
      };
      return chain;
    });
    const rpc = vi.fn(async () => ({ data: null, error: { message: "blocked" } }));
    vi.mocked(createClient).mockResolvedValue({ from, rpc } as never);

    const form = new FormData();
    form.set("conversation_id", "conv-1");
    form.set("handles", "carol");
    expect(await addSocialDmPeople(form)).toEqual({ error: SOCIAL.dms.addBlocked });
  });

  it("persists image and video keys on posts.media", async () => {
    const author = "11111111-1111-4111-8111-111111111111";
    const object = "22222222-2222-4222-8222-222222222222";
    vi.mocked(getAuthUser).mockResolvedValue({ id: author, email: "ada@example.com" } as never);
    const { inserts } = stub({ profile: { id: author } });
    const media = [
      { kind: "image" as const, key: `posts/${author}/${object}.jpg`, contentType: "image/jpeg" as const },
      { kind: "video" as const, key: `posts/${author}/${object}.mp4`, contentType: "video/mp4" as const },
    ];
    const form = new FormData();
    form.set("body", "with media");
    form.set("media", JSON.stringify(media));
    await expect(createSocialPost(form)).rejects.toThrow("REDIRECT:/social");
    expect(inserts).toEqual([
      {
        table: "posts",
        row: postInsertRow({ authorId: author, body: "with media", media }),
      },
    ]);
  });

  it("rejects title-bucket keys on create", async () => {
    const author = "11111111-1111-4111-8111-111111111111";
    const object = "22222222-2222-4222-8222-222222222222";
    vi.mocked(getAuthUser).mockResolvedValue({ id: author, email: "ada@example.com" } as never);
    const { inserts } = stub({ profile: { id: author } });
    const form = new FormData();
    form.set("body", "nope");
    form.set(
      "media",
      JSON.stringify([
        {
          kind: "video",
          key: `orgs/${author}/titles/${object}/master/clip.mp4`,
          contentType: "video/mp4",
        },
      ]),
    );
    expect(await createSocialPost(form)).toEqual({ error: SOCIAL.home.mediaForbidden });
    expect(inserts).toEqual([]);
  });

  it("presigns a member media PUT and never uses a title key", async () => {
    const author = "11111111-1111-4111-8111-111111111111";
    const object = "22222222-2222-4222-8222-222222222222";
    vi.mocked(getAuthUser).mockResolvedValue({ id: author, email: "ada@example.com" } as never);
    stub({ profile: { id: author } });
    vi.spyOn(crypto, "randomUUID").mockReturnValue(object);
    vi.mocked(presignSocialMediaPut).mockResolvedValue("https://s3.example/put");
    const form = new FormData();
    form.set("content_type", "image/jpeg");
    form.set("byte_length", "1200");
    expect(await presignSocialMediaUpload(form)).toEqual({
      key: `posts/${author}/${object}.jpg`,
      url: "https://s3.example/put",
      kind: "image",
      contentType: "image/jpeg",
    });
    expect(presignSocialMediaPut).toHaveBeenCalledWith(`posts/${author}/${object}.jpg`, "image/jpeg");
  });
});
