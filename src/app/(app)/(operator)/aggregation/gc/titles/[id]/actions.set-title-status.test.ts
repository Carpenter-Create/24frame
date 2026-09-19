import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/auth", () => ({ getAuthUser: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendOrgNotificationEmail: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { revalidatePath } from "next/cache";
import { sendOrgNotificationEmail } from "@/lib/email";
import { AVAILS_HREF } from "@/lib/avails";
import { QUEUE_HREF } from "@/lib/queue";
import { TITLE_STATUS_OVERRIDE } from "@/lib/title-status-override";
import { titleOpsPath } from "@/lib/title-public-id";
import { setGcTitleStatus } from "./actions";

const TITLE_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ORG_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const USER = { id: "staff-1", email: "ops@example.com" };

function fakeSupabase(opts: {
  rpcError?: string;
  title?: { title: string; org_id: string } | null;
  notifyThrows?: boolean;
}) {
  const calls: { name: string; args: Record<string, unknown> }[] = [];
  const rpc = vi.fn(async (name: string, args: Record<string, unknown>) => {
    calls.push({ name, args });
    if (name === "gc_set_title_status" && opts.rpcError) {
      return { data: null, error: { message: opts.rpcError } };
    }
    if (name === "create_notification" && opts.notifyThrows) {
      throw new Error("notify exploded");
    }
    return { data: name === "create_notification" ? "n1" : null, error: null };
  });
  const from = vi.fn((table: string) => {
    if (table !== "titles") throw new Error(`unexpected table ${table}`);
    const row = opts.title === undefined
      ? { title: "Harbor Cut", org_id: ORG_ID }
      : opts.title;
    return {
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: row, error: null }),
        }),
      }),
    };
  });
  return { rpc, from, calls };
}

const actionsSrc = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "actions.ts"),
  "utf8",
);
const reviewSrc = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../review/actions.ts"),
  "utf8",
);

describe("setGcTitleStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthUser).mockResolvedValue(USER);
  });

  it("refuses an empty reason before calling the RPC", async () => {
    const client = fakeSupabase({});
    vi.mocked(createClient).mockResolvedValue(client as never);
    const res = await setGcTitleStatus({
      titleId: TITLE_ID,
      status: "draft",
      reason: "   ",
    });
    expect(res.error).toBe(TITLE_STATUS_OVERRIDE.reasonRequired);
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("refuses an unauthenticated caller", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null);
    const client = fakeSupabase({});
    vi.mocked(createClient).mockResolvedValue(client as never);
    const res = await setGcTitleStatus({
      titleId: TITLE_ID,
      status: "draft",
      reason: "needs stills",
    });
    expect(res.error).toBe("Not authenticated.");
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("calls gc_set_title_status and notifies on draft landing", async () => {
    const client = fakeSupabase({});
    vi.mocked(createClient).mockResolvedValue(client as never);
    const res = await setGcTitleStatus({
      titleId: TITLE_ID,
      status: "draft",
      reason: "needs stills",
    });
    expect(res).toEqual({});
    expect(client.rpc).toHaveBeenCalledWith("gc_set_title_status", {
      p_title_id: TITLE_ID,
      p_status: "draft",
      p_reason: "needs stills",
    });
    expect(client.rpc).toHaveBeenCalledWith(
      "create_notification",
      expect.objectContaining({
        p_org_id: ORG_ID,
        p_kind: "title_rejected",
        p_title: "Title returned for amendment",
        p_body: '"Harbor Cut" was returned for amendment: needs stills',
      }),
    );
    expect(sendOrgNotificationEmail).toHaveBeenCalledWith(
      client,
      ORG_ID,
      expect.objectContaining({
        subject: '"Harbor Cut" was returned for amendment',
        body: '"Harbor Cut" was returned for amendment: needs stills',
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith(titleOpsPath(TITLE_ID));
    expect(revalidatePath).toHaveBeenCalledWith(QUEUE_HREF);
    expect(revalidatePath).toHaveBeenCalledWith(AVAILS_HREF);
  });

  it("notifies on in_review landing and not on in_delivery", async () => {
    const reviewClient = fakeSupabase({});
    vi.mocked(createClient).mockResolvedValue(reviewClient as never);
    await setGcTitleStatus({
      titleId: TITLE_ID,
      status: "in_review",
      reason: "recheck chain",
    });
    expect(reviewClient.rpc).toHaveBeenCalledWith(
      "create_notification",
      expect.objectContaining({
        p_title: "Title needs review",
        p_body: '"Harbor Cut" needs review: recheck chain',
      }),
    );

    vi.clearAllMocks();
    vi.mocked(getAuthUser).mockResolvedValue(USER);
    const readyClient = fakeSupabase({});
    vi.mocked(createClient).mockResolvedValue(readyClient as never);
    await setGcTitleStatus({
      titleId: TITLE_ID,
      status: "in_delivery",
      reason: "ready to deliver",
    });
    expect(readyClient.rpc).toHaveBeenCalledWith("gc_set_title_status", expect.anything());
    expect(readyClient.rpc).not.toHaveBeenCalledWith(
      "create_notification",
      expect.anything(),
    );
    expect(sendOrgNotificationEmail).not.toHaveBeenCalled();
  });

  it("returns the RPC error and still succeeds if notify throws", async () => {
    const errClient = fakeSupabase({ rpcError: "Only GC staff can set title status" });
    vi.mocked(createClient).mockResolvedValue(errClient as never);
    const denied = await setGcTitleStatus({
      titleId: TITLE_ID,
      status: "draft",
      reason: "needs stills",
    });
    expect(denied.error).toBe("Only GC staff can set title status");
    expect(sendOrgNotificationEmail).not.toHaveBeenCalled();

    const notifyClient = fakeSupabase({ notifyThrows: true });
    vi.mocked(createClient).mockResolvedValue(notifyClient as never);
    const ok = await setGcTitleStatus({
      titleId: TITLE_ID,
      status: "draft",
      reason: "needs stills",
    });
    expect(ok).toEqual({});
    expect(revalidatePath).toHaveBeenCalledWith(titleOpsPath(TITLE_ID));
  });

  it("keeps review_title as the review writer — this action is the one RPC path", () => {
    expect(actionsSrc).toContain('rpc("gc_set_title_status"');
    expect(actionsSrc).toContain("titleStatusOverrideShouldNotify");
    expect(actionsSrc).not.toContain("review_title");
    expect(reviewSrc).toContain("review_title");
    expect(reviewSrc).not.toContain("gc_set_title_status");
  });
});
