import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { NAV } from "@/lib/nav";

const navSrc = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "side-nav.tsx"), "utf8");

describe("SideNav Access rail", () => {
  it("keeps the locked client destinations", () => {
    expect(NAV.map((item) => item.label)).toEqual([
      "Dashboard",
      "Titles",
      "Deliveries",
      "Catalog Health",
      "Reports",
      "Ask 24Frame AI",
    ]);
    expect(NAV.map((item) => item.href)).toEqual([
      "/dashboard",
      "/titles",
      "/deliveries",
      "/catalog-health",
      "/reports",
      "/messages",
    ]);
  });

  it("uses 13px labels via --text-sm / t-body-sm, 16px Phosphor Bold/Fill, and an 8px item gap", () => {
    const tokens = readFileSync("src/app/tokens.css", "utf8");
    const globals = readFileSync("src/app/globals.css", "utf8");
    const itemClass = navSrc.match(
      /"relative flex items-center rounded-\[var\(--radius\)\] [^"]+"/,
    )?.[0];
    expect(navSrc).toContain("13px labels (--text-sm / t-body-sm)");
    expect(tokens).toMatch(/--text-sm:\s*0\.8125rem;/);
    expect(globals).toMatch(/\.t-body-sm\s*\{[\s\S]*?font-size:\s*var\(--text-sm\)/);
    expect(itemClass).toContain("t-body-sm leading-4");
    expect(itemClass).not.toContain("text-[0.875rem]");
    expect(itemClass).not.toMatch(/(?:^|[\s"])t-body(?:[\s"]|$)/);
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

  it("marks the active item with a muted grey wash, not faded blue", () => {
    expect(navSrc).toContain("bg-surface-muted font-medium text-ink");
    expect(navSrc).toContain("font-normal text-ink-2 hover:bg-surface-muted hover:text-ink");
    expect(navSrc).not.toContain('active ? "bg-surface text-ink"');
    expect(navSrc).not.toMatch(/active\s*\?\s*"[^"]*accent/);
    expect(navSrc).not.toMatch(/active\s*\?\s*"[^"]*blue/);
  });
});
