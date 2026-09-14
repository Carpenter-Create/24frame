import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/auth", () => ({ getAuthUser: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { markAllNotificationsRead, markNotificationsRead } from "./actions";

const USER = { id: "u1", email: "ops@example.com" };

function stubRpc() {
  const rpc = vi.fn(async () => ({ data: null, error: null }));
  vi.mocked(createClient).mockResolvedValue({ rpc } as never);
  return rpc;
}

describe("mark notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthUser).mockResolvedValue(USER as never);
  });

  it("marks one id through mark_notifications_read", async () => {
    const rpc = stubRpc();
    await expect(markNotificationsRead(["n1"])).resolves.toEqual({});
    expect(rpc).toHaveBeenCalledWith("mark_notifications_read", { p_ids: ["n1"] });
    expect(rpc).not.toHaveBeenCalledWith("mark_all_notifications_read");
  });

  it("mark all does not send the visible page of ids", async () => {
    const rpc = stubRpc();
    await expect(markAllNotificationsRead()).resolves.toEqual({});
    expect(rpc).toHaveBeenCalledWith("mark_all_notifications_read");
    expect(rpc).not.toHaveBeenCalledWith("mark_notifications_read", expect.anything());
  });

  it("writes nothing when there is no session", async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null as never);
    const rpc = stubRpc();
    await expect(markAllNotificationsRead()).resolves.toEqual({ error: "Not authenticated." });
    expect(rpc).not.toHaveBeenCalled();
  });
});
