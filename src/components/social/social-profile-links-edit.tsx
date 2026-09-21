"use client";

import { SocialProfileEditFace } from "@/components/social/social-profile-edit-face";
import { Input } from "@/components/ui/input";
import {
  SOCIAL_PROFILE_EDIT_CARD_CLASS,
  SOCIAL_PROFILE_EDIT_LABEL_CLASS,
  SOCIAL_PROFILE_EDIT_SECTION_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL } from "@/lib/social";
import { SOCIAL_PROFILE_LINKS_MAX } from "@/lib/social-profile-links";

export function SocialProfileLinksField({
  value,
  onChange,
}: {
  value: readonly string[];
  onChange: (next: string[]) => void;
}) {
  const drafts = value.length > 0 ? [...value] : [""];

  return (
    <div data-social-profile-edit-links="" className={SOCIAL_PROFILE_EDIT_CARD_CLASS}>
      <div className={SOCIAL_PROFILE_EDIT_SECTION_CLASS}>
        <p className={SOCIAL_PROFILE_EDIT_LABEL_CLASS}>{SOCIAL.profile.links}</p>
        <div className="flex min-w-0 flex-col gap-3">
          {drafts.map((item, index) => (
            <div
              key={`social-edit-link-${index}`}
              className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center"
            >
              <Input
                variant="bare"
                id={index === 0 ? "social-edit-link-0" : undefined}
                value={item}
                placeholder={SOCIAL.profile.linkPlaceholder}
                onChange={(e) => {
                  const next = [...drafts];
                  next[index] = e.target.value;
                  onChange(next);
                }}
                className="min-w-0 flex-1"
                autoComplete="url"
              />
              {drafts.length > 1 ? (
                <button
                  type="button"
                  data-social-profile-edit-link-remove=""
                  onClick={() => onChange(drafts.filter((_, i) => i !== index))}
                  className="t-body-sm text-ink-2"
                >
                  {SOCIAL.profile.removeLink}
                </button>
              ) : null}
            </div>
          ))}
          {drafts.length < SOCIAL_PROFILE_LINKS_MAX ? (
            <button
              type="button"
              data-social-profile-edit-link-add=""
              onClick={() => onChange([...drafts, ""])}
              className="self-start t-body-sm font-medium text-ink"
            >
              {SOCIAL.profile.addLink}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function SocialProfileLinksEditor({
  value,
  onChange,
  onBack,
}: {
  value: readonly string[];
  onChange: (next: string[]) => void;
  onBack: () => void;
}) {
  return (
    <SocialProfileEditFace face="links" title={SOCIAL.profile.links} onBack={onBack}>
      <SocialProfileLinksField value={value} onChange={onChange} />
    </SocialProfileEditFace>
  );
}
