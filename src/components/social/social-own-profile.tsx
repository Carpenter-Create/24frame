"use client";

import { useEffect, type ReactNode } from "react";

import { SocialProfileIdentity } from "@/components/social/social-ui";
import { SocialWelcomeVideo } from "@/components/social/social-welcome-video";
import {
  useSocialProfileOptimistic,
  useSocialProfileSaveHop,
} from "@/components/social/use-social-profile-optimistic";
import { HOUSE_PAGE_CANVAS_CLASS } from "@/lib/house-shell";
import {
  SOCIAL_HOME_CENTER_CLASS,
  SOCIAL_HOME_LAYOUT_CLASS,
} from "@/lib/social-chrome";
import {
  SOCIAL_PROFILE_IDENTITY_EMPTY,
  clearSocialProfileOptimistic,
  mergeSocialProfileIdentity,
  releaseSocialProfileSaveHop,
  socialProfileOptimisticMatches,
  socialProfileOptimisticPublic,
  type SocialProfileIdentityView,
  type SocialProfileOptimisticSnapshot,
} from "@/lib/social-profile-edit";

type OwnProfileFace = SocialProfileIdentityView & {
  fallbackBio?: string;
  ring?: "unseen" | "live" | null;
  profileId?: string;
  stats?: { posts: number; followers: number; following: number };
  actions?: (view: SocialProfileIdentityView) => ReactNode;
};

function SocialProfileOptimisticIdentity({
  overlay,
}: {
  overlay: SocialProfileOptimisticSnapshot;
}) {
  const view = mergeSocialProfileIdentity(SOCIAL_PROFILE_IDENTITY_EMPTY, overlay);
  if (!view.handle && !view.displayName) return null;
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
    releaseSocialProfileSaveHop();
  }, []);
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

export function SocialProfileOptimisticShell({
  serverOverlay = null,
  fallback,
}: {
  serverOverlay?: SocialProfileOptimisticSnapshot | null;
  fallback: ReactNode;
}) {
  const client = useSocialProfileOptimistic();
  const overlay = client ?? serverOverlay;
  if (!socialProfileOptimisticPublic(overlay)) return fallback;
  return <SocialProfileOptimisticIdentity overlay={overlay} />;
}

export function SocialProfileSaveHop({ children }: { children: ReactNode }) {
  const overlay = useSocialProfileOptimistic();
  const hop = useSocialProfileSaveHop();
  const show = hop && socialProfileOptimisticPublic(overlay);
  if (!show || !overlay) return children;
  return (
    <div className="relative min-h-full">
      {children}
      <div
        data-social-profile-save-hop=""
        className={`absolute inset-0 z-10 min-h-full ${HOUSE_PAGE_CANVAS_CLASS}`}
      >
        <SocialProfileOptimisticIdentity overlay={overlay} />
      </div>
    </div>
  );
}
