import { Suspense } from "react";

import { InlineNotice } from "@/components/ui/inline-notice";
import { SocialStoriesEmpty } from "@/components/social/social-empty";
import { SocialForYouRail } from "@/components/social/social-for-you";
import { SocialForYouSkeleton } from "@/components/social/social-skeletons";
import { SocialStoriesRail } from "@/components/social/social-stories-rail";
import { SOCIAL_HOME_CENTER_CLASS, SOCIAL_HOME_LAYOUT_CLASS } from "@/lib/social-chrome";
import { signedAvatarUrls } from "@/lib/s3-avatars";
import { followingAuthorIds } from "@/lib/social-home";
import { SOCIAL } from "@/lib/social";
import {
  groupStoryRail,
  loadFolloweeIds,
  loadLiveStories,
  loadProfilesByIds,
  loadSuggestedPeople,
  loadViewedStoryIds,
} from "@/lib/social-feed";
import { ensureOwnSocialProfile } from "@/lib/social-profile";
import { requireSocialSession, type SocialSession } from "@/lib/social-session";

export default async function SocialStoriesPage() {
  const session = await requireSocialSession();
  return (
    <div data-social-stories-index="" className={SOCIAL_HOME_LAYOUT_CLASS}>
      <SocialStoriesMain session={session} />
      <Suspense fallback={<SocialForYouSkeleton />}>
        <SocialStoriesForYouSlot session={session} />
      </Suspense>
    </div>
  );
}

async function SocialStoriesMain({ session }: { session: SocialSession }) {
  const { ctx, supabase } = session;
  const [profile, followees] = await Promise.all([
    ensureOwnSocialProfile(supabase, ctx.user),
    loadFolloweeIds(supabase, ctx.user.id),
  ]);
  const authorIds = followingAuthorIds(ctx.user.id, followees.ids);
  const storiesPage = await loadLiveStories(supabase, authorIds);
  const peopleIds = [...new Set([ctx.user.id, ...storiesPage.stories.map((story) => story.author_id)])];
  const [viewed, authors, faces] = await Promise.all([
    profile
      ? loadViewedStoryIds(
          supabase,
          ctx.user.id,
          storiesPage.stories.map((story) => story.id),
        )
      : Promise.resolve(new Set<string>()),
    loadProfilesByIds(supabase, peopleIds),
    signedAvatarUrls(peopleIds),
  ]);
  const rail = groupStoryRail(storiesPage.stories, viewed);

  return (
    <div className={SOCIAL_HOME_CENTER_CLASS}>
      <h1 className="sr-only">{SOCIAL.stories.title}</h1>
      <SocialStoriesRail
        cards={rail}
        authors={authors}
        faces={faces}
        canCreate={!!profile}
        surface="stories"
      />
      {storiesPage.truncated ? (
        <InlineNotice tone="info" data-social-stories-truncated="">
          {SOCIAL.home.truncatedStories}
        </InlineNotice>
      ) : null}
      {rail.length === 0 ? <SocialStoriesEmpty /> : null}
    </div>
  );
}

async function SocialStoriesForYouSlot({ session }: { session: SocialSession }) {
  const { ctx, supabase } = session;
  const followees = await loadFolloweeIds(supabase, ctx.user.id);
  const suggested = await loadSuggestedPeople(supabase, [ctx.user.id, ...followees.ids]);
  const faces = suggested.length > 0 ? await signedAvatarUrls(suggested.map((person) => person.id)) : new Map();
  return <SocialForYouRail people={suggested} faces={faces} />;
}
