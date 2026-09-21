import { HouseLink } from "@/components/chrome/house-link";

import { cn } from "@/lib/cn";
import { SOCIAL_PROFILE_TAB_CLASS } from "@/lib/social-chrome";
import {
  SOCIAL_PROFILE_TABS,
  socialProfileTabHref,
  socialProfileTabLabel,
  type SocialProfileTab,
} from "@/lib/social";

export function SocialProfileTabs({
  baseHref,
  active,
}: {
  baseHref: string;
  active: SocialProfileTab;
}) {
  return (
    <div data-social-profile-tabs="" className="flex flex-col bg-surface">
      <div className="overflow-x-auto">
        <div className="flex w-max items-start">
          {SOCIAL_PROFILE_TABS.map((tab) => (
            <HouseLink
              key={tab}
              href={socialProfileTabHref(baseHref, tab)}
              data-social-profile-tab={tab}
              data-social-profile-tab-active={active === tab ? "" : undefined}
              className={cn(
                SOCIAL_PROFILE_TAB_CLASS,
                active === tab ? "font-semibold text-ink" : "font-medium text-ink-2",
              )}
            >
              {socialProfileTabLabel(tab)}
              <span className={cn("h-0.5 w-full", active === tab ? "bg-accent" : "bg-transparent")} />
            </HouseLink>
          ))}
        </div>
      </div>
      <div className="h-px w-full bg-hairline" />
    </div>
  );
}
