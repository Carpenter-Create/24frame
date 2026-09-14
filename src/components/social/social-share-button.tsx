"use client";

import { useState } from "react";

import { SocialIcon } from "@/components/social/social-icon";
import { InlineNotice } from "@/components/ui/inline-notice";
import { cn } from "@/lib/cn";
import { SOCIAL, socialProfilePublicUrl } from "@/lib/social";
import { SOCIAL_SHARE_CLASS, SOCIAL_SHARE_TOAST_CLASS } from "@/lib/social-chrome";
import { SOCIAL_ICON_SIZE_SHARE } from "@/lib/social-icons";

export function SocialShareButton({
  handle,
  stretch = false,
}: {
  handle: string;
  stretch?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const url = socialProfilePublicUrl(handle);

  return (
    <>
      <button
        type="button"
        data-social-share=""
        data-social-share-url={url}
        className={cn(SOCIAL_SHARE_CLASS, stretch && "min-w-0 flex-1 md:flex-none")}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          } catch {
            setCopied(false);
          }
        }}
      >
        <SocialIcon name="share-network" size={SOCIAL_ICON_SIZE_SHARE} />
        {SOCIAL.profile.share}
      </button>
      {copied ? (
        <InlineNotice data-social-share-toast="" className={SOCIAL_SHARE_TOAST_CLASS}>
          {SOCIAL.profile.shareCopied}
        </InlineNotice>
      ) : null}
    </>
  );
}
