import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SOCIAL, socialProfileVisibleTabs } from "@/lib/social";
import { SocialProfileTabs } from "./social-profile-tabs";

describe("SocialProfileTabs", () => {
  it("ships Activity | Highlights | Credits | Interests as one horizontal scroll menu", () => {
    const html = renderToStaticMarkup(
      <SocialProfileTabs baseHref="/social/profile" active="credits" />,
    );
    expect(html).toContain("data-social-profile-tabs");
    expect(html).toContain("overflow-x-auto");
    expect(html).toContain('data-social-profile-tab="activity"');
    expect(html).toContain('data-social-profile-tab="highlights"');
    expect(html).toContain('data-social-profile-tab="credits"');
    expect(html).toContain('data-social-profile-tab="interests"');
    expect(html).not.toContain('data-social-profile-tab="posts"');
    expect(html).toContain(SOCIAL.profile.activityTab);
    expect(html).toContain(SOCIAL.profile.highlightsTab);
    expect(html).toContain(SOCIAL.profile.creditsTab);
    expect(html).toContain(SOCIAL.profile.interestsTab);
    expect(html).toContain('href="/social/profile"');
    expect(html).toContain("/social/profile?tab=credits");
    expect(html).toContain("/social/profile?tab=highlights");
    expect(html).toContain("/social/profile?tab=interests");
    expect(html).not.toContain("/social/profile?tab=activity");
    expect(html.indexOf('data-social-profile-tab="activity"')).toBeLessThan(
      html.indexOf('data-social-profile-tab="highlights"'),
    );
    expect(html.indexOf('data-social-profile-tab="highlights"')).toBeLessThan(
      html.indexOf('data-social-profile-tab="credits"'),
    );
    expect(html.indexOf('data-social-profile-tab="credits"')).toBeLessThan(
      html.indexOf('data-social-profile-tab="interests"'),
    );
    expect(html).not.toContain("Education");
    expect(html).not.toContain("Reels");
    expect(html).not.toContain("Organization");
    expect(html).not.toContain("Following");
    expect(html).not.toContain("For you");
  });

  it("omits Interests when the caller passes the visitor-empty slice", () => {
    const html = renderToStaticMarkup(
      <SocialProfileTabs
        baseHref="/social/u/ada"
        active="activity"
        tabs={socialProfileVisibleTabs({ owner: false, topicCount: 0 })}
      />,
    );
    expect(html).toContain('data-social-profile-tab="activity"');
    expect(html).toContain('data-social-profile-tab="credits"');
    expect(html).not.toContain('data-social-profile-tab="interests"');
    expect(html).not.toContain(SOCIAL.profile.interestsTab);
  });
});
