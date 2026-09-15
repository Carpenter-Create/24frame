import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Bot, MessageSquare, Sparkle as LucideSparkle, Sparkles } from "lucide-react";
import {
  FilmSlate,
  PaperPlaneTilt,
  Pulse,
  Sparkle,
  SquaresFour,
  Storefront,
  Tray,
  Users,
  Wallet,
} from "@phosphor-icons/react";

import { ASK_GLOBEE } from "@/lib/ask-globee";
import {
  GC_NAV,
  NAV,
  SOCIAL_DESKTOP_NAV,
  SOCIAL_NAV,
  STAFF_RAIL_EYEBROW,
  clientNavCurrent,
  isClientNavActive,
  isSocialTabActive,
  mobileNavDestinations,
  railDestinations,
} from "./nav";

const navSrc = readFileSync("src/lib/nav.ts", "utf8");

describe("client NAV", () => {
  it("keeps Home at / and never exposes operator routes", () => {
    const hrefs = NAV.map((item) => item.href);
    expect(hrefs[0]).toBe("/");
    expect(hrefs).toContain("/deliveries");
    expect(hrefs).not.toContain("/gc/deliveries");
    expect(hrefs).not.toContain("/queue");
    expect(hrefs).not.toContain("/vendors");
    expect(hrefs).not.toContain("/gc/clients");
  });

  it("marks Home current on `/` and Titles on a title path", () => {
    expect(clientNavCurrent("/").label).toBe("Home");
    expect(isClientNavActive("/", NAV[0])).toBe(true);
    expect(isClientNavActive("/titles", NAV[0])).toBe(false);
    expect(clientNavCurrent("/titles").label).toBe("Titles");
    expect(clientNavCurrent("/titles/abc").label).toBe("Titles");
    expect(clientNavCurrent("/finance").label).toBe("Finance");
    expect(clientNavCurrent("/finance/abc").label).toBe("Finance");
    expect(clientNavCurrent("/messages").label).toBe("Ask 24Frame AI");
    expect(clientNavCurrent("/messages").label).toBe(ASK_GLOBEE.headline);
    expect(clientNavCurrent("/queue").label).toBe("Home");
  });

  it("keeps /messages as Ask Globee with Phosphor Sparkle, not Messages or the bee", () => {
    const dest = NAV.find((item) => item.href === "/messages");
    expect(dest).toBeDefined();
    expect(dest?.label).toBe("Ask 24Frame AI");
    expect(dest?.href).toBe("/messages");
    expect(dest?.family).toBe("phosphor");
    expect(dest?.icon).toBe(Sparkle);
    expect(dest?.icon).not.toBe(LucideSparkle);
    expect(dest?.icon).not.toBe(Sparkles);
    expect(dest?.icon).not.toBe(MessageSquare);
    expect(dest?.icon).not.toBe(Bot);
    expect(NAV.map((item) => item.label)).not.toContain("Messages");
    expect(NAV.map((item) => item.label)).not.toContain("Groups");
    expect(NAV.map((item) => item.label)).not.toContain("Casting");
    expect(NAV.map((item) => item.label)).not.toContain("Social");
    expect(navSrc).toContain("icon: Sparkle");
    expect(navSrc).not.toContain("icon: Sparkles");
    expect(navSrc).not.toContain("markSrc");
    expect(navSrc).not.toContain("ASK_GLOBEE_NAV_MARK");
    expect(navSrc).not.toContain("isNavImageItem");
    expect(navSrc).not.toContain("MessageSquare");
    expect(navSrc).not.toContain("NavImageItem");
  });

  it("locks Aggregation rail glyphs to Phosphor 75:5 / 61:2 — SOCIAL_NAV family stays Lucide", () => {
    expect(NAV.map((item) => item.icon)).toEqual([
      SquaresFour,
      FilmSlate,
      PaperPlaneTilt,
      Pulse,
      Wallet,
      Sparkle,
    ]);
    expect(GC_NAV.map((item) => item.icon)).toEqual([
      Tray,
      PaperPlaneTilt,
      Storefront,
      Wallet,
      Users,
    ]);
    expect(NAV.every((item) => item.family === "phosphor")).toBe(true);
    expect(GC_NAV.every((item) => item.family === "phosphor")).toBe(true);
    expect(SOCIAL_NAV.every((item) => item.family === "lucide")).toBe(true);
    expect(navSrc).not.toContain("LayoutDashboard");
    expect(navSrc).not.toContain("Clapperboard");
    expect(navSrc).toContain("family: \"phosphor\"");
    expect(navSrc).toContain("family: \"lucide\"");
  });
});

describe("Ask Globee nav mark", () => {
  it("drops the bee PNGs and the image mark path", () => {
    expect(() => readFileSync("public/ask-globee/ask-globee-16.png")).toThrow();
    expect(() => readFileSync("public/ask-globee/ask-globee-64.png")).toThrow();
    expect(() => readFileSync("src/components/chrome/nav-mark.tsx")).toThrow();
    expect(navSrc).not.toContain("ask-globee-16.png");
    expect(navSrc).not.toContain("ask-globee-64.png");
  });
});

