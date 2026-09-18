import Link from "next/link";

import { cn } from "@/lib/cn";
import { SOCIAL_ACCOUNT_CHIP_CLASS, SOCIAL_AVATAR_SM_CLASS } from "@/lib/social-chrome";
import { SOCIAL, SOCIAL_ROUTES, socialInitials } from "@/lib/social";

export function SocialRailAccountChip({
  name,
  photoUrl,
  collapsed = false,
}: {
  name?: string | null;
  photoUrl?: string | null;
  collapsed?: boolean;
}) {
  const label = name?.trim() || SOCIAL.home.you;
  return (
    <Link
      href={SOCIAL_ROUTES.profile}
      data-social-rail-account=""
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      className={cn(SOCIAL_ACCOUNT_CHIP_CLASS, collapsed && "justify-center p-2")}
    >
      <span className={SOCIAL_AVATAR_SM_CLASS}>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- same-origin chrome face
          <img src={photoUrl} alt="" className="size-full object-cover" />
        ) : (
          socialInitials(label)
        )}
      </span>
      {collapsed ? null : (
        <span className="min-w-0 truncate t-body-sm font-medium text-ink">{label}</span>
      )}
    </Link>
  );
}
