import { beforeEach, describe, expect, it, vi } from "vitest";

import AggregationRootPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));

describe("Aggregation root", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends `/` to Dashboard", async () => {
    await expect(Promise.resolve(AggregationRootPage())).rejects.toThrow("REDIRECT:/dashboard");
  });
});
