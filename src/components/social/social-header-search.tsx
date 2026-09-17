import Link from "next/link";

import { SocialIcon } from "@/components/social/social-icon";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { HOUSE_LEAD_SEARCH_PILL_CLASS } from "@/lib/house-lead-chrome";
import { HOUSE_ICON_BUTTON_CLASS, HOUSE_SEARCH_PILL_CLASS } from "@/lib/house-shell";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import { SOCIAL_ICON_SIZE_HEADER, SOCIAL_ICON_SIZE_SEARCH } from "@/lib/social-icons";

export function SocialHeaderSearch() {
  return (
    <form
      data-social-header-search=""
      action={SOCIAL_ROUTES.explore}
      method="get"
      className={cn(HOUSE_LEAD_SEARCH_PILL_CLASS, HOUSE_SEARCH_PILL_CLASS)}
    >
      <SocialIcon name="magnifying-glass" size={SOCIAL_ICON_SIZE_SEARCH} className="text-ink-3" />
      <label className="sr-only" htmlFor="social-header-q">
        {SOCIAL.explore.searchSocial}
      </label>
      <Input
        variant="bare"
        id="social-header-q"
        name="q"
        placeholder={SOCIAL.explore.searchSocial}
        className="h-full flex-1 placeholder:text-ink-3"
      />
    </form>
  );
}

export function SocialHeaderSearchPhone() {
  return (
    <Link
      href={SOCIAL_ROUTES.explore}
      prefetch
      aria-label={SOCIAL.explore.searchSocial}
      data-social-header-search-icon=""
      className={cn(
        "flex size-8 items-center justify-center text-ink-2 md:hidden",
        HOUSE_ICON_BUTTON_CLASS,
      )}
    >
      <SocialIcon name="magnifying-glass" size={SOCIAL_ICON_SIZE_HEADER} />
    </Link>
  );
}
