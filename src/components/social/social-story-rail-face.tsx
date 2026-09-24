"use client";

import { useState } from "react";

import { SocialMediaImage } from "@/components/social/social-media-image";
import { SOCIAL_STORY_CARD_IMAGE_SIZES } from "@/lib/social-media-display";
import { socialInitials } from "@/lib/social";

// Faces map always holds /api/social/avatar/{id}. A missing object 404s.
// Same fallback as SocialAvatar: initials, never a broken image icon.

export function SocialStoryRailFace({
  name,
  photoUrl,
}: {
  name: string;
  photoUrl?: string | null;
}) {
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);
  const face = photoUrl && brokenSrc !== photoUrl ? photoUrl : null;
  if (!face) {
    return (
      <span className="flex size-full items-center justify-center t-body font-semibold text-ink-2">
        {socialInitials(name)}
      </span>
    );
  }
  return (
    <SocialMediaImage
      src={face}
      sizes={SOCIAL_STORY_CARD_IMAGE_SIZES}
      onError={() => setBrokenSrc(face)}
    />
  );
}
