import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  HOUSE_RAIL_ACTIVE_CLASS,
  HOUSE_RAIL_IDLE_CLASS,
  HOUSE_RAIL_ITEM_CLASS,
  HOUSE_RAIL_TITLE_CLASS,
} from "@/lib/house-shell";
import { NAV } from "@/lib/nav";

const navSrc = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "side-nav.tsx"), "utf8");

describe("SideNav Access rail", () => {
  it("keeps the locked client destinations", () => {
    expect(NAV.map((item) => item.label)).toEqual([
      "Dashboard",
      "Titles",
      "Recent activity",
      "Reports",
    ]);
    expect(NAV.map((item) => item.label)).not.toContain("Activity");
    expect(NAV.map((item) => item.label)).not.toContain("Ask 24Frame AI");
    expect(NAV.map((item) => item.href)).toEqual([
      "/aggregation/dashboard",
      "/aggregation/titles",
      "/aggregation/attention",
      "/aggregation/reports",
    ]);
    expect(NAV.map((item) => item.href)).not.toContain("/activity");
    expect(NAV.map((item) => item.href)).not.toContain("/aggregation/activity");
    expect(NAV.map((item) => item.href)).not.toContain("?ai=1");
    expect(navSrc).not.toContain("AskAiOpenButton");
    expect(navSrc).not.toContain("data-side-nav-ask-ai");
    expect(navSrc).not.toContain("isHouseAiNavItem");
  });

  it("uses house --text-base / t-body labels, 16px Phosphor Bold/Fill, and an 8px item gap", () => {
    const tokens = readFileSync("src/app/tokens.css", "utf8");
    const globals = readFileSync("src/app/globals.css", "utf8");
    expect(navSrc).toContain("HOUSE_RAIL_ITEM_CLASS");
    expect(navSrc).toContain("house --text-base / t-body labels");
    expect(tokens).toMatch(/--text-base:\s*0\.9375rem;/);
    expect(globals).toMatch(/\.t-body\s*\{[\s\S]*?font-size:\s*var\(--text-base\)/);
    expect(HOUSE_RAIL_ITEM_CLASS).toContain("t-body leading-4");
    expect(HOUSE_RAIL_ITEM_CLASS).not.toContain("t-body-sm");
    expect(HOUSE_RAIL_ITEM_CLASS).not.toContain("text-[0.875rem]");
    expect(HOUSE_RAIL_ITEM_CLASS).toMatch(/(?:^|[\s"])t-body(?:[\s"]|$)/);
    expect(navSrc).not.toContain("text-[0.875rem]");
    expect(navSrc).toContain("<NavGlyph item={item} active={active} />");
    expect(navSrc).toContain("16px Phosphor Bold idle");
    expect(navSrc).not.toContain("16px Lucide at 1.33");
    expect(navSrc).not.toContain("NavMark");
    expect(navSrc).not.toContain("markSrc");
    expect(navSrc).not.toContain("ask-globee-16.png");
    expect(navSrc).not.toContain("size-6");
    expect(navSrc).toContain("flex flex-col gap-2 px-2");
    expect(navSrc).toContain("gap-2 px-2 py-2");
    expect(navSrc).not.toContain('collapsed ? "px-1.5" : "px-3"');
    expect(navSrc).not.toContain("gap-2.5 px-3");
    expect(navSrc).not.toContain("gap-2.5");
    expect(navSrc).toContain("STAFF_RAIL_EYEBROW");
    expect(navSrc).toContain("aria-label={item.ariaLabel ?? (collapsed ? item.label : undefined)}");
    expect(navSrc).not.toContain("PRODUCT_NAME");
    expect(navSrc).not.toContain("strokeWidth={1.5}");
    expect(navSrc).not.toContain("strokeWidth={1.33}");
  });

  it("turns Social viewport prefetch on and keeps Aggregation hover-only", () => {
    expect(navSrc).toContain("prefetch={social}");
    expect(navSrc).toContain("Aggregation: VIEWPORT prefetch off, HOVER prefetch on");
    expect(navSrc).toContain("Social: VIEWPORT prefetch on");
    expect(navSrc).toContain("useSocialNavPending");
    expect(navSrc).toContain("SocialNavPendingProbe");
    expect(navSrc).toContain("data-social-rail-pending");
    expect(navSrc).not.toContain("prefetch={false}");
  });

  it("marks the active item with a light-blue pill wash and Sporty Blue type", () => {
    expect(navSrc).toContain("HOUSE_RAIL_ACTIVE_CLASS");
    expect(navSrc).toContain("HOUSE_RAIL_IDLE_CLASS");
    expect(HOUSE_RAIL_ITEM_CLASS).toContain("rounded-full");
    expect(HOUSE_RAIL_ACTIVE_CLASS).toBe("bg-accent-wash text-accent");
    expect(HOUSE_RAIL_ACTIVE_CLASS).not.toMatch(/font-(?:normal|medium|semibold|bold)/);
    expect(HOUSE_RAIL_IDLE_CLASS).toBe("text-ink hover:bg-surface-muted");
    expect(HOUSE_RAIL_IDLE_CLASS).not.toContain("font-normal");
    expect(navSrc).not.toContain("font-normal text-ink-2");
    expect(navSrc).not.toContain("bg-surface-muted font-medium text-ink");
    expect(navSrc).not.toContain('active ? "bg-surface text-ink"');
    expect(navSrc).not.toContain("BrandWordmark");
  });

  it("uses the shared HOUSE_RAIL_TITLE_CLASS for the staff eyebrow", () => {
    expect(navSrc).toContain("HOUSE_RAIL_TITLE_CLASS");
    expect(navSrc).toContain("className={HOUSE_RAIL_TITLE_CLASS}");
    expect(HOUSE_RAIL_TITLE_CLASS).toBe("px-2 pb-1 t-label text-ink-3");
    expect(navSrc).not.toContain('"px-2 pb-1 t-label text-ink-3"');
  });
});
