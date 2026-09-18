import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/news-ingest", () => ({ ingestNewsFeeds: vi.fn() }));

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
});

afterEach(() => {
  delete process.env.CRON_SECRET;
});

describe("GET /api/cron/news-ingest", () => {
  it("refuses without the cron secret and never ingests", async () => {
    const res = await GET(req());
    expect(res.status).toBe(401);
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(ingestNewsFeeds).not.toHaveBeenCalled();
  });

  it("returns 207 when some sources fail and 200 when none do", async () => {
    vi.mocked(createAdminClient).mockReturnValue({} as never);
    vi.mocked(ingestNewsFeeds).mockResolvedValue({
      sources: 11,
      fetched: 10,
      inserted: 4,
      failed: 1,
      results: [],
    });

    const partial = await GET(req({ Authorization: `Bearer ${SECRET}` }));
    expect(partial.status).toBe(207);
    expect(await partial.json()).toMatchObject({ failed: 1, inserted: 4 });

    vi.mocked(ingestNewsFeeds).mockResolvedValue({
      sources: 11,
      fetched: 11,
      inserted: 5,
      failed: 0,
      results: [],
    });
    const ok = await GET(req({ Authorization: `Bearer ${SECRET}` }));
    expect(ok.status).toBe(200);
  });
});
