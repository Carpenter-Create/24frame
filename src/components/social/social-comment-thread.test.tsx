import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SOCIAL } from "@/lib/social";
import { SocialCommentTrigger } from "./social-comment-thread";

describe("SocialCommentTrigger", () => {
  it("renders a quiet comment control without opening the sheet", () => {
    const html = renderToStaticMarkup(
      <SocialCommentTrigger
        post={{ id: "p1", commentCount: 0, groupSlug: null, canComment: true }}
      />,
    );
    expect(html).toContain("data-social-comment-open");
    expect(html).toContain(SOCIAL.post.viewComments);
    expect(html).not.toContain(`0 ${SOCIAL.post.comments}`);
    expect(html).not.toContain("data-social-comment-thread");
    expect(html).not.toContain("data-social-comment-composer");
  });

  it("names the count when comments already exist", () => {
    const html = renderToStaticMarkup(
      <SocialCommentTrigger
        post={{ id: "p1", commentCount: 3, groupSlug: null, canComment: true }}
      />,
    );
    expect(html).toContain(`3 ${SOCIAL.post.comments}`);
    expect(html).not.toContain(SOCIAL.post.viewComments);
  });

  it("renders the icon face for the action row", () => {
    const html = renderToStaticMarkup(
      <SocialCommentTrigger
        post={{ id: "p1", commentCount: 2, canComment: true }}
        icon
      />,
    );
    expect(html).toContain("data-social-icon");
    expect(html).toContain('aria-label="Comments"');
  });
});
