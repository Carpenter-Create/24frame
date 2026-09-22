"use client";

import { useState } from "react";

import { SocialIcon } from "@/components/social/social-icon";
import { SocialShareSheet } from "@/components/social/social-share-sheet";
import { SOCIAL, socialProfilePublicUrl } from "@/lib/social";
import { SOCIAL_SHARE_CLASS } from "@/lib/social-chrome";
import { SOCIAL_ICON_SIZE_SHARE } from "@/lib/social-icons";

export function SocialShareButton({ handle }: { handle: string }) {
  const [open, setOpen] = useState(false);
  const url = socialProfilePublicUrl(handle);

  return (
    <>
      <button
        type="button"
        data-social-share=""
        data-social-share-url={url}
        aria-label={SOCIAL.profile.shareProfile}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={SOCIAL_SHARE_CLASS}
        onClick={() => setOpen(true)}
      >
        <SocialIcon name="share-network" size={SOCIAL_ICON_SIZE_SHARE} />
      </button>
      <SocialShareSheet handle={handle} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
