import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SOCIAL } from "@/lib/social";

const house = vi.hoisted(() => ({
  current: null as null | {
    href: string;
    search: string;
    nextPathname: string;
    nextSearch: string;
  },
}));

vi.mock("@/components/chrome/house-client-shell", () => ({
  useHouseClient: () => house.current,
}));

import { SocialProfileTabPanels } from "./social-profile-tab-panels";

const post = {
  id: "p1",
  body: "Engine note",
  likeCount: 0,
  liked: false,
  createdAt: "2026-09-21T12:00:00.000Z",
  authorId: "u1",
  authorHandle: "ada",
  authorName: "Ada Lovelace",
  authorPhotoUrl: null,
  groupSlug: null,
  groupName: null,
  canLike: true,
  media: [],
};

const activity = {
  posts: [post],
  imageIds: [],
  videoIds: [],
  postsTruncated: false,
  comments: [],
  commentsTruncated: false,
};

describe("SocialProfileTabPanels", () => {
  it("paints the RSC seed when the shell has not taken the address", () => {
    house.current = null;
    const html = renderToStaticMarkup(
      <SocialProfileTabPanels
        baseHref="/social/profile"
        seedTab="credits"
        seedActivity="posts"
        creditsHint={SOCIAL.profile.creditsEmptyOwnHint}
        highlights={[]}
        topics={[]}
        interestsOwner
        activity={activity}
      />,
    );
    expect(html).toContain('data-social-profile-tab="credits"');
    expect(html).toContain('data-social-icon="film-slate"');
    expect(html).toContain(SOCIAL.profile.creditsEmpty);
    expect(html).not.toContain("Engine note");
  });

  it("swaps the panel from the owned house search without a new screen", () => {
    house.current = {
      href: "/social/profile?tab=credits",
      search: "?tab=credits",
      nextPathname: "/social/profile",
      nextSearch: "",
    };
    const html = renderToStaticMarkup(
      <SocialProfileTabPanels
        baseHref="/social/profile"
        seedTab="activity"
        seedActivity="posts"
        creditsHint={SOCIAL.profile.creditsEmptyOwnHint}
        highlights={[]}
        topics={[]}
        interestsOwner
        activity={activity}
      />,
    );
    expect(html).toContain('data-social-profile-tab-active=""');
    expect(html).toContain(SOCIAL.profile.creditsEmpty);
    expect(html).not.toContain("Engine note");
    expect(html).toContain('href="/social/profile?tab=credits"');
  });
});
