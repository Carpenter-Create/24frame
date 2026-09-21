import type { ReactNode } from "react";

import { SocialMediaImage } from "@/components/social/social-media-image";
import { cn } from "@/lib/cn";
import {
  SOCIAL_PROFILE_COVER_CLASS,
  SOCIAL_PROFILE_COVER_EMPTY_CLASS,
  SOCIAL_PROFILE_COVER_IMAGE_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL_PROFILE_COVER_IMAGE_SIZES } from "@/lib/social-media-display";

export function SocialProfileBanner({
  coverUrl,
  coverEdit,
}: {
  coverUrl?: string | null;
  coverEdit?: ReactNode;
}) {
  const photo = coverUrl?.trim() ? coverUrl : null;
  return (
    <div
      data-social-profile-cover=""
      data-social-profile-cover-empty={photo ? undefined : ""}
      className={cn(SOCIAL_PROFILE_COVER_CLASS, !photo ? SOCIAL_PROFILE_COVER_EMPTY_CLASS : "bg-surface-muted")}
    >
      {photo ? (
        <SocialMediaImage
          src={photo}
          sizes={SOCIAL_PROFILE_COVER_IMAGE_SIZES}
          priority
          className={SOCIAL_PROFILE_COVER_IMAGE_CLASS}
        />
      ) : null}
      {coverEdit}
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
  const photo = coverUrl?.trim() ? coverUrl : null;
  return (
    <div data-social-profile-cover-block="" className="relative">
      <div
        data-social-profile-cover=""
        data-social-profile-cover-empty={photo ? undefined : ""}
        className={cn(SOCIAL_PROFILE_COVER_CLASS, !photo ? SOCIAL_PROFILE_COVER_EMPTY_CLASS : "bg-surface-muted")}
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
