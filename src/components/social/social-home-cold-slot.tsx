"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useHouseClient } from "@/components/chrome/house-client-shell";
import { houseExactHref } from "@/lib/house-client-shell";
import type { SocialCategoryLabel } from "@/lib/social-categories";
import type { SocialHomeLane } from "@/lib/social";

import { SocialForYouSkeleton, SocialHomeCenterSkeleton } from "./social-skeletons";
import { useSocialHomeLive } from "./social-home-live";
import { SocialHomeTabs } from "./social-home-tabs";

// Cold lane/topic: the mounted Home screen stays up so the chip can
// select in the click. The center below the topic rail paints the
// route skeleton, then Next loads that query.
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
    if (!cold || !house) return;
    const nextHref = `${house.nextPathname}${house.nextSearch}`;
    if (houseExactHref(house.href) === houseExactHref(nextHref)) return;
    if (pushed.current === house.href) return;
    pushed.current = house.href;
    router.push(house.href);
  }, [cold, house, router]);

  if (!cold) return children;
  return <SocialHomeCenterSkeleton topics={false} middle={<SocialHomeTabs active={seedLane} />} />;
}

// Desktop For You sits beside Home, outside the cold center. Lane is
// owned client state, so the server `lane` prop stays stale for the hop.
export function SocialHomeFollowingRail({
  seedLane,
  seedTopic,
  children,
}: {
  seedLane: SocialHomeLane;
  seedTopic: SocialCategoryLabel;
  children: ReactNode;
}) {
  const live = useSocialHomeLive(seedLane, seedTopic);
  if (live.lane !== "following") return null;
  if (seedLane !== "following") return <SocialForYouSkeleton />;
  return children;
}
