"use client";

import { createPortal } from "react-dom";

import { SOCIAL } from "@/lib/social";

// Send craft v1.4. Exact viewport center. Dark capsule. Story stays undimmed.
export function SocialStorySentToast() {
  const node = (
    <div
      data-social-story-sent-toast=""
      className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center"
    >
      <p
        data-social-story-sent=""
        role="status"
        aria-live="polite"
        className="rounded-[8px] bg-[#181820] px-4 py-2 t-body-sm font-medium text-white shadow-none"
      >
        {SOCIAL.stories.sent}
      </p>
    </div>
  );
  return typeof document !== "undefined" ? createPortal(node, document.body) : node;
}
