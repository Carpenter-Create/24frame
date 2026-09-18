import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { likeInsertRow, postInsertRow, profileInsertRow, SOCIAL } from "@/lib/social";
import {
  addSocialDmPeople,
  createSocialPost,
  sendSocialDm,
  createSocialProfile,
  createSocialStory,
  openSocialDm,
  presignSocialMediaUpload,
  toggleSocialLike,
  updateSocialBio,
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
  insertErrors = [],
  updateError = null,
  rpcError = null,
  rpcData = null,
}: {
  profile?: { id: string; handle?: string; display_name?: string; status?: string; bio?: string | null } | null;
  insertError?: { message: string; code?: string } | null;
  insertErrors?: Array<{ message: string; code?: string } | null>;
  updateError?: { message: string; code?: string } | null;
  rpcError?: { message: string } | null;
  rpcData?: unknown;
} = {}) {
  const inserts: { table: string; row: unknown }[] = [];
  const updates: { table: string; row: unknown }[] = [];
  let insertIndex = 0;
  const from = vi.fn((table: string) => {
    const chain: Record<string, unknown> = {};
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
    chain.delete = vi.fn(() => chain);
    chain.maybeSingle = vi.fn(async () => ({ data: profile, error: null }));
    chain.insert = vi.fn(async (row: unknown) => {
      inserts.push({ table, row });
      const error = insertErrors[insertIndex] ?? insertError ?? null;
      insertIndex += 1;
      return { data: null, error };
    });
    chain.update = vi.fn((row: unknown) => {
      updates.push({ table, row });
      return chain;
    });
    chain.then = (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data: null, error: updateError }).then(resolve);
    return chain;
  });
  const rpc = vi.fn(async () => ({ data: rpcData, error: rpcError }));
  vi.mocked(createClient).mockResolvedValue({ from, rpc } as never);
  return { from, rpc, inserts, updates };
}

