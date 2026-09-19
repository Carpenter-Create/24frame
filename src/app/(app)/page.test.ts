import { beforeEach, describe, expect, it, vi } from "vitest";

import SignedInRootPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));

describe("signed-in root", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends `/` to /home", () => {
    expect(() => SignedInRootPage()).toThrow("REDIRECT:/home");
  });
});
