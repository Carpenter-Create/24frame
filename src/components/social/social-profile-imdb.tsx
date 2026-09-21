"use client";

import { SocialProfileEditFace } from "@/components/social/social-profile-edit-face";
import { Input } from "@/components/ui/input";
import {
  SOCIAL_PROFILE_EDIT_CARD_CLASS,
  SOCIAL_PROFILE_EDIT_HELP_CLASS,
  SOCIAL_PROFILE_EDIT_LABEL_CLASS,
  SOCIAL_PROFILE_EDIT_ROW_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL } from "@/lib/social";

export function SocialProfileImdbField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div data-social-profile-edit-imdb="" className={SOCIAL_PROFILE_EDIT_CARD_CLASS}>
      <div className={`${SOCIAL_PROFILE_EDIT_ROW_CLASS} flex-col gap-2`}>
        <label htmlFor="social-edit-imdb" className={SOCIAL_PROFILE_EDIT_LABEL_CLASS}>
          {SOCIAL.profile.imdb}
        </label>
        <Input
          variant="bare"
          id="social-edit-imdb"
          name="imdb_url"
          value={value}
          placeholder={SOCIAL.profile.imdbPlaceholder}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0"
          autoComplete="url"
        />
        <p className={SOCIAL_PROFILE_EDIT_HELP_CLASS}>{SOCIAL.profile.imdbHint}</p>
      </div>
    </div>
  );
}

export function SocialProfileImdbEditor({
  value,
  onChange,
  onBack,
}: {
  value: string;
  onChange: (next: string) => void;
  onBack: () => void;
}) {
  return (
    <SocialProfileEditFace face="imdb" title={SOCIAL.profile.imdb} onBack={onBack}>
      <SocialProfileImdbField value={value} onChange={onChange} />
    </SocialProfileEditFace>
  );
}
