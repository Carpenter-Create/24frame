import { redirect } from "next/navigation";

import { InlineNotice } from "@/components/ui/inline-notice";
import { SocialStoriesEmpty } from "@/components/social/social-empty";
import { SocialForYouRail } from "@/components/social/social-for-you";
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
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export default async function SocialStoriesPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const supabase = await createClient();
  const profile = await ensureOwnSocialProfile(supabase, ctx.user);
  const followees = profile
    ? await loadFolloweeIds(supabase, ctx.user.id)
    : { ids: [] as string[], truncated: false };
  const authorIds = followingAuthorIds(ctx.user.id, followees.ids);
  const [storiesPage, suggested] = await Promise.all([
    loadLiveStories(supabase, authorIds),
    loadSuggestedPeople(supabase, [ctx.user.id, ...followees.ids]),
  ]);
  const peopleIds = [
    ...new Set([
      ctx.user.id,
      ...storiesPage.stories.map((story) => story.author_id),
      ...suggested.map((person) => person.id),
    ]),
  ];
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
    <div data-social-stories-index="" className={SOCIAL_HOME_LAYOUT_CLASS}>
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
      <SocialForYouRail people={suggested} faces={faces} />
    </div>
  );
}
