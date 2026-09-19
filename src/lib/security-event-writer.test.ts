import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

import { createAdminClient } from "@/lib/supabase/admin";
import { recordSecurityEvent, toInetOrNull } from "./security-event-writer";

const ORG = "22222222-2222-4222-8222-222222222222";
const USER = "11111111-1111-4111-8111-111111111111";

function fakeAdmin() {
  const insert = vi.fn(async () => ({ error: null }));
  const from = vi.fn(() => ({ insert }));
  vi.mocked(createAdminClient).mockReturnValue({ from } as never);
  return { insert };
}

describe("toInetOrNull", () => {
  it("keeps a valid IPv4 or IPv6", () => {
    expect(toInetOrNull("203.0.113.10")).toBe("203.0.113.10");
    expect(toInetOrNull("2001:db8::1")).toBe("2001:db8::1");
  });

  it("takes the first forwarded hop", () => {
    expect(toInetOrNull("203.0.113.10, 10.0.0.1")).toBe("203.0.113.10");
  });

  it("drops empty, unknown, and other non-inet values", () => {
    expect(toInetOrNull("")).toBeNull();
    expect(toInetOrNull("   ")).toBeNull();
    expect(toInetOrNull("unknown")).toBeNull();
    expect(toInetOrNull(null)).toBeNull();
    expect(toInetOrNull(undefined)).toBeNull();
    expect(toInetOrNull(", 10.0.0.1")).toBeNull();
  });
});

describe("recordSecurityEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts a null ip when the forwarded value is not an inet", async () => {
    const { insert } = fakeAdmin();
    await recordSecurityEvent({
      orgId: ORG,
      actorUserId: USER,
      eventKind: "sign_in",
      ip: "unknown",
      userAgent: null,
    });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: ORG,
        actor_user_id: USER,
        event_kind: "sign_in",
        ip: null,
      }),
    );
  });

  it("inserts a sanitized first-hop ip", async () => {
    const { insert } = fakeAdmin();
    await recordSecurityEvent({
      orgId: ORG,
      actorUserId: USER,
      eventKind: "sign_out",
      ip: "203.0.113.10, 10.0.0.1",
      userAgent: null,
    });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ ip: "203.0.113.10" }));
  });
});
