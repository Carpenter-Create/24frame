import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import { getActiveOrgTier } from "@/lib/org-tier";
import { hasAvatarObject } from "@/lib/s3-avatars";
import {
  appShellActivityItems,
  appShellUnread,
  enforceAppAccess,
  loadAppShellChrome,
} from "@/lib/app-shell-chrome";

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
vi.mock("@/lib/s3-avatars", () => ({ hasAvatarObject: vi.fn(async () => false) }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    rpc: vi.fn(async () => ({ data: [], error: null })),
  })),
}));

type Status = "registered" | "awaiting_payment" | "active";

function ctx({ isGcStaff, orgStatus }: { isGcStaff: boolean; orgStatus: Status | null }) {
  const org = orgStatus ? { id: "org-1", name: "Acme", status: orgStatus } : null;
  return {
    user: { id: "u1", email: "someone@example.com", name: "Ada" },
    rows: org ? [{ role: "account_owner", organizations: org }] : [],
    orgs: org ? [{ id: org.id, name: org.name }] : [],
    activeOrg: org,
    activeRole: org ? "account_owner" : null,
    canOperate: !!org,
    isGcStaff,
    unread: Promise.resolve(0),
  };
}

const layoutSrc = readFileSync("src/app/(app)/layout.tsx", "utf8");
const chromeSrc = readFileSync("src/lib/app-shell-chrome.ts", "utf8");
const shellSrc = readFileSync("src/components/chrome/app-shell.tsx", "utf8");

describe("App access gates (moved off the layout body)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not bounce GC staff whose client org is mid-onboarding", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: true, orgStatus: "registered" }) as never,
    );
    await expect(enforceAppAccess()).resolves.toMatchObject({ isGcStaff: true });
  });

  it("still bounces a non-GC client whose org is mid-onboarding", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: false, orgStatus: "registered" }) as never,
    );
    await expect(enforceAppAccess()).rejects.toThrow("REDIRECT:/onboarding");
  });

  it("renders the shell for GC staff with no client org at all", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: true, orgStatus: null }) as never,
    );
    await expect(enforceAppAccess()).resolves.toMatchObject({ isGcStaff: true });
  });

  it("renders the shell for a signed-in user with no org so Social is reachable", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: false, orgStatus: null }) as never,
    );
    await expect(enforceAppAccess()).resolves.toBeTruthy();
  });

  it("renders for an ordinary client whose org is active", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: false, orgStatus: "active" }) as never,
    );
    await expect(enforceAppAccess()).resolves.toBeTruthy();
  });

  it("sends an unauthenticated visitor to login", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(null as never);
    await expect(enforceAppAccess()).rejects.toThrow("REDIRECT:/login");
  });
});

describe("app shell chrome load", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads the face and org-tier together after access, and exposes unread as a promise", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: false, orgStatus: "active" }) as never,
    );
    vi.mocked(hasAvatarObject).mockResolvedValue(true);
    const chrome = await loadAppShellChrome();
    expect(chrome.email).toBe("someone@example.com");
    expect(chrome.name).toBe("Ada");
    expect(chrome.photoUrl).toBe("/api/account/photo");
    expect(getActiveOrgTier).toHaveBeenCalledWith("org-1");
    expect(hasAvatarObject).toHaveBeenCalledWith("u1");
    await expect(appShellUnread(Promise.resolve(chrome))).resolves.toBe(0);
    await expect(appShellActivityItems(Promise.resolve(chrome))).resolves.toEqual([]);
  });
});

describe("Social nav no longer waits on the (app) layout waterfall", () => {
  it("keeps the default export sync and starts chrome without awaiting S3 or org-tier", () => {
    expect(layoutSrc).toContain("export default function AppLayout");
    expect(layoutSrc).not.toContain("export default async function AppLayout");
    expect(layoutSrc).toContain("loadAppShellChrome()");
    expect(layoutSrc).toContain("appShellUnread(chrome)");
    expect(layoutSrc).toContain("appShellActivityItems(chrome)");
    expect(layoutSrc).toContain("<AppAccessGate");
    expect(layoutSrc).toContain("<Suspense fallback={null}>");
    expect(layoutSrc).toContain("{children}");
    expect(layoutSrc).not.toMatch(/await getOrgContext/);
    expect(layoutSrc).not.toMatch(/await hasAvatarObject/);
    expect(layoutSrc).not.toMatch(/await getActiveOrgTier/);
    expect(layoutSrc).not.toMatch(/key=\{pathname\}/);
    expect(layoutSrc).not.toMatch(/key=\{ctx/);
  });

  it("still signs the chrome face from the session user, off the page slot", () => {
    expect(chromeSrc).toContain("hasAvatarObject(ctx.user.id)");
    expect(chromeSrc).toContain("ACCOUNT_PHOTO_HREF");
    expect(chromeSrc).toContain("name: ctx.user.name");
    expect(chromeSrc).toContain("email: ctx.user.email");
    expect(chromeSrc).toContain("Promise.all");
    expect(chromeSrc).not.toContain("signedAvatarUrl");
    expect(chromeSrc).not.toContain("putAvatarObject");
    expect(chromeSrc).not.toContain("display_name");
    expect(chromeSrc).not.toContain("user_metadata");
  });

  it("does not use() chrome at the AppShell top, so Social children can paint", () => {
    const appShellFn = shellSrc.slice(
      shellSrc.indexOf("export function AppShell"),
      shellSrc.indexOf("function AccountMenuSlot"),
    );
    expect(appShellFn).not.toMatch(/\buse\(chrome\)/);
    expect(shellSrc).toContain("HouseLeadChrome");
    expect(shellSrc).not.toContain("SocialTopBarFromChrome");
    expect(shellSrc).not.toContain("SocialRailAccountChip");
    expect(shellSrc).toContain("SideNavFromChrome");
    expect(shellSrc).not.toContain("DestChipsFromChrome");
    expect(shellSrc).toContain("ChromeCookieSync");
    expect(shellSrc).toContain("data.isGcStaff");
    expect(shellSrc).toContain("data.defaultCollapsed");
    expect(shellSrc).toContain("data.defaultWorkspace");
    expect(shellSrc).toContain("Do not use() this at the AppShell top");
  });
});
