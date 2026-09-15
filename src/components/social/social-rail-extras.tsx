import Link from "next/link";

import { SOCIAL_ACCOUNT_CHIP_CLASS, SOCIAL_AVATAR_SM_CLASS } from "@/lib/social-chrome";
import { SOCIAL, SOCIAL_ROUTES, socialInitials } from "@/lib/social";

export function SocialRailAccountChip({
  name,
  photoUrl,
}: {
  name?: string | null;
  photoUrl?: string | null;
}) {
  const label = name?.trim() || SOCIAL.home.you;
  return (
    <Link href={SOCIAL_ROUTES.profile} data-social-rail-account="" className={SOCIAL_ACCOUNT_CHIP_CLASS}>
      <span className={SOCIAL_AVATAR_SM_CLASS}>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- same-origin chrome face
          <img src={photoUrl} alt="" className="size-full object-cover" />
        ) : (
          socialInitials(label)
        )}
      </span>
      <span className="min-w-0 truncate text-[12px] font-semibold text-ink">{label}</span>
    </Link>
  );
}
