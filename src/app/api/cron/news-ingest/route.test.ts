import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/news-ingest", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/news-ingest")>();
  return {
    ...actual,
    ingestNewsFeeds: vi.fn(),
    supabaseNewsPersist: vi.fn(() => ({ kind: "persist" })),
  };
});

import { createAdminClient } from "@/lib/supabase/admin";
import { ingestNewsFeeds } from "@/lib/news-ingest";
import { GET } from "./route";

const SECRET = "test-cron-secret-value";

function req(headers: Record<string, string> = {}) {
  return new Request("http://test/api/cron/news-ingest", { headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = SECRET;
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.CRON_SECRET;
  vi.restoreAllMocks();
});

describe("GET /api/cron/news-ingest", () => {
  it("refuses without the cron secret and never opens a client", async () => {
    const res = await GET(req());
    expect(res.status).toBe(401);
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(ingestNewsFeeds).not.toHaveBeenCalled();
  });

  it("unset CRON_SECRET refuses even with a header present", async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(req({ Authorization: `Bearer ${SECRET}` }));
    expect(res.status).toBe(401);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("runs ingest with the service-role persist when authorized", async () => {
    vi.mocked(createAdminClient).mockReturnValue({} as never);
    vi.mocked(ingestNewsFeeds).mockResolvedValue({
      sources: 11,
      fetched: 4,
      inserted: 4,
      failed: 0,
      skipped: 0,
      purged: 1,
      results: [],
    });

    const res = await GET(req({ Authorization: `Bearer ${SECRET}` }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      fetched: 4,
      inserted: 4,
      failed: 0,
      skipped: 0,
      purged: 1,
    });
    expect(ingestNewsFeeds).toHaveBeenCalledTimes(1);
  });
});
