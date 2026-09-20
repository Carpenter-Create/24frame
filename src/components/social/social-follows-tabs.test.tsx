import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SOCIAL } from "@/lib/social";
import { SocialFollowsTabs } from "./social-follows-tabs";

describe("SocialFollowsTabs", () => {
  it("reuses the profile underline tab SoT and keeps the entered handle casing", () => {
    const html = renderToStaticMarkup(
      <SocialFollowsTabs
        handle="AdamC"
        active="following"
        query="sun"
        counts={{ followers: 4, following: 7 }}
      />,
    );
    expect(html).toContain("data-social-follows-tabs");
    expect(html).toContain('data-social-follows-tab="followers"');
    expect(html).toContain('data-social-follows-tab="following"');
    expect(html).toContain('data-social-follows-tab-active=""');
    expect(html).toContain("4 followers");
    expect(html).toContain("7 following");
    expect(html).toContain("/social/u/AdamC/follows?q=sun");
    expect(html).toContain("/social/u/AdamC/follows?tab=following&amp;q=sun");
    expect(html).toContain("bg-accent");
    expect(html).not.toContain("Subscriptions");
    expect(html).not.toContain("Flags");
    expect(html).not.toContain(SOCIAL.profile.postsTab);
  });
});
