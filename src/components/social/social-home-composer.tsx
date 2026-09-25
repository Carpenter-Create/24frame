"use client";

import { SocialAvatar } from "@/components/social/social-avatar";
import { SocialCreateSheet } from "@/components/social/social-create-sheet";
import { useSocialCreateMediaPick } from "@/components/social/social-create-media";
import { SocialIcon } from "@/components/social/social-icon";
import {
  SOCIAL_COMPOSER_AFFORDANCE_CLASS,
  SOCIAL_COMPOSER_AFFORDANCE_ROW_CLASS,
  SOCIAL_COMPOSER_CLASS,
  SOCIAL_COMPOSER_FIELD_CLASS,
  SOCIAL_COMPOSER_ROW_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL_CREATE_CAMERA_ACCEPT } from "@/lib/social-create-media";
import { SOCIAL_ICON_SIZE_SEARCH } from "@/lib/social-icons";
import { SOCIAL, socialComposerPrompt } from "@/lib/social";

// FB-row lock v1.3. One row on phone and desktop. Band is 32.
// Share something has no drawn edge. Photo and Camera stay glyph 16, hit 32, flush.
// Prompt and avatar open the Create sheet default face.
// Photo reuses the Create media library pick. Camera reuses that pick
// with capture=environment. Icon only — no Photo/Camera labels.
// No second row, no Live / Feeling strip, no new sheet.

function ComposerAffordance({
  affordance,
  icon,
  label,
  capture,
}: {
  affordance: "photo" | "camera";
  icon: "image" | "camera";
  label: string;
  capture?: "environment";
}) {
  const { openPicker, input } = useSocialCreateMediaPick(
    capture
      ? { capture, accept: SOCIAL_CREATE_CAMERA_ACCEPT, multiple: false, label }
      : { label },
  );
  return (
    <>
      <button
        type="button"
        data-social-composer-affordance={affordance}
        aria-label={label}
        className={SOCIAL_COMPOSER_AFFORDANCE_CLASS}
        onClick={openPicker}
      >
        <SocialIcon name={icon} size={SOCIAL_ICON_SIZE_SEARCH} className="text-ink-2" />
      </button>
      {input}
    </>
  );
}

export function SocialHomeComposer({
  authorName,
  authorPhotoUrl,
}: {
  authorName: string;
  authorPhotoUrl?: string | null;
}) {
  return (
    <div data-social-home-composer="" className={SOCIAL_COMPOSER_CLASS}>
      <SocialCreateSheet
        trigger={
          <button
            type="button"
            data-social-composer-prompt-row=""
            data-social-create-sheet="composer"
            aria-label={SOCIAL.create.title}
            className={SOCIAL_COMPOSER_ROW_CLASS}
          >
            <SocialAvatar name={authorName} photoUrl={authorPhotoUrl} size="sm" className="size-8" />
            <span data-social-composer-prompt="" className={`${SOCIAL_COMPOSER_FIELD_CLASS} shadow-none`}>
              {socialComposerPrompt(authorName)}
            </span>
          </button>
        }
      />
      <div data-social-composer-affordances="" className={SOCIAL_COMPOSER_AFFORDANCE_ROW_CLASS}>
        <ComposerAffordance affordance="photo" icon="image" label={SOCIAL.home.composerPhoto} />
        <ComposerAffordance
          affordance="camera"
          icon="camera"
          label={SOCIAL.home.composerCamera}
          capture="environment"
        />
      </div>
    </div>
  );
}
