import { redirect } from "next/navigation";

import { InlineNotice } from "@/components/ui/inline-notice";
import { SocialEmpty } from "@/components/social/social-empty";
import { SocialStoriesRail } from "@/components/social/social-stories-rail";
import { SOCIAL_PAGE_CLASS } from "@/lib/social-chrome";
import { signedAvatarUrls } from "@/lib/s3-avatars";
import { followingAuthorIds } from "@/lib/social-home";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import {
  groupStoryRail,
  loadFolloweeIds,
  loadLiveStories,
  loadProfilesByIds,
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
  const storiesPage = await loadLiveStories(supabase, authorIds);
  const viewed = profile
    ? await loadViewedStoryIds(
        supabase,
        ctx.user.id,
        storiesPage.stories.map((story) => story.id),
      )
    : new Set<string>();
  const rail = groupStoryRail(storiesPage.stories, viewed);
  const peopleIds = [...new Set([ctx.user.id, ...rail.map((card) => card.authorId)])];
  const [authors, faces] = await Promise.all([
    loadProfilesByIds(supabase, peopleIds),
    signedAvatarUrls(peopleIds),
  ]);

  return (
    <div data-social-stories-index="" className={SOCIAL_PAGE_CLASS}>
      <h1 className="sr-only">{SOCIAL.stories.title}</h1>
      <SocialStoriesRail cards={rail} authors={authors} faces={faces} canCreate={!!profile} />
      {storiesPage.truncated ? (
        <InlineNotice tone="info" data-social-stories-truncated="">
          {SOCIAL.home.truncatedStories}
        </InlineNotice>
      ) : null}
      {rail.length === 0 ? (
        <div data-social-stories-empty="">
          <SocialEmpty
            icon="camera"
            title={SOCIAL.stories.emptyRail}
            hint={SOCIAL.stories.emptyHint}
            action={{ href: SOCIAL_ROUTES.storiesNew, label: SOCIAL.stories.create }}
          />
        </div>
      ) : null}
    </div>
  );
}
