import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getClaims: async () => ({ data: null }),
    },
  }),
}));

import { middleware, config } from "@/middleware";

function request(path: string) {
  return new NextRequest(`http://localhost${path}`);
}

async function redirectsToLogin(path: string): Promise<boolean> {
  const res = await middleware(request(path));
  const location = res.headers.get("location");
  if (!location) return false;
  return new URL(location).pathname === "/login";
}

describe("web app manifest session gate", () => {
  it("does not redirect an unauthenticated manifest fetch to /login", async () => {
    expect(await redirectsToLogin("/manifest.webmanifest")).toBe(false);

    const matcher = config.matcher.join("\n");
    expect(matcher).toContain("manifest.webmanifest");
  });

  it("keeps nearby paths session-gated", async () => {
    expect(await redirectsToLogin("/manifest.json")).toBe(true);
    expect(await redirectsToLogin("/manifest.webmanifest/extra")).toBe(true);
    expect(await redirectsToLogin("/social")).toBe(true);
  });
});
