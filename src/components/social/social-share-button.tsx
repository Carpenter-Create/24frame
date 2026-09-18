"use client";

import { useState } from "react";

import { SocialIcon } from "@/components/social/social-icon";
import { SocialShareSheet } from "@/components/social/social-share-sheet";
import { cn } from "@/lib/cn";
import { SOCIAL, socialProfilePublicUrl } from "@/lib/social";
import { SOCIAL_SHARE_CLASS } from "@/lib/social-chrome";
import { SOCIAL_ICON_SIZE_SHARE } from "@/lib/social-icons";

export function SocialShareButton({
  handle,
  stretch = false,
}: {
  handle: string;
  stretch?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const url = socialProfilePublicUrl(handle);

  return (
    <>
      <button
        type="button"
        data-social-share=""
        data-social-share-url={url}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(SOCIAL_SHARE_CLASS, stretch && "min-w-0 flex-1 md:flex-none")}
        onClick={() => setOpen(true)}
      >
        <SocialIcon name="share-network" size={SOCIAL_ICON_SIZE_SHARE} />
        {SOCIAL.profile.share}
      </button>
      <SocialShareSheet handle={handle} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