describe("social actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthUser).mockResolvedValue(user() as never);
  });

  it("saves a bare handle on the ensured self row and does not invent an org row", async () => {
    const { inserts, updates, from } = stub();
    const form = new FormData();
    form.set("handle", "@Ada_Lovelace");
    form.set("display_name", "Ada Lovelace");

    const result = await createSocialProfile(form);
    expect(result).toEqual({});
    expect(inserts).toEqual([
      {
        table: "profiles",
        row: profileInsertRow({
          userId: "u1",
          handle: "ada",
          displayName: "Member",
        }),
      },
    ]);
    expect(updates).toEqual([
      {
        table: "profiles",
        row: { handle: "ada_lovelace", display_name: "Ada Lovelace" },
      },
    ]);
    expect(from).not.toHaveBeenCalledWith("organizations");
    expect(from).not.toHaveBeenCalledWith("memberships");
  });

  it("rejects a blank handle after stripping @", async () => {
    stub({
      profile: { id: "u1", handle: "ada", display_name: "Ada Lovelace", status: "active" },
    });
    const form = new FormData();
    form.set("handle", "@@@");
    expect(await createSocialProfile(form)).toEqual({ error: SOCIAL.profile.handleRequired });
    expect(SOCIAL.profile.handleRequired).toBe("Handle is required");
  });

  it("rejects a blank handle when ensure cannot insert a row", async () => {
    const { inserts } = stub({
      insertError: { message: "null value in column birth_date", code: "23502" },
    });
    const form = new FormData();
    form.set("handle", "@");
    expect(await createSocialProfile(form)).toEqual({ error: SOCIAL.profile.handleRequired });
    expect(inserts).toEqual([]);
  });

  it("inserts the submitted handle when ensure cannot create the row", async () => {
    const { inserts, updates } = stub({
      insertErrors: [
        { message: "null value in column birth_date", code: "23502" },
        { message: "null value in column birth_date", code: "23502" },
        null,
      ],
    });
    const form = new FormData();
    form.set("handle", "@Ada_Lovelace");
    form.set("display_name", "Ada Lovelace");
    expect(await createSocialProfile(form)).toEqual({});
    expect(inserts).toHaveLength(3);
    expect(inserts[2]).toEqual({
      table: "profiles",
      row: profileInsertRow({
        userId: "u1",
        handle: "ada_lovelace",
        displayName: "Ada Lovelace",
      }),
    });
    expect(inserts[0].row).not.toHaveProperty("birth_date");
    expect(inserts[2].row).not.toHaveProperty("birth_date");
    expect(updates).toEqual([]);
  });

  it("ensures a self profile on the first Social write and then posts", async () => {
    const { inserts } = stub({ profile: null });
    const form = new FormData();
    form.set("body", "hello");
    await expect(createSocialPost(form)).rejects.toThrow("REDIRECT:/social");
    expect(inserts).toEqual([
      {
        table: "profiles",
        row: profileInsertRow({
          userId: "u1",
          handle: "ada",
          displayName: "Member",
        }),
      },
      {
        table: "posts",
        row: postInsertRow({ authorId: "u1", body: "hello" }),
      },
    ]);
  });

  it("ensures a self profile before a story write", async () => {
    const author = "11111111-1111-4111-8111-111111111111";
    vi.mocked(getAuthUser).mockResolvedValue({ id: author, email: "ada@example.com" } as never);
    const { inserts } = stub({ profile: null });
    const object = "22222222-2222-4222-8222-222222222222";
    const media = [
      { kind: "video" as const, key: `stories/${author}/${object}.mp4`, contentType: "video/mp4" as const },
    ];
    const form = new FormData();
    form.set("media", JSON.stringify(media));
    expect(await createSocialStory(form)).toEqual({});
    expect(inserts[0]).toEqual({
      table: "profiles",
      row: profileInsertRow({
        userId: author,
        handle: "ada",
        displayName: "Member",
      }),
    });
    expect(inserts[1]).toMatchObject({
      table: "stories",
      row: {
        author_id: author,
        body: null,
        media,
        status: "active",
      },
    });
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

  it("sends a DM and returns to the latest thread path", async () => {
    stub({ profile: { id: "u1" } });
    const form = new FormData();
    form.set("conversation_id", "conv-1");
    form.set("body", "hello");
    await expect(sendSocialDm(form)).rejects.toThrow("REDIRECT:/social/dms/conv-1");
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

  it("refuses an oversized add-people batch before the RPC", async () => {
    const rpc = vi.fn();
    const from = vi.fn((table: string) => {
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        in: vi.fn(() => chain),
        maybeSingle: vi.fn(async () => ({ data: { id: "u1" }, error: null })),
        then: (resolve: (value: unknown) => unknown) =>
          Promise.resolve({
            data: table === "profiles" ? [{ id: "u1" }] : { id: "u1" },
            error: null,
          }).then(resolve),
      };
      return chain;
    });
    vi.mocked(createClient).mockResolvedValue({ from, rpc } as never);

    const form = new FormData();
    form.set("conversation_id", "conv-1");
    form.set("handles", Array.from({ length: 33 }, (_, i) => `peer${i}`).join(" "));
    expect(await addSocialDmPeople(form)).toEqual({ error: SOCIAL.dms.addBatch });
    expect(rpc).not.toHaveBeenCalled();
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

  it("rejects another author's media key on create", async () => {
    const author = "11111111-1111-4111-8111-111111111111";
    const other = "33333333-3333-4333-8333-333333333333";
    const object = "22222222-2222-4222-8222-222222222222";
    vi.mocked(getAuthUser).mockResolvedValue({ id: author, email: "ada@example.com" } as never);
    const { inserts } = stub({ profile: { id: author } });
    const postForm = new FormData();
    postForm.set("body", "nope");
    postForm.set(
      "media",
      JSON.stringify([{ kind: "image", key: `posts/${other}/${object}.jpg`, contentType: "image/jpeg" }]),
    );
    expect(await createSocialPost(postForm)).toEqual({ error: SOCIAL.home.mediaForbidden });
    const storyForm = new FormData();
    storyForm.set(
      "media",
      JSON.stringify([{ kind: "video", key: `stories/${other}/${object}.mp4`, contentType: "video/mp4" }]),
    );
    expect(await createSocialStory(storyForm)).toEqual({ error: SOCIAL.home.mediaForbidden });
    expect(inserts).toEqual([]);
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

  it("rejects image kinds on story create and stories-lane presign", async () => {
    const author = "11111111-1111-4111-8111-111111111111";
    const object = "22222222-2222-4222-8222-222222222222";
    vi.mocked(getAuthUser).mockResolvedValue({ id: author, email: "ada@example.com" } as never);
    const { inserts } = stub({ profile: { id: author } });
    const form = new FormData();
    form.set(
      "media",
      JSON.stringify([
        { kind: "image", key: `stories/${author}/${object}.jpg`, contentType: "image/jpeg" },
      ]),
    );
    expect(await createSocialStory(form)).toEqual({ error: SOCIAL.stories.mediaType });
    expect(inserts).toEqual([]);

    vi.spyOn(crypto, "randomUUID").mockReturnValue(object);
    const imageSign = new FormData();
    imageSign.set("content_type", "image/jpeg");
    imageSign.set("byte_length", "1200");
    imageSign.set("lane", "stories");
    expect(await presignSocialMediaUpload(imageSign)).toEqual({ error: SOCIAL.stories.mediaType });
    expect(presignSocialMediaPut).not.toHaveBeenCalled();

    vi.mocked(presignSocialMediaPut).mockResolvedValue("https://s3.example/put");
    const videoSign = new FormData();
    videoSign.set("content_type", "video/mp4");
    videoSign.set("byte_length", "1200");
    videoSign.set("lane", "stories");
    expect(await presignSocialMediaUpload(videoSign)).toEqual({
      key: `stories/${author}/${object}.mp4`,
      url: "https://s3.example/put",
      kind: "video",
      contentType: "video/mp4",
    });
    expect(presignSocialMediaPut).toHaveBeenCalledWith(`stories/${author}/${object}.mp4`, "video/mp4");
  });

  it("stores bio newlines and counts them toward 150", async () => {
    const { updates } = stub({
      profile: { id: "u1", handle: "ada", display_name: "Ada Lovelace", status: "active" },
    });
    const form = new FormData();
    form.set("bio", "Founder\nInvestor");
    expect(await updateSocialBio(form)).toEqual({});
    expect(updates).toEqual([{ table: "profiles", row: { bio: "Founder\nInvestor" } }]);
  });

  it("rejects a bio over 150 including newlines", async () => {
    stub({
      profile: { id: "u1", handle: "ada", display_name: "Ada Lovelace", status: "active" },
    });
    const form = new FormData();
    form.set("bio", `a\n${"b".repeat(149)}`);
    expect(await updateSocialBio(form)).toEqual({ error: SOCIAL.profile.bioLimit });
  });
});
