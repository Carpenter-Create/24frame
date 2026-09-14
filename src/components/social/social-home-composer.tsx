import Link from "next/link";

import { SocialIcon } from "@/components/social/social-icon";
import { cn } from "@/lib/cn";
import {
  SOCIAL_AVATAR_SM_CLASS,
  SOCIAL_COMPOSER_ACTION_CLASS,
  SOCIAL_COMPOSER_CLASS,
  SOCIAL_COMPOSER_FIELD_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL_ICON_SIZE_COMPOSER } from "@/lib/social-icons";
import {
  SOCIAL,
  socialComposerPrompt,
  socialCreateHref,
  socialInitials,
  type SocialCreateKind,
} from "@/lib/social";

const ACTIONS: { kind: SocialCreateKind; icon: "image" | "film-strip" | "squares-four" }[] = [
  { kind: "photo", icon: "image" },
  { kind: "video", icon: "film-strip" },
  { kind: "text", icon: "squares-four" },
];

export function SocialHomeComposer({
  authorName,
  authorPhotoUrl,
}: {
  authorName: string;
  authorPhotoUrl?: string | null;
}) {
  return (
    <div data-social-home-composer="" className={SOCIAL_COMPOSER_CLASS}>
      <div className="flex items-center gap-2.5">
        <span className={SOCIAL_AVATAR_SM_CLASS}>
          {authorPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- short-lived signed GET from the private avatars bucket
            <img src={authorPhotoUrl} alt="" className="size-full object-cover" />
          ) : (
            socialInitials(authorName)
          )}
        </span>
        <Link
          href={socialCreateHref()}
          data-social-composer-prompt=""
          className={SOCIAL_COMPOSER_FIELD_CLASS}
        >
          <span className="md:hidden">{SOCIAL.home.composerPrompt}</span>
          <span className="hidden md:inline">{socialComposerPrompt(authorName)}</span>
        </Link>
      </div>
      <div className="flex items-center justify-between gap-2 md:justify-start">
        {ACTIONS.map((action) => (
          <Link
            key={action.kind}
            href={socialCreateHref(action.kind)}
            data-social-composer-action={action.kind}
            className={cn(SOCIAL_COMPOSER_ACTION_CLASS, "text-ink-2")}
          >
            <SocialIcon name={action.icon} size={SOCIAL_ICON_SIZE_COMPOSER} className="text-ink-2" />
            <span>
              {action.kind === "photo"
                ? SOCIAL.create.photo
                : action.kind === "video"
                  ? SOCIAL.create.video
                  : SOCIAL.create.text}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
