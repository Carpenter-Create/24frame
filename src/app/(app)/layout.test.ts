import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import AppLayout from "./layout";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: () => undefined })),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/org-tier", () => ({ getActiveOrgTier: vi.fn(async () => null) }));
vi.mock("@/components/chrome/app-shell", () => ({ AppShell: () => null }));

type Status = "registered" | "awaiting_payment" | "active";

function ctx({ isGcStaff, orgStatus }: { isGcStaff: boolean; orgStatus: Status | null }) {
  const org = orgStatus ? { id: "org-1", name: "Acme", status: orgStatus } : null;
  return {
    user: { id: "u1", email: "someone@example.com" },
    rows: org ? [{ role: "account_owner", organizations: org }] : [],
    orgs: org ? [{ id: org.id, name: org.name }] : [],
    activeOrg: org,
    activeRole: org ? "account_owner" : null,
    canOperate: !!org,
    isGcStaff,
    unread: Promise.resolve(0),
  };
}

/**
 * Mid-onboarding still bounces non-staff clients. Mapping C: a signed-in account
 * with zero orgs keeps the shell so Social is reachable. Staff with no client org
 * already used this shell. Mid-onboarding still must not loop staff into the wizard.
 */
describe("AppLayout onboarding gates", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not bounce GC staff whose client org is mid-onboarding", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: true, orgStatus: "registered" }) as never,
    );
    await expect(AppLayout({ children: "page" })).resolves.toBeTruthy();
  });

  it("still bounces a non-GC client whose org is mid-onboarding", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: false, orgStatus: "registered" }) as never,
    );
    await expect(AppLayout({ children: "page" })).rejects.toThrow("REDIRECT:/onboarding");
  });

  it("renders the shell for GC staff with no client org at all", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: true, orgStatus: null }) as never,
    );
    await expect(AppLayout({ children: "page" })).resolves.toBeTruthy();
  });

  it("renders the shell for a signed-in user with no org so Social is reachable", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: false, orgStatus: null }) as never,
    );
    await expect(AppLayout({ children: "page" })).resolves.toBeTruthy();
  });

  it("renders for an ordinary client whose org is active", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: false, orgStatus: "active" }) as never,
    );
    await expect(AppLayout({ children: "page" })).resolves.toBeTruthy();
  });

  it("sends an unauthenticated visitor to login", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(null as never);
    await expect(AppLayout({ children: "page" })).rejects.toThrow("REDIRECT:/login");
  });
});
