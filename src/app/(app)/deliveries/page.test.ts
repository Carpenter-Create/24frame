import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createClient } from "@/lib/supabase/server";
import { DELIVERIES_NO_DATA, DELIVERIES_TRUNCATED } from "@/lib/deliveries-browse";
import { UNPAGINATED_MAX } from "@/lib/list-bounds";
import DeliveriesPage from "./page";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const ROW = {
  delivery_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  title_id: "11111111-1111-4111-8111-111111111111",
  title: "Winter Light",
  vendor_name: "Endpoint",
  territory: "US",
  status: "live",
  updated_at: "2026-09-01T00:00:00.000Z",
};

function stubRpc(data: unknown[]) {
  const rpc = vi.fn(async () => ({ data, error: null }));
  vi.mocked(createClient).mockResolvedValue({ rpc } as never);
  return { rpc };
}

describe("DeliveriesPage bounds", () => {
  beforeEach(() => vi.clearAllMocks());

  it("probes one row past the cap so truncation can be detected", async () => {
    const { rpc } = stubRpc([]);
    await DeliveriesPage({ searchParams: Promise.resolve({}) });
    expect(rpc).toHaveBeenCalledWith("my_deliveries", { p_limit: UNPAGINATED_MAX + 1 });
  });

  it("renders no truncated state when the list is short", async () => {
    stubRpc([ROW]);
    const html = renderToStaticMarkup(
      await DeliveriesPage({ searchParams: Promise.resolve({}) }),
    );
    expect(html).toContain("Winter Light");
    expect(html).not.toContain('data-my-list-truncated="deliveries"');
    expect(html).not.toContain(DELIVERIES_TRUNCATED);
  });

  it("surfaces an honest notice when the probe overflows", async () => {
    const rows = Array.from({ length: UNPAGINATED_MAX + 1 }, (_, i) => ({
      ...ROW,
      delivery_id: `aaaaaaaa-aaaa-4aaa-8aaa-${String(i).padStart(12, "0")}`,
    }));
    stubRpc(rows);
    const html = renderToStaticMarkup(
      await DeliveriesPage({ searchParams: Promise.resolve({}) }),
    );
    expect(html).toContain('data-my-list-truncated="deliveries"');
    expect(html).toContain(DELIVERIES_TRUNCATED);
    expect(html).not.toContain(DELIVERIES_NO_DATA.title);
  });
});
