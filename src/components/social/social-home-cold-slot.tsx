"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useHouseClient } from "@/components/chrome/house-client-shell";
import { houseExactHref } from "@/lib/house-client-shell";
import type { SocialCategoryLabel } from "@/lib/social-categories";
import type { SocialHomeLane } from "@/lib/social";

import { useSocialHomeLive } from "./social-home-live";

// Cold lane/topic: the mounted Home screen stays up so the chip can
// select in the click. Keep the live center and For You rail mounted.
// Swapping them for SocialHomeCenterSkeleton / SocialForYouSkeleton
// (or dropping the rail) moves the layout before the query lands.
// Next still has to load the query; pushState alone never fetches it.
export function SocialHomeColdSlot({
  seedLane,
  seedTopic,
  children,
}: {
  seedLane: SocialHomeLane;
  seedTopic: SocialCategoryLabel;
  children: ReactNode;
}) {
  const house = useHouseClient();
  const router = useRouter();
  const pushed = useRef<string | null>(null);
  const live = useSocialHomeLive(seedLane, seedTopic);
  const cold = live.lane !== seedLane || live.topic !== seedTopic;

  useEffect(() => {
    if (!cold || !house) {
      // Settled hops must be able to push this href again. A sticky
      // guard left the next click on the same chip as a no-op.
      pushed.current = null;
      return;
    }
    const nextHref = `${house.nextPathname}${house.nextSearch}`;
    if (houseExactHref(house.href) === houseExactHref(nextHref)) {
      pushed.current = null;
      return;
    }
    if (pushed.current === house.href) return;
    pushed.current = house.href;
    router.push(house.href, { scroll: false });
  }, [cold, house, router]);

  return children;
}

// Desktop For You sits beside Home. Lane is owned client state, so the
// server `lane` prop stays stale for the hop. Leave the painted rail
// in place until that seed catches up — nulling it or painting
// SocialForYouSkeleton shifts the center under the selected tab.
export function SocialHomeFollowingRail({
  children,
}: {
  seedLane: SocialHomeLane;
  seedTopic: SocialCategoryLabel;
  children: ReactNode;
}) {
  return children;
}
