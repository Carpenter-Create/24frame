import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { SOCIAL_MOBILE_PILL, SOCIAL_NAV } from "./nav";
import { SOCIAL_CATEGORY_LABELS } from "./social-categories";
import { SOCIAL, SOCIAL_ROUTES } from "./social";

const home = readFileSync("src/app/(app)/social/page.tsx", "utf8");
const explore = readFileSync("src/app/(app)/social/explore/page.tsx", "utf8");
const create = readFileSync("src/app/(app)/social/create/page.tsx", "utf8");
const stories = readFileSync("src/app/(app)/social/stories/page.tsx", "utf8");
const messages = readFileSync("src/app/(app)/social/dms/page.tsx", "utf8");
const profile = readFileSync("src/app/(app)/social/profile/page.tsx", "utf8");
const dock = readFileSync("src/components/social/social-mobile-dock.tsx", "utf8");
const card = readFileSync("src/components/social/social-ui.tsx", "utf8");
const rail = readFileSync("src/components/social/social-stories-rail.tsx", "utf8");
const pkg = readFileSync("package.json", "utf8");

describe("Social Home miss list v1 P0 lock", () => {
  it("keeps the five Social jobs and parks Groups / Courses / Leaderboard", () => {
    expect(SOCIAL_NAV.map((item) => item.label)).toEqual([
      "Home",
      "Explore",
      "Create",
      "Messages",
      "Profile",
    ]);
    expect(SOCIAL_NAV.map((item) => item.href)).toEqual([
      SOCIAL_ROUTES.home,
      SOCIAL_ROUTES.explore,
      SOCIAL_ROUTES.create,
      SOCIAL_ROUTES.dms,
      SOCIAL_ROUTES.profile,
    ]);
    expect(SOCIAL_NAV.map((item) => item.href)).not.toContain(SOCIAL_ROUTES.groups);
    expect(SOCIAL_NAV.map((item) => item.href)).not.toContain(SOCIAL_ROUTES.courses);
    expect(SOCIAL_NAV.map((item) => item.href)).not.toContain(SOCIAL_ROUTES.leaderboard);
    expect(SOCIAL_MOBILE_PILL.map((item) => item.label)).toEqual([
      "Home",
      "Explore",
      "Messages",
      "Profile",
    ]);
  });

  it("keeps Home on the following wall with stories, Home-only lenses, and no composer", () => {
    expect(home).toContain("loadFollowingPosts");
    expect(home).toContain("SocialStoriesRail");
    expect(home).toContain("SocialLensRow");
    expect(home).toContain("SocialOnboardingChecklist");
    expect(home).toContain("ensureOwnSocialProfile");
    expect(home).toContain("data-social-following-empty");
    expect(home).not.toContain("SocialNeedProfile");
    expect(home).not.toContain("SocialPostCompose");
    expect(home).not.toContain("SocialCreateCompose");
    expect(home).not.toContain("loadVisiblePosts");
    expect(SOCIAL.checklist.photo).toBe("Add a profile photo");
    expect(SOCIAL.checklist.bio).toBe("Write a short bio");
    expect(SOCIAL.checklist.introduce).toBe("Introduce yourself");
    expect(SOCIAL.checklist.firstPost).toBe("Share your first post");
    expect(SOCIAL.checklist.firstStory).toBe("Create your first story");
  });

  it("hides Home lenses on Explore, Messages, Profile, and Create", () => {
    expect(explore).not.toContain("SocialLensRow");
    expect(explore).not.toContain("data-social-lenses");
    expect(explore).toContain("data-social-explore-search");
    expect(explore).toContain("data-social-explore-trending");
    expect(explore).not.toContain("loadFollowingPosts");
    expect(explore).not.toContain("loadVisiblePosts");
    expect(messages).not.toContain("SocialLensRow");
    expect(profile).not.toContain("SocialLensRow");
    expect(create).not.toContain("SocialLensRow");
    expect(create).toContain("SocialCreateCompose");
    expect(stories).toContain("SocialStoriesRail");
    expect(stories).toContain("data-social-stories-empty");
    expect(stories).not.toContain("SocialLensRow");
  });

  it("locks the Home category register", () => {
    expect(SOCIAL_CATEGORY_LABELS).toEqual([
      "All",
      "Acting",
      "AI filmmaking",
      "Animation",
      "Casting",
      "Cinematography",
      "Music",
      "Content creator",
      "Directors",
      "Distribution",
      "Film Festivals",
      "Financing",
      "Post-production",
      "Producers",
      "Screenwriting",
      "Vertical micro dramas",
    ]);
  });

  it("keeps story rings off the feed row and Create story first", () => {
    expect(rail).toContain("data-social-story-create");
    expect(rail.indexOf("data-social-story-create")).toBeLessThan(
      rail.indexOf("cards.map"),
    );
    expect(card).toContain("ring?:");
    expect(card.slice(card.indexOf("export function SocialPostCard"))).not.toContain("ring=");
    expect(pkg).toContain('"next": "16.3.5"');
    expect(dock).toContain("data-social-mobile-pill");
    expect(dock).toContain("data-social-create-fab");
    expect(dock).toContain("SocialIcon");
    expect(dock).toContain('name="plus"');
    expect(home).not.toContain("Reels");
    expect(explore).not.toContain("Reels");
  });
});
