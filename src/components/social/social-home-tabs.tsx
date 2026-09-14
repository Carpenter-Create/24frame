import Link from "next/link";

import { cn } from "@/lib/cn";
import { SOCIAL_HOME_TAB_CLASS } from "@/lib/social-chrome";
import { SOCIAL, socialHomeLaneHref, type SocialHomeLane } from "@/lib/social";

export function SocialHomeTabs({ active }: { active: SocialHomeLane }) {
  return (
    <div data-social-home-tabs="" className="hidden flex-col bg-surface md:flex">
      <div className="flex items-start">
        <Link
          href={socialHomeLaneHref("following")}
          data-social-home-tab="following"
          data-social-home-tab-active={active === "following" ? "" : undefined}
          className={cn(
            SOCIAL_HOME_TAB_CLASS,
            active === "following" ? "font-semibold text-ink" : "font-medium text-ink-2",
          )}
        >
          {SOCIAL.home.followingTab}
          <span
            className={cn("h-[3px] w-full rounded-[2px]", active === "following" ? "bg-accent" : "bg-transparent")}
          />
        </Link>
        <Link
          href={socialHomeLaneHref("for-you")}
          data-social-home-tab="for-you"
          data-social-home-tab-active={active === "for-you" ? "" : undefined}
          className={cn(
            SOCIAL_HOME_TAB_CLASS,
            active === "for-you" ? "font-semibold text-ink" : "font-medium text-ink-2",
          )}
        >
          {SOCIAL.home.forYouTab}
          <span
            className={cn("h-[3px] w-full rounded-[2px]", active === "for-you" ? "bg-accent" : "bg-transparent")}
          />
        </Link>
      </div>
      <div className="h-px w-full bg-hairline" />
    </div>
  );
}
