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
  fit = "cover",
  loading,
  onLoad,
  onError,
}: {
  src: string;
  alt?: string;
  className?: string;
  sizes: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  /** Eager for images inside a horizontal scroller. iOS Safari drops lazy loads there. */
  loading?: "eager" | "lazy";
  onLoad?: (event: SyntheticEvent<HTMLImageElement>) => void;
  onError?: (event: SyntheticEvent<HTMLImageElement>) => void;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={cn(fit === "contain" ? "object-contain object-center" : "object-cover object-center", className)}
      priority={priority}
      loading={loading}
      unoptimized={isAnimatedRasterSrc(src) || isSessionGatedSocialSrc(src)}
      onLoad={onLoad}
      onError={onError}
    />
  );
}
