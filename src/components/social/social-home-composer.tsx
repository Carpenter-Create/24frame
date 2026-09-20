"use client";

import Link from "next/link";

import { SocialAvatar } from "@/components/social/social-avatar";
import { SocialCreateMenu } from "@/components/social/social-create-menu";
import { SocialIcon } from "@/components/social/social-icon";
import {
  SOCIAL_COMPOSER_CLASS,
  SOCIAL_COMPOSER_FIELD_CLASS,
  SOCIAL_COMPOSER_MEDIA_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL_ICON_SIZE_COMPOSER } from "@/lib/social-icons";
import { SOCIAL, socialComposerPrompt, socialCreateHref } from "@/lib/social";

export function SocialHomeComposer({
  authorName,
  authorPhotoUrl,
}: {
  authorName: string;
  authorPhotoUrl?: string | null;
}) {
  return (
    <div data-social-home-composer="" className={SOCIAL_COMPOSER_CLASS}>
      <SocialAvatar name={authorName} photoUrl={authorPhotoUrl} size="sm" />
      <Link
        href={socialCreateHref("text")}
        data-social-composer-prompt=""
        className={SOCIAL_COMPOSER_FIELD_CLASS}
      >
        {socialComposerPrompt(authorName)}
      </Link>
      <div className="hidden md:flex">
        <SocialCreateMenu
          trigger={
            <button
              type="button"
              data-social-create-menu=""
              aria-label={SOCIAL.create.title}
              className={SOCIAL_COMPOSER_MEDIA_CLASS}
            >
              <SocialIcon name="plus" size={SOCIAL_ICON_SIZE_COMPOSER} className="text-ink-2" />
            </button>
          }
        />
      </div>
    </div>
  );
}
