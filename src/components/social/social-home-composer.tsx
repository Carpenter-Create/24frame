"use client";

import { SocialAvatar } from "@/components/social/social-avatar";
import { SocialCreateSheet } from "@/components/social/social-create-sheet";
import { SOCIAL_COMPOSER_CLASS, SOCIAL_COMPOSER_FIELD_CLASS } from "@/lib/social-chrome";
import { SOCIAL, socialComposerPrompt } from "@/lib/social";

// Share stage on phone and desktop. Avatar 40 + Share something pill
// on a surface card. The whole stage opens the Create sheet SoT
// (Photo · Video · Write · Go live). Create dock stays.
export function SocialHomeComposer({
  authorName,
  authorPhotoUrl,
}: {
  authorName: string;
  authorPhotoUrl?: string | null;
}) {
  return (
    <SocialCreateSheet
      trigger={
        <button
          type="button"
          data-social-home-composer=""
          data-social-create-sheet="composer"
          aria-label={SOCIAL.create.title}
          className={SOCIAL_COMPOSER_CLASS}
        >
          <SocialAvatar name={authorName} photoUrl={authorPhotoUrl} size="sm" className="size-10" />
          <span data-social-composer-prompt="" className={`${SOCIAL_COMPOSER_FIELD_CLASS} text-ink-2`}>
            {socialComposerPrompt(authorName)}
          </span>
        </button>
      }
    />
  );
}
