import Link from "next/link";

import { BrandEmblem } from "@/components/chrome/brand-emblem";
import { UserMenu } from "@/components/chrome/user-menu";
import { WorkspaceSwitcher } from "@/components/chrome/workspace-switcher";
import { SocialIcon } from "@/components/social/social-icon";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { HOUSE_SEARCH_PILL_CLASS } from "@/lib/house-shell";
import { PRODUCT_NAME } from "@/lib/product";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import { SOCIAL_ICON_SIZE_HEADER, SOCIAL_ICON_SIZE_SEARCH } from "@/lib/social-icons";
import { workspaceHome } from "@/lib/workspace";
import { APP_HEADER_TRAILING_CLUSTER_CLASS } from "@/lib/workspace-switcher";

export function SocialTopBar({
  email,
  name,
  photoUrl,
}: {
  email: string;
  name?: string | null;
  photoUrl?: string | null;
}) {
  return (
    <header
      data-app-header=""
      data-social-top-bar=""
      className="sticky top-0 z-40 flex h-[var(--header-height)] items-center justify-between border-b border-hairline bg-surface pl-3 pr-[var(--space-6)] md:pl-5 md:pr-[var(--content-inset)]"
    >
      <Link
        href={workspaceHome("social")}
        prefetch
        aria-label={PRODUCT_NAME}
        data-brand-emblem=""
        className="inline-flex shrink-0 items-center"
      >
        <BrandEmblem />
      </Link>
      <form
        data-social-header-search=""
        action={SOCIAL_ROUTES.explore}
        method="get"
        className={cn(
          "hidden h-9 w-[420px] items-center gap-2 px-3 md:flex",
          HOUSE_SEARCH_PILL_CLASS,
        )}
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
      <div className="flex items-center gap-[var(--space-3)]">
        <div data-social-header-actions="" className="flex items-center gap-2.5 md:gap-3">
          <Link
            href={SOCIAL_ROUTES.explore}
            prefetch
            aria-label={SOCIAL.explore.searchSocial}
            data-social-header-search-icon=""
            className="flex size-8 items-center justify-center text-ink-2 md:hidden"
          >
            <SocialIcon name="magnifying-glass" size={SOCIAL_ICON_SIZE_HEADER} />
          </Link>
        </div>
        <div data-app-header-trailing="" className={APP_HEADER_TRAILING_CLUSTER_CLASS}>
          <WorkspaceSwitcher current="social" />
          <UserMenu email={email} name={name} photoUrl={photoUrl} />
        </div>
      </div>
    </header>
  );
}
