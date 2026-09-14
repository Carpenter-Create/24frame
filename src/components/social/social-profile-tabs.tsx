import Link from "next/link";

import { cn } from "@/lib/cn";
import { SOCIAL_PROFILE_TAB_CLASS } from "@/lib/social-chrome";
import { SOCIAL, socialProfileTabHref, type SocialProfileTab } from "@/lib/social";

export function SocialProfileTabs({
  baseHref,
  active,
}: {
  baseHref: string;
  active: SocialProfileTab;
}) {
  return (
    <div data-social-profile-tabs="" className="flex flex-col bg-surface">
      <div className="flex items-start">
        <Link
          href={socialProfileTabHref(baseHref, "posts")}
          data-social-profile-tab="posts"
          data-social-profile-tab-active={active === "posts" ? "" : undefined}
          className={cn(
            SOCIAL_PROFILE_TAB_CLASS,
            active === "posts" ? "font-semibold text-ink" : "font-medium text-ink-2",
          )}
        >
          {SOCIAL.profile.postsTab}
          <span className={cn("h-0.5 w-full", active === "posts" ? "bg-accent" : "bg-transparent")} />
        </Link>
        <Link
          href={socialProfileTabHref(baseHref, "highlights")}
          data-social-profile-tab="highlights"
          data-social-profile-tab-active={active === "highlights" ? "" : undefined}
          className={cn(
            SOCIAL_PROFILE_TAB_CLASS,
            active === "highlights" ? "font-semibold text-ink" : "font-medium text-ink-2",
          )}
        >
          {SOCIAL.profile.highlightsTab}
          <span className={cn("h-0.5 w-full", active === "highlights" ? "bg-accent" : "bg-transparent")} />
        </Link>
      </div>
      <div className="h-px w-full bg-hairline" />
    </div>
  );
}
