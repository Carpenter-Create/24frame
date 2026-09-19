import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CO_PRODUCTIONS_PAGE } from "@/lib/co-productions";
import { getOrgContext } from "@/lib/supabase/context";
import CoProductionsPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));

function ctx() {
  return {
    user: { id: "u1", email: "ada@example.com" },
    rows: [],
    orgs: [],
    activeOrg: null,
    activeRole: null,
    canOperate: false,
    isGcStaff: false,
    unread: Promise.resolve(0),
  };
}

describe("CoProductionsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
  });

  it("redirects unsigned visitors", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(null);
    await expect(CoProductionsPage()).rejects.toThrow("REDIRECT:/login");
  });

  it("renders the house empty stub from lib copy — no form, no dead CTA", async () => {
    const html = renderToStaticMarkup(createElement(await CoProductionsPage()));
    expect(html).toContain(CO_PRODUCTIONS_PAGE.title);
    expect(html).toContain(CO_PRODUCTIONS_PAGE.synopsis);
    expect(html).toContain("border-dashed");
    expect(html).not.toContain("<form");
    expect(html).not.toContain("Inquire");
    expect(html).not.toContain("coming soon");
    expect(html).not.toContain("<button");
  });
});
