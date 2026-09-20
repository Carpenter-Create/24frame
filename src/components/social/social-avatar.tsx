"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";
import { IDENTITY_AVATAR_CLASS } from "@/lib/house-sheet";
import {
  SOCIAL_AVATAR_LG_CLASS,
  SOCIAL_AVATAR_PROFILE_CLASS,
  SOCIAL_AVATAR_SM_CLASS,
} from "@/lib/social-chrome";
import { socialInitials } from "@/lib/social";

export function SocialAvatar({
  name,
  photoUrl,
  ring = null,
  size = "md",
  className,
}: {
  name: string;
  photoUrl?: string | null;
  ring?: "unseen" | "live" | null;
  size?: "sm" | "md" | "lg" | "profile";
  className?: string;
}) {
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);
  const face = photoUrl && brokenSrc !== photoUrl ? photoUrl : null;
  const box =
    size === "lg"
      ? SOCIAL_AVATAR_LG_CLASS
      : size === "profile"
        ? SOCIAL_AVATAR_PROFILE_CLASS
        : size === "sm"
          ? SOCIAL_AVATAR_SM_CLASS
          : IDENTITY_AVATAR_CLASS;
  return (
    <div
      data-social-avatar=""
      data-social-avatar-ring={ring ?? undefined}
      className={cn(
        box,
        face ? "overflow-hidden" : null,
        ring ? "ring-2 ring-accent ring-offset-2 ring-offset-[var(--bg)]" : null,
        className,
      )}
    >
      {face ? (
        // eslint-disable-next-line @next/next/no-img-element -- same-origin or short-lived signed GET; onError drops a miss
        <img src={face} alt="" className="size-full object-cover" onError={() => setBrokenSrc(face)} />
      ) : (
        socialInitials(name)
      )}
    </div>
  );
}