describe("GC_NAV", () => {
  it("adds staff-only GC Deliveries between Queue and Vendors, with Clients last", () => {
    expect(GC_NAV.map((item) => ({ label: item.label, href: item.href }))).toEqual([
      { label: "Queue", href: "/queue" },
      { label: "24Frame Deliveries", href: "/gc/deliveries" },
      { label: "Vendors", href: "/vendors" },
      { label: "Finance", href: "/gc/finance" },
      { label: "Clients", href: "/gc/clients" },
    ]);
  });

  it("keeps the full staff rail — client destinations then the operator set", () => {
    expect([...NAV, ...GC_NAV].map((item) => item.label)).toEqual([
      "Home",
      "Titles",
      "Deliveries",
      "Catalog Health",
      "Finance",
      "Ask 24Frame AI",
      "Queue",
      "24Frame Deliveries",
      "Vendors",
      "Finance",
      "Clients",
    ]);
    expect(STAFF_RAIL_EYEBROW).toBe("Staff");
    expect(STAFF_RAIL_EYEBROW).not.toBe("24Frame");
    expect(STAFF_RAIL_EYEBROW).not.toBe("24FRAME");
  });

  it("does not include the client deliveries path", () => {
    expect(GC_NAV.map((item) => item.href)).not.toContain("/deliveries");
  });
});

describe("mobileNavDestinations", () => {
  it("keeps the client sheet on the Aggregation NAV destinations", () => {
    expect(mobileNavDestinations(false).map((item) => item.label)).toEqual([
      "Home",
      "Titles",
      "Deliveries",
      "Catalog Health",
      "Finance",
      "Ask 24Frame AI",
    ]);
    expect(mobileNavDestinations(false).map((item) => item.href)).not.toContain("/queue");
    expect(mobileNavDestinations(false).map((item) => item.href)).not.toContain("/vendors");
    expect(mobileNavDestinations(false).map((item) => item.href)).not.toContain("/gc/clients");
  });

  it("gives staff the operator destinations plus the client five", () => {
    expect(mobileNavDestinations(true).map((item) => item.label)).toEqual([
      "Home",
      "Titles",
      "Deliveries",
      "Catalog Health",
      "Finance",
      "Ask 24Frame AI",
      "Queue",
      "24Frame Deliveries",
      "Vendors",
      "Finance",
      "Clients",
    ]);
  });

  it("shows Social destinations only in Social mode — DMs are not /messages", () => {
    expect(mobileNavDestinations(false, "social").map((item) => item.href)).toEqual([
      "/social",
      "/social/explore",
      "/social/create",
      "/social/dms",
      "/social/profile",
    ]);
    expect(mobileNavDestinations(true, "social").map((item) => item.href)).toEqual([
      "/social",
      "/social/explore",
      "/social/create",
      "/social/dms",
      "/social/profile",
    ]);
    expect(mobileNavDestinations(true, "social").map((item) => item.href)).not.toContain("/messages");
    expect(mobileNavDestinations(true, "social").map((item) => item.href)).not.toContain("/queue");
    expect(mobileNavDestinations(true, "social").map((item) => item.href)).not.toContain("/social/groups");
    expect(SOCIAL_NAV.map((item) => item.label)).toEqual([
      "Home",
      "Explore",
      "Create",
      "Messages",
      "Profile",
    ]);
    expect(SOCIAL_DESKTOP_NAV.map((item) => item.label)).toEqual([
      "Home",
      "Explore",
      "Messages",
      "Profile",
    ]);
    expect(railDestinations(false, "social").items.map((item) => item.label)).toEqual([
      "Home",
      "Explore",
      "Messages",
      "Profile",
    ]);
    expect(navSrc).not.toContain("SOCIAL_MOBILE_PILL");
    expect(isSocialTabActive("/social", SOCIAL_NAV[0])).toBe(true);
    expect(isSocialTabActive("/social/stories", SOCIAL_NAV[0])).toBe(true);
    expect(isSocialTabActive("/social/create", SOCIAL_NAV[2])).toBe(true);
    expect(isSocialTabActive("/social/u/maya", SOCIAL_NAV[4])).toBe(true);
    expect(isSocialTabActive("/social/profile/edit", SOCIAL_NAV[4])).toBe(true);
    expect(isSocialTabActive("/social/profile/edit/bio", SOCIAL_NAV[4])).toBe(true);
    expect(isSocialTabActive("/social/explore", SOCIAL_NAV[0])).toBe(false);
    expect(railDestinations(true, "social").staffItems).toEqual([]);
    expect(railDestinations(true, "aggregation").staffItems.map((item) => item.href)).toContain(
      "/queue",
    );
  });
});
