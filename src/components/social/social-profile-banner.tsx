import type { ReactNode } from "react";

import { SocialMediaImage } from "@/components/social/social-media-image";
import { cn } from "@/lib/cn";
import {
  SOCIAL_PROFILE_COVER_CLASS,
  SOCIAL_PROFILE_COVER_EMPTY_CLASS,
  SOCIAL_PROFILE_COVER_IMAGE_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL_PROFILE_COVER_IMAGE_SIZES } from "@/lib/social-media-display";
import { socialProfileCoverPhoto } from "@/lib/social-profile-cover";

/** Visitor cover. No photo → no band. Owner empty wash lives on SocialProfileCoverBlock. */
export function SocialProfileBanner({ coverUrl }: { coverUrl?: string | null }) {
  const photo = socialProfileCoverPhoto(coverUrl);
  if (!photo) return null;
  return (
    <div
      data-social-profile-cover=""
      className={cn(SOCIAL_PROFILE_COVER_CLASS, "bg-surface-muted")}
    >
      <SocialMediaImage
        src={photo}
        sizes={SOCIAL_PROFILE_COVER_IMAGE_SIZES}
        priority
        className={SOCIAL_PROFILE_COVER_IMAGE_CLASS}
      />
    </div>
  );
}

export function SocialProfileCoverBlock({
  coverUrl,
  coverEdit,
}: {
  coverUrl?: string | null;
  coverEdit?: ReactNode;
}) {
  const photo = socialProfileCoverPhoto(coverUrl);
  return (
    <div data-social-profile-cover-block="" className="relative">
      <div
        data-social-profile-cover=""
        data-social-profile-cover-empty={photo ? undefined : ""}
        className={cn(
          SOCIAL_PROFILE_COVER_CLASS,
          !photo ? SOCIAL_PROFILE_COVER_EMPTY_CLASS : "bg-surface-muted",
        )}
      >
        {photo ? (
          <SocialMediaImage
            src={photo}
            sizes={SOCIAL_PROFILE_COVER_IMAGE_SIZES}
            priority
            className={SOCIAL_PROFILE_COVER_IMAGE_CLASS}
          />
        ) : null}
      </div>
      {coverEdit}
    </div>
  );
}
