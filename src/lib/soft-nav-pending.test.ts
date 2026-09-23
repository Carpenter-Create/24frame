import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { SOCIAL_CATEGORY_ALL } from "@/lib/social-categories";
import { resolveSocialHomeLocation } from "@/lib/social-home-location";

const AGGREGATION_LOADING = [
  "src/app/(app)/aggregation/dashboard/loading.tsx",
  "src/app/(app)/aggregation/titles/loading.tsx",
  "src/app/(app)/aggregation/titles/[id]/loading.tsx",
  "src/app/(app)/aggregation/titles/[id]/metadata/loading.tsx",
  "src/app/(app)/aggregation/attention/loading.tsx",
  "src/app/(app)/aggregation/reports/loading.tsx",
  "src/app/(app)/aggregation/reports/[periodId]/loading.tsx",
] as const;

describe("soft-nav pending selection", () => {
  it("points Aggregation desktop, Settings, and workspace pills at markPending/activePath", () => {
    const sideNav = readFileSync("src/components/chrome/side-nav.tsx", "utf8");
    const settings = readFileSync("src/components/chrome/settings-rail.tsx", "utf8");
    const pills = readFileSync("src/components/chrome/workspace-switcher.tsx", "utf8");
    expect(sideNav).toContain("const pathForActive = activePath");
    expect(sideNav).not.toContain("social ? activePath : pathname");
    expect(sideNav).toContain("onClick={(event) => markPending(item.href, event)}");
    expect(sideNav).toContain("<SocialNavPendingProbe");
    expect(settings).toContain("useHouseNavPending");
    expect(settings).toContain("settingsHubSection(activePath)");
    expect(settings).toContain("markPending(item.href, event)");
    expect(settings).toContain("HouseNavPendingProbe");
    expect(pills).toContain("resolveWorkspaceMode(activePath, current)");
    expect(pills).toContain("markPending?.(dest, event)");
    expect(pills).toContain("markPending?.(pill.href, event)");
    expect(pills).toContain("router.push(dest)");
    expect(pills).toContain("router.push(pill.href)");
  });

  it("reads Home lane and topic from the owned href and skeletons a cold chip", () => {
    const topics = readFileSync("src/components/social/social-home-topics.tsx", "utf8");
    const tabs = readFileSync("src/components/social/social-home-tabs.tsx", "utf8");
    const slot = readFileSync("src/components/social/social-home-cold-slot.tsx", "utf8");
    const home = readFileSync("src/app/(app)/social/page.tsx", "utf8");
    expect(topics).toContain("useSocialHomeLive");
    expect(tabs).toContain("useSocialHomeLive");
    expect(slot).toContain("SocialHomeCenterSkeleton");
    expect(slot).toContain("topics={false}");
    expect(slot).toContain("router.push(house.href)");
    expect(home).toContain("<SocialHomeTopics active={topic}");
    expect(home).toContain("<SocialHomeColdSlot");
    expect(home).toContain("<SocialHomeFollowingRail");
    expect(slot).toContain("live.lane !== \"following\"");
    expect(slot).toContain("<SocialForYouSkeleton />");
    expect(
      resolveSocialHomeLocation({
        owned: true,
        search: "?topic=music&lane=for-you",
        nextSearch: "",
        seedLane: "following",
        seedTopic: SOCIAL_CATEGORY_ALL,
      }),
    ).toEqual({ lane: "for-you", topic: "Music" });
    expect(
      resolveSocialHomeLocation({
        owned: false,
        search: "?topic=music",
        nextSearch: "",
        seedLane: "following",
        seedTopic: "Acting",
      }),
    ).toEqual({ lane: "following", topic: "Acting" });
  });
});

describe("soft-nav cold hop", () => {
  it("retries a blank outlet instead of a 100/200ms one-shot accept", () => {
    const provider = readFileSync("src/components/chrome/house-client-shell.tsx", "utf8");
    const cache = provider.slice(provider.indexOf("export function HouseScreenCache"));
    expect(cache).toContain("houseBlankOutlet");
    expect(cache).toContain("HOUSE_BLANK_OUTLET_RETRY_MS");
    expect(cache).toContain("window.setInterval(kick, HOUSE_BLANK_OUTLET_RETRY_MS)");
    expect(cache).toContain("acceptStale");
    expect(cache).toContain("setSettledKey(activeKey)");
    expect(cache).not.toContain("setTimeout");
    expect(cache).not.toContain("setAcceptKey");
    expect(provider).toContain("houseSocialHomePanelHop");
  });

  it("marks Settings and Aggregation loading as house ingress", () => {
    const settings = readFileSync("src/app/(app)/settings/loading.tsx", "utf8");
    expect(settings).toContain("data-house-rsc-fallback");
    for (const path of AGGREGATION_LOADING) {
      expect(readFileSync(path, "utf8")).toContain("data-house-rsc-fallback");
    }
  });

  it("keeps Aggregation layout sync and the Settings hub off HeadObject", () => {
    const layout = readFileSync("src/app/(app)/aggregation/layout.tsx", "utf8");
    const settings = readFileSync("src/components/settings/profile-settings.tsx", "utf8");
    expect(layout).toContain("export default function AggregationLayout");
    expect(layout).not.toContain("export default async function AggregationLayout");
    expect(layout).toContain("<Suspense");
    expect(layout.indexOf("{children}")).toBeGreaterThan(layout.indexOf("<Suspense"));
    expect(settings).toContain("ACCOUNT_PHOTO_HREF");
    expect(settings).not.toContain("signedAvatarUrl");
  });
});
