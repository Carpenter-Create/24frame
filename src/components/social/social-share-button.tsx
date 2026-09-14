"use client";

import { useState } from "react";

import { SOCIAL, socialProfilePublicUrl } from "@/lib/social";
import { SOCIAL_ACTION_SECONDARY_CLASS } from "@/lib/social-chrome";

export function SocialShareButton({ handle }: { handle: string }) {
  const [copied, setCopied] = useState(false);
  const url = socialProfilePublicUrl(handle);

  return (
    <button
      type="button"
      data-social-share=""
      className={SOCIAL_ACTION_SECONDARY_CLASS}
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
      {copied ? "Copied" : SOCIAL.profile.share}
    </button>
  );
}
