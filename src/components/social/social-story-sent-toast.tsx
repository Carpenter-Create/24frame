"use client";

import { createPortal } from "react-dom";

import { InlineNotice } from "@/components/ui/inline-notice";
import { SOCIAL } from "@/lib/social";

// --space-6 is 24px. Bottom-center, max 280, house notice. No green, no shadow.
export function SocialStorySentToast() {
  const node = (
    <div
      data-social-story-sent-toast=""
      className="pointer-events-none fixed inset-x-0 bottom-[var(--space-6)] z-50 flex justify-center px-[var(--space-4)]"
    >
      <InlineNotice
        data-social-story-sent=""
        aria-live="polite"
        className="w-full max-w-[280px] text-center shadow-none"
      >
        {SOCIAL.stories.sent}
      </InlineNotice>
    </div>
  );
  return typeof document !== "undefined" ? createPortal(node, document.body) : node;
}
