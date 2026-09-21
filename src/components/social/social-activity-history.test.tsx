import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SOCIAL } from "@/lib/social";
import { SOCIAL_FEED_GUTTER_CLASS } from "@/lib/social-chrome";
import { SocialActivityHistory } from "./social-activity-history";

const post = {
  id: "p1",
  body: "Parent note",
  likeCount: 0,
  commentCount: 1,
  liked: false,
  createdAt: "2026-09-21T12:00:00.000Z",
  authorId: "u2",
  authorHandle: "ada",
  authorName: "Ada Lovelace",
  authorPhotoUrl: null,
  groupSlug: null,
  groupName: null,
  canLike: true,
  media: [],
};

describe("SocialActivityHistory", () => {
  it("shows parent post plus the commenter snippet on Comments", () => {
    const html = renderToStaticMarkup(
      <SocialActivityHistory
        baseHref="/social/profile"
        pill="comments"
        truncated={false}
        posts={[]}
        comments={[
          {
            commentId: "c1",
            body: "Their reply on the parent",
            commentedAt: "2026-09-21T13:00:00.000Z",
            post,
          },
        ]}
      />,
    );
    expect(html).toContain("data-social-activity");
    expect(html).toContain("data-social-activity-pills");
    expect(html).toContain('data-social-activity-comment="c1"');
    expect(html).toContain("Parent note");
    expect(html).toContain("Their reply on the parent");
    expect(html).toContain(SOCIAL.profile.activityCommented);
    expect(html).toContain(SOCIAL_FEED_GUTTER_CLASS.split(" ")[0]);
    expect(html).not.toContain(SOCIAL.profile.activityCommentsEmpty);
  });

  it("keeps a calm empty state per pill", () => {
    const html = renderToStaticMarkup(
      <SocialActivityHistory
        baseHref="/social/profile"
        pill="comments"
        truncated={false}
        posts={[]}
        comments={[]}
      />,
    );
    expect(html).toContain(SOCIAL.profile.activityCommentsEmpty);
    expect(html).toContain(SOCIAL.profile.activityCommentsEmptyHint);
    expect(html).not.toContain("data-social-activity-comment");
  });
});
