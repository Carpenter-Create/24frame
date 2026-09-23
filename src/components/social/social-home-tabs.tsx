"use client";

import { HouseLink } from "@/components/chrome/house-link";

import { cn } from "@/lib/cn";
import { SOCIAL_HOME_TAB_CLASS } from "@/lib/social-chrome";
import { SOCIAL_CATEGORY_ALL } from "@/lib/social-categories";
import { SOCIAL, socialHomeLaneHref, type SocialHomeLane } from "@/lib/social";

import { useSocialHomeLive } from "./social-home-live";

export function SocialHomeTabs({ active }: { active: SocialHomeLane }) {
  const lane = useSocialHomeLive(active, SOCIAL_CATEGORY_ALL).lane;
  return (
    <div data-social-home-tabs="" className="hidden flex-col bg-surface md:flex">
      <div className="flex items-start">
        <HouseLink
          href={socialHomeLaneHref("following")}
          data-social-home-tab="following"
          data-social-home-tab-active={lane === "following" ? "" : undefined}
          className={cn(
            SOCIAL_HOME_TAB_CLASS,
            lane === "following" ? "font-semibold text-ink" : "font-medium text-ink-2",
          )}
        >
          {SOCIAL.home.followingTab}
          <span
            className={cn("h-[3px] w-full rounded-[2px]", lane === "following" ? "bg-accent" : "bg-transparent")}
          />
        </HouseLink>
        <HouseLink
          href={socialHomeLaneHref("for-you")}
          data-social-home-tab="for-you"
          data-social-home-tab-active={lane === "for-you" ? "" : undefined}
          className={cn(
            SOCIAL_HOME_TAB_CLASS,
            lane === "for-you" ? "font-semibold text-ink" : "font-medium text-ink-2",
          )}
        >
          {SOCIAL.home.forYouTab}
          <span
            className={cn("h-[3px] w-full rounded-[2px]", lane === "for-you" ? "bg-accent" : "bg-transparent")}
          />
        </HouseLink>
      </div>
      <div className="h-px w-full bg-hairline" />
    </div>
  );
}
