import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SOCIAL_HOME_STACK_LOCK, SOCIAL_HOME_STACK_ORDER } from "@/lib/social-home";
import { SocialHomeStack } from "./social-home-stack";

describe("SocialHomeStack", () => {
  it("renders one shared column: composer → Stories → Topics → wall", () => {
    const html = renderToStaticMarkup(
      <SocialHomeStack
        composer={<span data-stack="composer" />}
        stories={<span data-stack="stories" />}
        topics={<span data-stack="topics" />}
        wall={<span data-stack="wall" />}
      />,
    );
    expect(html).toContain(`data-social-home-stack="${SOCIAL_HOME_STACK_LOCK}"`);
    expect(SOCIAL_HOME_STACK_ORDER).toEqual(["composer", "stories", "topics", "wall"]);
    expect(html.indexOf('data-stack="composer"')).toBeLessThan(html.indexOf('data-stack="stories"'));
    expect(html.indexOf('data-stack="stories"')).toBeLessThan(html.indexOf('data-stack="topics"'));
    expect(html.indexOf('data-stack="topics"')).toBeLessThan(html.indexOf('data-stack="wall"'));
  });
});
