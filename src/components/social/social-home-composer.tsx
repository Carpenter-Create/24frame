"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { SocialAvatar } from "@/components/social/social-avatar";
import { SocialIcon } from "@/components/social/social-icon";
import {
  SOCIAL_COMPOSER_CLASS,
  SOCIAL_COMPOSER_FIELD_CLASS,
  SOCIAL_COMPOSER_MEDIA_CLASS,
} from "@/lib/social-chrome";
import {
  socialCreateKindFromMediaFiles,
  stashSocialHomeComposerMedia,
} from "@/lib/social-home-composer";
import { SOCIAL_ICON_SIZE_COMPOSER } from "@/lib/social-icons";
import { SOCIAL_MEDIA_ACCEPT } from "@/lib/social-media";
import { SOCIAL, socialComposerPrompt, socialCreateHref } from "@/lib/social";

export function SocialHomeComposer({
  authorName,
  authorPhotoUrl,
}: {
  authorName: string;
  authorPhotoUrl?: string | null;
}) {
  const router = useRouter();

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
      <label data-social-composer-media="" className={SOCIAL_COMPOSER_MEDIA_CLASS}>
        <input
          type="file"
          accept={SOCIAL_MEDIA_ACCEPT}
          className="sr-only"
          aria-label={SOCIAL.home.attach}
          onChange={(event) => {
            const files = event.target.files;
            if (!files?.length) return;
            const kind = socialCreateKindFromMediaFiles(files);
            if (!kind) {
              event.target.value = "";
              return;
            }
            stashSocialHomeComposerMedia(files);
            event.target.value = "";
            router.push(socialCreateHref(kind));
          }}
        />
        <SocialIcon name="image" size={SOCIAL_ICON_SIZE_COMPOSER} className="text-ink-2" />
      </label>
    </div>
  );
}
