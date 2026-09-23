"use client";

import { useHouseClient } from "@/components/chrome/house-client-shell";
import { houseExactHref } from "@/lib/house-client-shell";
import type { SocialCategoryLabel } from "@/lib/social-categories";
import { resolveSocialHomeLocation } from "@/lib/social-home-location";
import type { SocialHomeLane } from "@/lib/social";

export function useSocialHomeLive(seedLane: SocialHomeLane, seedTopic: SocialCategoryLabel) {
  const house = useHouseClient();
  const owned = house
    ? houseExactHref(house.href) !== houseExactHref(`${house.nextPathname}${house.nextSearch}`)
    : false;
  return resolveSocialHomeLocation({
    owned,
    search: house?.search ?? "",
    nextSearch: house?.nextSearch ?? "",
    seedLane,
    seedTopic,
  });
}
