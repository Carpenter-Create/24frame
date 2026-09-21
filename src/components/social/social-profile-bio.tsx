"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { updateSocialBio } from "@/app/(app)/social/actions";
import { useAppQueryClient } from "@/components/query-provider";
import { applyOptimisticSocialProfilePatch, invalidateSocialQueries } from "@/lib/social-query";
import { SocialProfileEditFace } from "@/components/social/social-profile-edit-face";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Textarea } from "@/components/ui/textarea";
import { SOCIAL_PROFILE_BIO_CARD_CLASS } from "@/lib/social-chrome";
import {
  BIO_MAX,
  SOCIAL,
  SOCIAL_ROUTES,
  normalizeBio,
  socialBioCounterLabel,
  socialBioFieldValue,
} from "@/lib/social";

export function SocialProfileBioEditor({
  profileId,
  bio,
  onBack,
  onSaved,
  onPersistError,
}: {
  profileId?: string;
  bio: string;
  onBack?: () => void;
  onSaved?: (bio: string) => void;
  onPersistError?: (error: string) => void;
}) {
  const router = useRouter();
  const queryClient = useAppQueryClient();
  const [value, setValue] = useState(socialBioFieldValue(bio));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function onDone() {
    if (pending) return;
    setError("");
    const next = normalizeBio(value) ?? "";
    const form = new FormData();
    form.set("bio", value);
    setPending(true);
    if (queryClient && profileId) {
      applyOptimisticSocialProfilePatch(queryClient, profileId, { bio: next || null });
    }
    if (onSaved) onSaved(next);
    else router.push(SOCIAL_ROUTES.profileEdit);
    void updateSocialBio(form).then((result) => {
      if (!result.error) return;
      if (queryClient && profileId) invalidateSocialQueries(queryClient, { profileId });
      setError(result.error);
      onPersistError?.(result.error);
    }).finally(() => {
      setPending(false);
    });
  }

  return (
    <SocialProfileEditFace
      face="bio"
      title={SOCIAL.profile.bio}
      onBack={onBack}
      backHref={SOCIAL_ROUTES.profileEdit}
      done={{
        attr: "data-social-bio-done",
        onClick: () => void onDone(),
        pending,
        icon: true,
      }}
    >
      <div data-social-bio-form="" className={SOCIAL_PROFILE_BIO_CARD_CLASS}>
        <div className="flex items-center justify-between">
          <p className="t-label font-semibold tracking-[0.05em] text-ink-2">{SOCIAL.profile.bioLabel}</p>
          <p data-social-bio-count="" className="t-label text-ink-2">
            {socialBioCounterLabel(value)}
          </p>
        </div>
        <Textarea
          variant="bare"
          id="social-bio"
          name="bio"
          data-social-bio-textarea=""
          rows={6}
          maxLength={BIO_MAX}
          value={value}
          onChange={(e) => setValue(socialBioFieldValue(e.target.value))}
          className="min-h-[120px] resize-none leading-[22px]"
        />
      </div>
      <p data-social-bio-privacy="" className="t-body-sm text-ink-2">
        {SOCIAL.profile.bioPrivacy}
      </p>
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
    </SocialProfileEditFace>
  );
}
