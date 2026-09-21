import { HouseLink } from "@/components/chrome/house-link";

import { cn } from "@/lib/cn";
import { SOCIAL_PROFILE_TAB_CLASS } from "@/lib/social-chrome";
import {
  SOCIAL_FOLLOWS_TABS,
  socialFollowsTabLabel,
  socialProfileFollowsHref,
  type SocialFollowsTab,
} from "@/lib/social";

export function SocialFollowsTabs({
  handle,
  active,
  query,
  counts,
}: {
  handle: string;
  active: SocialFollowsTab;
  query?: string;
  counts?: { followers: number; following: number };
}) {
  return (
    <div data-social-follows-tabs="" className="flex flex-col bg-surface">
      <div className="flex items-start">
        {SOCIAL_FOLLOWS_TABS.map((tab) => (
          <HouseLink
            key={tab}
            href={socialProfileFollowsHref(handle, tab, query)}
            data-social-follows-tab={tab}
            data-social-follows-tab-active={active === tab ? "" : undefined}
            className={cn(
              SOCIAL_PROFILE_TAB_CLASS,
              "flex-1",
              active === tab ? "font-semibold text-ink" : "font-medium text-ink-2",
            )}
          >
            {socialFollowsTabLabel(tab, counts ? counts[tab] : undefined)}
            <span className={cn("h-0.5 w-full", active === tab ? "bg-accent" : "bg-transparent")} />
          </HouseLink>
        ))}
      </div>
      <div className="h-px w-full bg-hairline" />
    </div>
  );
}
