"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { updateSocialBio } from "@/app/(app)/social/actions";
import { SocialIcon } from "@/components/social/social-icon";
import { InlineNotice } from "@/components/ui/inline-notice";
import {
  SOCIAL_PROFILE_BIO_CARD_CLASS,
  SOCIAL_PROFILE_BIO_DONE_CLASS,
  SOCIAL_PROFILE_BIO_TEXTAREA_CLASS,
  SOCIAL_PROFILE_EDIT_BACK_CLASS,
  SOCIAL_PROFILE_EDIT_BODY_CLASS,
  SOCIAL_PROFILE_EDIT_HEADER_CLASS,
  SOCIAL_PROFILE_EDIT_HOST_CLASS,
  SOCIAL_PROFILE_EDIT_SHEET_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL_ICON_SIZE_HEADER } from "@/lib/social-icons";
import {
  BIO_MAX,
  SOCIAL,
  SOCIAL_ROUTES,
  socialBioCounterLabel,
  socialBioFieldValue,
} from "@/lib/social";

export function SocialProfileBioEditor({ bio }: { bio: string }) {
  const router = useRouter();
  const [value, setValue] = useState(socialBioFieldValue(bio));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onDone() {
    setError("");
    setPending(true);
    const form = new FormData();
    form.set("bio", value);
    const result = await updateSocialBio(form);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(SOCIAL_ROUTES.profileEdit);
  }

  return (
    <div data-social-profile-bio="" className={SOCIAL_PROFILE_EDIT_HOST_CLASS}>
      <div className={SOCIAL_PROFILE_EDIT_SHEET_CLASS}>
        <header data-social-profile-bio-header="" className={SOCIAL_PROFILE_EDIT_HEADER_CLASS}>
          <Link
            href={SOCIAL_ROUTES.profileEdit}
            className={SOCIAL_PROFILE_EDIT_BACK_CLASS}
            aria-label={SOCIAL.profile.back}
          >
            <SocialIcon name="caret-left" size={SOCIAL_ICON_SIZE_HEADER} />
          </Link>
          <h1 className="min-w-0 flex-1 text-center text-[17px] font-semibold text-ink">
            {SOCIAL.profile.bio}
          </h1>
          <button
            type="button"
            data-social-bio-done=""
            disabled={pending}
            onClick={() => void onDone()}
            className={SOCIAL_PROFILE_BIO_DONE_CLASS}
            aria-label={SOCIAL.profile.done}
          >
            <SocialIcon name="check" size={18} />
          </button>
        </header>
        <div className={SOCIAL_PROFILE_EDIT_BODY_CLASS}>
          <div data-social-bio-form="" className={SOCIAL_PROFILE_BIO_CARD_CLASS}>
            <div className="flex items-center justify-between">
              <p className="t-label font-semibold tracking-[0.05em] text-ink-2">{SOCIAL.profile.bioLabel}</p>
              <p data-social-bio-count="" className="t-label text-ink-2">
                {socialBioCounterLabel(value)}
              </p>
            </div>
            <textarea
              id="social-bio"
              name="bio"
              data-social-bio-textarea=""
              rows={6}
              maxLength={BIO_MAX}
              value={value}
              onChange={(e) => setValue(socialBioFieldValue(e.target.value))}
              className={SOCIAL_PROFILE_BIO_TEXTAREA_CLASS}
            />
          </div>
          <p data-social-bio-privacy="" className="t-body-sm text-ink-2">
            {SOCIAL.profile.bioPrivacy}
          </p>
          {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
        </div>
      </div>
    </div>
  );
}
