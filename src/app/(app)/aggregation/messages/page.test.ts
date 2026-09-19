import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrgTier } from "@/lib/org-tier";
import { ASK_GLOBEE } from "@/lib/ask-globee";
import MessagesPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn(), push: vi.fn() }),
  usePathname: () => "/messages",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/org-tier", () => ({ getActiveOrgTier: vi.fn() }));

const pageSrc = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "page.tsx"), "utf8");
const interceptSrc = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "ask-ai-legacy-intercept.tsx"),
  "utf8",
);

const THREAD = "2f1c8b6a-4d3e-4a11-9c22-7b8e1d0a5f44";

function ctx({
  isGcStaff = false,
  hasOrg = true,
  email = "ada@example.com",
}: {
  isGcStaff?: boolean;
  hasOrg?: boolean;
  email?: string;
} = {}) {
  const org = hasOrg ? { id: "org-1", name: "Meridian Pictures", status: "active" } : null;
  return {
    user: { id: "u1", email },
    rows: org ? [{ role: "account_owner", organizations: org }] : [],
    orgs: org ? [{ id: org.id, name: org.name }] : [],
    activeOrg: org,
    activeRole: org ? "account_owner" : null,
    canOperate: !!org,
    isGcStaff,
    unread: Promise.resolve(0),
  };
}

function stubClient() {
  const from = vi.fn();
  const rpc = vi.fn();
  vi.mocked(createClient).mockResolvedValue({ from, rpc } as never);
  return { from, rpc };
}

async function renderPage(
  search: Record<string, string | string[] | undefined> = {},
): Promise<string> {
  return renderToStaticMarkup(
    await MessagesPage({ searchParams: Promise.resolve(search) }),
  ).replaceAll("&#x27;", "'");
}

describe("MessagesPage leftover intercept", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubClient();
  });

  it("does not render Ask 24Frame AI as a workspace destination", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    vi.mocked(getActiveOrgTier).mockResolvedValue("pro");

    const html = await renderPage();
    expect(html).toContain("data-ask-ai-legacy-intercept");
    expect(html).not.toContain("data-ask-globee-landing");
    expect(html).not.toContain("data-ask-globee-thread");
    expect(html).not.toContain("data-ask-globee-gate");
    expect(html).not.toContain(ASK_GLOBEE.tryLabel);
    expect(pageSrc).toContain("AskAiLegacyIntercept");
    expect(pageSrc).not.toContain("<AskGlobeeLanding");
    expect(pageSrc).not.toContain("<AskGlobeeThread");
    expect(pageSrc).not.toContain("<AccessUpgradeGate");
    expect(interceptSrc).toContain("legacyAskAiInterceptHref");
    expect(interceptSrc).toContain("readAskAiReturnPath");
    expect(vi.mocked(createClient)).not.toHaveBeenCalled();
  });

  it("opens a leftover thread bookmark through the overlay intercept, not Aggregation land", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    vi.mocked(getActiveOrgTier).mockResolvedValue("pro");

    const html = await renderPage({ thread: THREAD });
    expect(html).toContain("data-ask-ai-legacy-intercept");
    expect(html).not.toContain("data-ask-globee-thread");
    expect(html).not.toContain("data-app-messages-frame");
    expect(pageSrc).toContain("readAskGlobeeThreadId");
  });

  it("still sends staff without a client org to Activity", async () => {
    const { from, rpc } = stubClient();
    vi.mocked(getOrgContext).mockResolvedValue(ctx({ isGcStaff: true, hasOrg: false }) as never);

    await expect(renderPage({ thread: THREAD })).rejects.toThrow("REDIRECT:/activity");
    expect(vi.mocked(getActiveOrgTier)).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalledWith("ai_conversations");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("sends an unauthenticated visitor to login", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(null as never);
    await expect(MessagesPage()).rejects.toThrow("REDIRECT:/login");
  });

  it("intercepts Access leftover URLs instead of trapping them on /messages", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx({ hasOrg: false }) as never);
    const html = await renderPage();
    expect(html).toContain("data-ask-ai-legacy-intercept");
    expect(html).not.toContain("data-ask-globee-gate");
    expect(html).not.toContain("data-ask-globee-landing");
  });
});
