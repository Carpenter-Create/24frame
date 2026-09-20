"use client";

import { useEffect, type ReactNode } from "react";

import { SocialProfileIdentity } from "@/components/social/social-ui";
import { SocialWelcomeVideo } from "@/components/social/social-welcome-video";
import { useSocialProfileOptimistic } from "@/components/social/use-social-profile-optimistic";
import {
  SOCIAL_HOME_CENTER_CLASS,
  SOCIAL_HOME_LAYOUT_CLASS,
} from "@/lib/social-chrome";
import {
  clearSocialProfileOptimistic,
  mergeSocialProfileIdentity,
  socialProfileOptimisticMatches,
  type SocialProfileIdentityView,
} from "@/lib/social-profile-edit";

type OwnProfileFace = SocialProfileIdentityView & {
  fallbackBio?: string;
  ring?: "unseen" | "live" | null;
  profileId?: string;
  stats?: { posts: number; followers: number; following: number };
  actions?: (view: SocialProfileIdentityView) => ReactNode;
};

export function SocialOwnProfileFace({
  fallbackBio = "",
  ring = null,
  profileId,
  stats,
  actions,
  handle,
  displayName,
  bio,
  photoUrl,
  welcomeVideoUrl,
  crafts,
  topics,
  imdbUrl,
  websiteUrl,
}: OwnProfileFace) {
  const server = {
    handle,
    displayName,
    bio,
    photoUrl,
    welcomeVideoUrl,
    crafts,
    topics,
    imdbUrl,
    websiteUrl,
  };
  const overlay = useSocialProfileOptimistic();
  const merged = mergeSocialProfileIdentity(server, overlay);
  const shownBio = merged.bio.trim() ? merged.bio : fallbackBio;
  useEffect(() => {
    if (
      overlay &&
      socialProfileOptimisticMatches(
        {
          handle,
          displayName,
          bio,
          photoUrl,
          welcomeVideoUrl,
          crafts,
          topics,
          imdbUrl,
          websiteUrl,
        },
        overlay,
      )
    ) {
      clearSocialProfileOptimistic();
    }
  }, [
    overlay,
    handle,
    displayName,
    bio,
    photoUrl,
    welcomeVideoUrl,
    crafts,
    topics,
    imdbUrl,
    websiteUrl,
  ]);

  return (
    <>
      <SocialProfileIdentity
        name={merged.displayName}
        handle={merged.handle}
        photoUrl={merged.photoUrl}
        bio={shownBio}
        roles={merged.crafts}
        topics={merged.topics}
        websiteUrl={merged.websiteUrl}
        imdbUrl={merged.imdbUrl}
        ring={ring}
        profileId={profileId}
        stats={stats}
        actions={actions ? () => actions(merged) : undefined}
      />
      {merged.welcomeVideoUrl ? <SocialWelcomeVideo src={merged.welcomeVideoUrl} /> : null}
    </>
  );
}

export function SocialProfileOptimisticShell({ fallback }: { fallback: ReactNode }) {
  const overlay = useSocialProfileOptimistic();
  if (!overlay || overlay.error || overlay.handleError) return fallback;
  const view = mergeSocialProfileIdentity(
    {
      handle: "",
      displayName: "",
      bio: "",
      photoUrl: null,
      welcomeVideoUrl: null,
      crafts: [],
      topics: [],
      imdbUrl: null,
      websiteUrl: null,
    },
    overlay,
  );
  if (!view.handle && !view.displayName) return fallback;
  return (
    <div data-social-profile-optimistic="" className={SOCIAL_HOME_LAYOUT_CLASS}>
      <div className={SOCIAL_HOME_CENTER_CLASS}>
        <SocialProfileIdentity
          name={view.displayName}
          handle={view.handle}
          photoUrl={view.photoUrl}
          bio={view.bio.trim() ? view.bio : undefined}
          roles={view.crafts}
          topics={view.topics}
          websiteUrl={view.websiteUrl}
          imdbUrl={view.imdbUrl}
        />
        {view.welcomeVideoUrl ? <SocialWelcomeVideo src={view.welcomeVideoUrl} /> : null}
      </div>
    </div>
  );
}
