import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/s3-title-purge", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/s3-title-purge")>();
  return {
    ...actual,
    purgeDeletedTitleStorage: vi.fn(),
  };
});

import { createAdminClient } from "@/lib/supabase/admin";
import { purgeDeletedTitleStorage } from "@/lib/s3-title-purge";
import { GET } from "./route";

const SECRET = "test-cron-secret-value";
const ORG = "550e8400-e29b-41d4-a716-446655440000";
const TITLE = "11111111-2222-4333-8444-555555555555";

function req(headers: Record<string, string> = {}) {
  return new Request("http://test/api/cron/title-s3-purge", { headers });
}

function fakeSupabase(rows: { id: string; org_id: string }[], selectError: string | null = null) {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "not", "is", "order"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.range = vi.fn(async () =>
    selectError ? { data: null, error: { message: selectError } } : { data: rows, error: null },
  );
  const from = vi.fn((table: string) => {
    if (table !== "titles") throw new Error(`unexpected table ${table}`);
    return builder;
  });
  const rpc = vi.fn(async () => ({ data: null, error: null }));
  return { from, rpc, builder };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = SECRET;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.CRON_SECRET;
  vi.restoreAllMocks();
});

describe("GET /api/cron/title-s3-purge", () => {
  it("refuses without the cron secret and never reads titles", async () => {
    const supabase = fakeSupabase([]);
    vi.mocked(createAdminClient).mockReturnValue(
      supabase as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await GET(req());
    expect(res.status).toBe(401);
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(purgeDeletedTitleStorage).not.toHaveBeenCalled();
  });

  it("is a no-op when every deleted title is already marked purged", async () => {
    const supabase = fakeSupabase([]);
    vi.mocked(createAdminClient).mockReturnValue(
      supabase as unknown as ReturnType<typeof createAdminClient>,
    );

    const res = await GET(req({ Authorization: `Bearer ${SECRET}` }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ attempted: 0, purged: 0, failed: 0 });
    expect(purgeDeletedTitleStorage).not.toHaveBeenCalled();
  });

  it("runs the shared purge helper for each pending deleted title", async () => {
    const supabase = fakeSupabase([{ id: TITLE, org_id: ORG }]);
    vi.mocked(createAdminClient).mockReturnValue(
      supabase as unknown as ReturnType<typeof createAdminClient>,
    );
    vi.mocked(purgeDeletedTitleStorage).mockResolvedValue({ prefix: "p/", deleted: 3 });

    const res = await GET(req({ Authorization: `Bearer ${SECRET}` }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ attempted: 1, purged: 1, failed: 0 });
    expect(purgeDeletedTitleStorage).toHaveBeenCalledTimes(1);
    expect(vi.mocked(purgeDeletedTitleStorage).mock.calls[0][0]).toEqual(
      expect.objectContaining({ orgId: ORG, titleId: TITLE }),
    );
  });
});
