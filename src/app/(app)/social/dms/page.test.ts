import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { signedAvatarUrls } from "@/lib/s3-avatars";
import { SOCIAL } from "@/lib/social";
import SocialDmsPage from "./page";
import SocialDmThreadPage from "./[id]/page";

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
vi.mock("../actions", () => ({
  addSocialDmPeople: vi.fn(),
  sendSocialDm: vi.fn(),
  setSocialDmTitle: vi.fn(),
  markSocialDmRead: vi.fn(),
}));
vi.mock("@/app/(app)/social/actions", () => ({
  addSocialDmPeople: vi.fn(),
  sendSocialDm: vi.fn(),
  setSocialDmTitle: vi.fn(),
  markSocialDmRead: vi.fn(),
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

function chain(result: unknown) {
  const c: Record<string, unknown> = {};
  const self = () => c;
  c.select = vi.fn(self);
  c.eq = vi.fn(self);
  c.in = vi.fn(self);
  c.is = vi.fn(self);
  c.or = vi.fn(self);
  c.order = vi.fn(self);
  c.range = vi.fn(async () => ({ data: result, error: null }));
  c.maybeSingle = vi.fn(async () => ({
    data: Array.isArray(result) ? (result[0] ?? null) : result,
    error: null,
  }));
  c.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve({ data: result, error: null }).then(resolve);
  return c;
}

describe("social DMs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    vi.mocked(signedAvatarUrls).mockResolvedValue(new Map());
  });

  it("lists a group room with initials when faces are missing", async () => {
    const from = vi.fn((table: string) => {
      if (table === "profiles") {
        return chain([
          { id: "u1", handle: "ada", display_name: "Ada Lovelace", status: "active" },
          { id: "u2", handle: "bob", display_name: "Bob One", status: "active" },
          { id: "u3", handle: "carol", display_name: "Carol One", status: "active" },
        ]);
      }
      throw new Error(`unexpected from(${table})`);
    });
    const rpc = vi.fn(async () => ({
      data: [
        {
          conversation_id: "c-group",
          last_message_at: "2026-09-12T14:00:00.000Z",
          unread_count: 1,
          muted: false,
          peer_id: null,
          kind: "group",
          title: null,
          participant_ids: ["u2", "u3"],
        },
      ],
      error: null,
    }));
    vi.mocked(createClient).mockResolvedValue({ from, rpc } as never);

    const html = renderToStaticMarkup(await SocialDmsPage());
    expect(html).toContain("data-social-dms");
    expect(html).toContain('data-social-dm-kind="group"');
    expect(html).toContain("Bob One, Carol One");
    expect(html).toContain("data-social-conversation-faces");
    expect(html).toContain("BO");
    expect(html).toContain("CO");
    expect(html).toContain("1 unread");
    expect(html).toContain(SOCIAL.dms.subtitle);
    expect(html).toContain("24Frame");
    expect(rpc).toHaveBeenCalledWith("get_dm_inbox", { p_limit: 51 });
    expect(html).not.toContain("data-social-dms-truncated");
  });

  it("names the inbox bound when the probe row comes back", async () => {
    const rpc = vi.fn(async () => ({
      data: Array.from({ length: 51 }, (_, i) => ({
        conversation_id: `c${i}`,
        last_message_at: "2026-09-14T14:00:00.000Z",
        unread_count: 0,
        muted: false,
        peer_id: "u2",
        kind: "direct",
        title: null,
        participant_ids: ["u2"],
      })),
      error: null,
    }));
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return chain([{ id: "u2", handle: "bob", display_name: "Bob One", status: "active" }]);
        }
        throw new Error(`unexpected from(${table})`);
      }),
      rpc,
    } as never);

    const html = renderToStaticMarkup(await SocialDmsPage());
    expect(html).toContain("data-social-dms-truncated");
    expect(html).toContain(SOCIAL.dms.truncatedInbox);
    expect(html).toContain("c49");
    expect(html).not.toContain('href="/social/dms/c50"');
  });

  it("opens a group thread and shows add-people, not a missing room", async () => {
    const from = vi.fn((table: string) => {
      if (table === "profiles") {
        return chain([
          { id: "u1", handle: "ada", display_name: "Ada Lovelace", status: "active" },
          { id: "u2", handle: "bob", display_name: "Bob One", status: "active" },
          { id: "u3", handle: "carol", display_name: "Carol One", status: "active" },
        ]);
      }
      if (table === "conversations") {
        return chain({ id: "c-group", kind: "group", title: null });
      }
      if (table === "messages") {
        return chain([
          {
            id: "m1",
            body: "prior hello",
            sender_id: "u1",
            created_at: "2026-09-12T14:00:00.000Z",
            status: "active",
          },
        ]);
      }
      if (table === "conversation_participants") {
        return chain([
          { user_id: "u1", left_at: null },
          { user_id: "u2", left_at: null },
          { user_id: "u3", left_at: null },
        ]);
      }
      throw new Error(`unexpected from(${table})`);
    });
    vi.mocked(createClient).mockResolvedValue({ from, rpc: vi.fn() } as never);

    const html = renderToStaticMarkup(await SocialDmThreadPage({ params: Promise.resolve({ id: "c-group" }) }));
    expect(html).toContain("data-social-dm-thread");
    expect(html).toContain('data-social-dm-kind="group"');
    expect(html).toContain("Bob One, Carol One");
    expect(html).toContain("prior hello");
    expect(html).toContain("data-social-add-people");
    expect(html).toContain(SOCIAL.dms.addPeople);
    expect(html).toContain("data-social-group-title");
    expect(html).toContain("AL");
    expect(html).not.toContain("data-social-dm-missing");
    expect(html).not.toContain("min_level");
    expect(html).not.toContain("data-social-dm-thread-truncated");
    expect(html).toContain("data-social-dm-form");
    expect(html).not.toContain("data-social-dm-older-page");
  });

  it("names the thread bound and offers older messages", async () => {
    const { SOCIAL_DM_THREAD_LIMIT, encodeDmThreadCursor } = await import("@/lib/social-dm-bounds");
    const messages = Array.from({ length: SOCIAL_DM_THREAD_LIMIT + 1 }, (_, i) => ({
      id: `11111111-1111-4111-8111-${String(i).padStart(12, "0")}`,
      body: `m${i}`,
      sender_id: "u1",
      created_at: `2026-09-14T14:00:${String(i).padStart(2, "0")}.000Z`,
      status: "active",
    }));
    const from = vi.fn((table: string) => {
      if (table === "profiles") {
        return chain([{ id: "u1", handle: "ada", display_name: "Ada Lovelace", status: "active" }]);
      }
      if (table === "conversations") {
        return chain({ id: "c-group", kind: "group", title: null });
      }
      if (table === "messages") return chain(messages);
      if (table === "conversation_participants") {
        return chain([{ user_id: "u1", left_at: null }]);
      }
      throw new Error(`unexpected from(${table})`);
    });
    vi.mocked(createClient).mockResolvedValue({ from, rpc: vi.fn() } as never);

    const html = renderToStaticMarkup(await SocialDmThreadPage({ params: Promise.resolve({ id: "c-group" }) }));
    expect(html).toContain("data-social-dm-thread-truncated");
    expect(html).toContain(SOCIAL.dms.truncatedThread);
    expect(html).toContain("data-social-dm-older");
    expect(html).toContain(SOCIAL.dms.olderMessages);
    expect(html).toContain("before=");
    expect(html).toContain(encodeURIComponent(encodeDmThreadCursor(messages[SOCIAL_DM_THREAD_LIMIT - 1]!)));
    expect(html).toContain("m0");
    expect(html).not.toContain(">m50<");
    expect(html).toContain("data-social-dm-form");
  });

  it("names an older page that is not truncated and does not mount compose", async () => {
    const { encodeDmThreadCursor } = await import("@/lib/social-dm-bounds");
    const older = {
      id: "11111111-1111-4111-8111-000000000001",
      created_at: "2026-09-01T12:00:00.000Z",
    };
    const from = vi.fn((table: string) => {
      if (table === "profiles") {
        return chain([{ id: "u1", handle: "ada", display_name: "Ada Lovelace", status: "active" }]);
      }
      if (table === "conversations") {
        return chain({ id: "c-group", kind: "group", title: null });
      }
      if (table === "messages") {
        return chain([
          {
            id: older.id,
            body: "ancient hello",
            sender_id: "u1",
            created_at: older.created_at,
            status: "active",
          },
        ]);
      }
      if (table === "conversation_participants") {
        return chain([{ user_id: "u1", left_at: null }]);
      }
      throw new Error(`unexpected from(${table})`);
    });
    vi.mocked(createClient).mockResolvedValue({ from, rpc: vi.fn() } as never);

    const html = renderToStaticMarkup(
      await SocialDmThreadPage({
        params: Promise.resolve({ id: "c-group" }),
        searchParams: Promise.resolve({ before: encodeDmThreadCursor(older) }),
      }),
    );
    expect(html).toContain("data-social-dm-older-page");
    expect(html).toContain(SOCIAL.dms.olderPage);
    expect(html).toContain("data-social-dm-latest");
    expect(html).toContain(SOCIAL.dms.latestMessages);
    expect(html).toContain("ancient hello");
    expect(html).not.toContain("data-social-dm-form");
    expect(html).not.toContain("data-social-dm-thread-truncated");
  });

  it("does not touch gated community group create fields", () => {
    const inbox = readFileSync("src/app/(app)/social/dms/page.tsx", "utf8");
    const thread = readFileSync("src/app/(app)/social/dms/[id]/page.tsx", "utf8");
    const groups = readFileSync("src/app/(app)/social/groups/new/page.tsx", "utf8");
    expect(inbox).not.toContain("min_level");
    expect(thread).not.toContain("min_level");
    expect(thread).not.toContain("kind !== \"direct\"");
    expect(groups).toContain("has_capability");
    expect(groups).toContain("create_group");
  });
});
