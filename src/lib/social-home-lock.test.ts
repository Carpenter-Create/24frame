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
const empty = readFileSync("src/components/social/social-empty.tsx", "utf8");
const checklist = readFileSync("src/components/social/social-checklist.tsx", "utf8");
const chrome = readFileSync("src/lib/social-chrome.ts", "utf8");
const icons = readFileSync("src/lib/social-icons.ts", "utf8");
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
    expect(home).not.toContain("What's on your mind");
    expect(home).not.toContain("Whats on your mind");
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
    expect(dock).toContain("bg-surface");
    expect(dock).not.toContain("backdrop-blur");
    expect(dock).not.toContain("bg-surface/95");
    expect(home).not.toContain("Reels");
    expect(explore).not.toContain("Reels");
  });

  it("locks Home craft-raise finish against Figma 1:9 / 1:21", () => {
    expect(rail).toContain("SOCIAL_ICON_SIZE_STORY_CREATE");
    expect(rail).toContain("SOCIAL_STORY_MEDIA_CLASS");
    expect(rail).toContain("data-social-story-media");
    expect(rail).toContain("bg-accent");
    expect(rail).toContain("bg-hairline");
    expect(rail).not.toContain("size-10");
    expect(rail).not.toContain("size={28}");
    expect(card.slice(card.indexOf("export function SocialPostCard")).indexOf("SocialPostMedia")).toBeLessThan(
      card.slice(card.indexOf("export function SocialPostCard")).indexOf("SocialAvatar"),
    );
    expect(home).toContain('icon="users"');
    expect(rail).toContain("px-[var(--content-inset)]");
    expect(empty).toContain("SOCIAL_EMPTY_ACTION_CLASS");
    expect(empty).toContain("SOCIAL_ICON_SIZE_EMPTY");
    expect(checklist).toContain("SOCIAL_CHECKLIST_CLASS");
    expect(chrome).toContain('rounded-[8px] bg-surface-muted');
    expect(chrome).toContain("gap-[var(--space-2)]");
    expect(chrome).toContain("p-[var(--space-4)]");
    expect(chrome).toContain("p-[3px]");
    expect(icons).toContain("SOCIAL_ICON_SIZE_STORY_CREATE = 36");
    expect(icons).toContain('"users"');
    expect(home).not.toContain("WorkspaceSwitcher");
    expect(home).not.toContain("SocialPostCompose");
    expect(home).not.toContain("SocialCreateCompose");
    expect(home).not.toContain("What's on your mind");
  });

  it("keeps Social Figma and Settings Mercury on separate registers", () => {
    const settingsProfile = readFileSync("src/app/(app)/settings/profile/page.tsx", "utf8");
    const accountSheet = readFileSync("src/components/chrome/account-sheet.tsx", "utf8");
    const userMenu = readFileSync("src/components/chrome/user-menu.tsx", "utf8");
    const settingsRail = readFileSync("src/components/chrome/settings-rail.tsx", "utf8");
    const sideNav = readFileSync("src/components/chrome/side-nav.tsx", "utf8");
    const publicProfile = readFileSync("src/app/(app)/social/u/[handle]/page.tsx", "utf8");
    const socialStories = readFileSync("src/app/(app)/social/stories/page.tsx", "utf8");
    // Settings/Profile interiors and the user-menu register stay Mercury —
    // no Social primitives. Account/settings-rail glyphs swapped to Phosphor
    // in Aggregation chrome; structure stays.
    for (const src of [settingsProfile, userMenu]) {
      expect(src).not.toContain("SocialIcon");
      expect(src).not.toContain("@phosphor-icons");
      expect(src).not.toContain("social-chrome");
    }
    for (const src of [accountSheet, settingsRail]) {
      expect(src).not.toContain("SocialIcon");
      expect(src).not.toContain("social-chrome");
    }
    expect(settingsProfile).toContain("AccountProfileForm");
    expect(settingsProfile).toContain("CompanyProfileForm");
    expect(settingsRail).toContain("CaretLeft");
    expect(settingsRail).toContain("PHOSPHOR_CHROME_IDLE_WEIGHT");
    expect(sideNav).toContain("SocialIcon");
    expect(sideNav).toContain("<NavGlyph item={item} active={active} />");
    expect(home).not.toContain("PageHeader");
    expect(create).not.toContain("PageHeader");
    expect(profile).not.toContain("PageHeader");
    expect(profile).not.toContain("AccountProfileForm");
    expect(profile).toContain("SocialProfileIdentity");
    expect(publicProfile).not.toContain("PageHeader");
    expect(socialStories).not.toContain("PageHeader");
  });
});
