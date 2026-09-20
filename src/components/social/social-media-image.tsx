"use client";

import Image from "next/image";
import type { SyntheticEvent } from "react";

import { cn } from "@/lib/cn";
import { isAnimatedRasterSrc, isSessionGatedSocialSrc } from "@/lib/social-media-display";

// Social raster SoT. Artwork stays title catalog. Chrome faces stay
// IdentityPhoto (same-origin /api/account/photo). Fill + object-cover
// into a positioned parent — same next/image contract as Artwork.

export function SocialMediaImage({
  src,
  alt = "",
  className,
  sizes,
  priority = false,
  onError,
}: {
  src: string;
  alt?: string;
  className?: string;
  sizes: string;
  priority?: boolean;
  onError?: (event: SyntheticEvent<HTMLImageElement>) => void;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={cn("object-cover", className)}
      priority={priority}
      unoptimized={isAnimatedRasterSrc(src) || isSessionGatedSocialSrc(src)}
      onError={onError}
    />
  );
}
