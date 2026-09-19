import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/supabase/context";
import { revalidatePath } from "next/cache";
import {
  NOTIFICATION_PREF_DEFAULTS,
  NOTIFICATION_PREFS,
} from "@/lib/notification-prefs";
import { loadOwnNotificationPrefs, saveNotificationPref } from "./actions";

const USER = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", email: "ada@example.com", name: "Ada" };

function ctx() {
  return {
    user: USER,
    rows: [],
    orgs: [],
    activeOrg: null,
    activeRole: null,
    canOperate: true,
    isGcStaff: false,
    unread: Promise.resolve(0),
  };
}

function prefsClient({
  row = null,
  selectError = null,
  upsertError = null,
}: {
  row?: Record<string, unknown> | null;
  selectError?: { message: string } | null;
  upsertError?: { message: string } | null;
} = {}) {
  const maybeSingle = vi.fn(async () => ({ data: row, error: selectError }));
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const upsert = vi.fn(async () => ({ error: upsertError }));
  const from = vi.fn((table: string) => {
    if (table !== "user_notification_preferences") {
      throw new Error(`unexpected from(${table})`);
    }
    return { select, upsert };
  });
  vi.mocked(createClient).mockResolvedValue({ from } as never);
  return { from, select, upsert };
}

describe("notification pref actions", () => {
  beforeEach(() => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    vi.mocked(revalidatePath).mockReset();
  });

  it("loads defaults when no row exists", async () => {
    prefsClient();
    await expect(loadOwnNotificationPrefs()).resolves.toEqual(NOTIFICATION_PREF_DEFAULTS);
  });

  it("loads a stored email-off title-returned cell", async () => {
    prefsClient({ row: { prefs: { title_returned: { email: false } } } });
    const prefs = await loadOwnNotificationPrefs();
    expect(prefs.title_returned.email).toBe(false);
    expect(prefs.title_returned.in_app).toBe(true);
  });

  it("upserts the patched jsonb row for the signed-in user", async () => {
    const client = prefsClient();
    const res = await saveNotificationPref({
      event: "mention",
      channel: "email",
      enabled: true,
    });
    expect(res.error).toBeUndefined();
    expect(res.prefs?.mention.email).toBe(true);
    expect(client.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: USER.id,
        prefs: expect.objectContaining({
          mention: { in_app: true, email: true },
          title_returned: { in_app: true, email: true },
        }),
      }),
      { onConflict: "user_id" },
    );
    expect(revalidatePath).toHaveBeenCalledWith("/settings/preferences");
  });

  it("refuses an invented event and a signed-out write", async () => {
    prefsClient();
    await expect(
      saveNotificationPref({ event: "marketing", channel: "email", enabled: true }),
    ).resolves.toEqual({ error: NOTIFICATION_PREFS.invalid });

    vi.mocked(getOrgContext).mockResolvedValue(null as never);
    await expect(
      saveNotificationPref({ event: "title_queue", channel: "in_app", enabled: false }),
    ).resolves.toEqual({ error: NOTIFICATION_PREFS.signedOut });
  });
});
