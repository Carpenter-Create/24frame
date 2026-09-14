import Link from "next/link";

import { BrandEmblem } from "@/components/chrome/brand-emblem";
import { UserMenu } from "@/components/chrome/user-menu";
import { SocialIcon } from "@/components/social/social-icon";
import { PRODUCT_NAME } from "@/lib/product";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import { SOCIAL_ICON_SIZE_HEADER, SOCIAL_ICON_SIZE_SEARCH } from "@/lib/social-icons";
import { workspaceHome } from "@/lib/workspace";

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
      className="sticky top-0 z-40 flex h-[var(--header-height)] items-center justify-between border-b border-hairline bg-surface px-3 md:px-5"
    >
      <Link
        href={workspaceHome("social")}
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
        className="hidden h-9 w-[420px] items-center gap-2 rounded-[10px] bg-surface-muted px-3 md:flex"
      >
        <SocialIcon name="magnifying-glass" size={SOCIAL_ICON_SIZE_SEARCH} className="text-ink-2" />
        <label className="sr-only" htmlFor="social-header-q">
          {SOCIAL.explore.searchSocial}
        </label>
        <input
          id="social-header-q"
          name="q"
          placeholder={SOCIAL.explore.searchSocial}
          className="h-full min-w-0 flex-1 bg-transparent t-body-sm text-ink outline-none placeholder:text-ink-2"
        />
      </form>
      <div className="flex items-center gap-2.5 md:gap-3">
        <Link
          href={SOCIAL_ROUTES.explore}
          aria-label={SOCIAL.explore.searchSocial}
          data-social-header-search-icon=""
          className="flex size-8 items-center justify-center text-ink md:hidden"
        >
          <SocialIcon name="magnifying-glass" size={SOCIAL_ICON_SIZE_HEADER} />
        </Link>
        <Link
          href={SOCIAL_ROUTES.dms}
          aria-label={SOCIAL.dms.title}
          data-social-header-tray=""
          className="hidden items-center justify-center text-ink md:flex"
        >
          <SocialIcon name="tray" size={SOCIAL_ICON_SIZE_HEADER} />
        </Link>
        <UserMenu email={email} name={name} photoUrl={photoUrl} defaultWorkspace="social" />
      </div>
    </header>
  );
}
