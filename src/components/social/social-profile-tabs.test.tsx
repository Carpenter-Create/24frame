import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SOCIAL } from "@/lib/social";
import { SocialProfileTabs } from "./social-profile-tabs";

describe("SocialProfileTabs", () => {
  it("ships Activity | Highlights | Credits as a horizontal scroll menu", () => {
    const html = renderToStaticMarkup(
      <SocialProfileTabs baseHref="/social/profile" active="credits" />,
    );
    expect(html).toContain("data-social-profile-tabs");
    expect(html).toContain("overflow-x-auto");
    expect(html).toContain('data-social-profile-tab="activity"');
    expect(html).toContain('data-social-profile-tab="highlights"');
    expect(html).toContain('data-social-profile-tab="credits"');
    expect(html).not.toContain('data-social-profile-tab="posts"');
    expect(html).toContain(SOCIAL.profile.activityTab);
    expect(html).toContain(SOCIAL.profile.highlightsTab);
    expect(html).toContain(SOCIAL.profile.creditsTab);
    expect(html).toContain('href="/social/profile"');
    expect(html).toContain("/social/profile?tab=credits");
    expect(html).toContain("/social/profile?tab=highlights");
    expect(html).not.toContain("/social/profile?tab=activity");
    expect(html.indexOf('data-social-profile-tab="activity"')).toBeLessThan(
      html.indexOf('data-social-profile-tab="highlights"'),
    );
    expect(html.indexOf('data-social-profile-tab="highlights"')).toBeLessThan(
      html.indexOf('data-social-profile-tab="credits"'),
    );
    expect(html).not.toContain("Education");
    expect(html).not.toContain("Reels");
    expect(html).not.toContain("Organization");
    expect(html).not.toContain("Following");
    expect(html).not.toContain("For you");
  });
});
