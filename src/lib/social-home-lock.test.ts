import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { SOCIAL_DESKTOP_NAV, SOCIAL_NAV } from "./nav";
import { SOCIAL_PHONE_DESTS, SOCIAL_PHONE_FEED_LABEL } from "./house-phone-shell";
import { SOCIAL_CATEGORY_LABELS } from "./social-categories";
import {
  SOCIAL_DESKTOP_MEASURE,
  SOCIAL_FIGMA_PROFILE_BIO,
  SOCIAL_FIGMA_PROFILE_EDIT,
  SOCIAL_FIGMA_PROFILE_OWN,
} from "./social-chrome";
import { SOCIAL, SOCIAL_PROFILE_TABS, SOCIAL_ROUTES } from "./social";

const home = readFileSync("src/app/(app)/social/page.tsx", "utf8");
const explore = readFileSync("src/app/(app)/social/explore/page.tsx", "utf8");
const create = readFileSync("src/app/(app)/social/create/page.tsx", "utf8");
const stories = readFileSync("src/app/(app)/social/stories/page.tsx", "utf8");
const messages = readFileSync("src/app/(app)/social/dms/page.tsx", "utf8");
const profile = readFileSync("src/app/(app)/social/profile/page.tsx", "utf8");
const card = readFileSync("src/components/social/social-ui.tsx", "utf8");
const rail = readFileSync("src/components/social/social-stories-rail.tsx", "utf8");
const empty = readFileSync("src/components/social/social-empty.tsx", "utf8");
const chrome = readFileSync("src/lib/social-chrome.ts", "utf8");
const icons = readFileSync("src/lib/social-icons.ts", "utf8");
const pkg = readFileSync("package.json", "utf8");

describe("Social Home miss list v1 P0 lock", () => {
  it("keeps the five Social jobs and parks Groups / Courses / Leaderboard", () => {
    expect(SOCIAL_NAV.map((item) => item.label)).toEqual([
      "Home",
      "Profile",
      "Explore",
      "Create",
      "Messages",
    ]);
    expect(SOCIAL_NAV.map((item) => item.href)).toEqual([
      SOCIAL_ROUTES.home,
      SOCIAL_ROUTES.profile,
      SOCIAL_ROUTES.explore,
      SOCIAL_ROUTES.create,
      SOCIAL_ROUTES.dms,
    ]);
    expect(SOCIAL_DESKTOP_NAV.map((item) => item.label)).toEqual([
      "Home",
      "Profile",
      "Explore",
      "Messages",
    ]);
    expect(SOCIAL_NAV.map((item) => item.href)).not.toContain(SOCIAL_ROUTES.groups);
    expect(SOCIAL_NAV.map((item) => item.href)).not.toContain("/social/courses");
    expect(SOCIAL_NAV.map((item) => item.href)).not.toContain("/education");
    expect(SOCIAL_NAV.map((item) => item.href)).not.toContain(SOCIAL_ROUTES.leaderboard);
  });

  it("keeps Home on the following wall with stories, composer, and Following | For you tabs", () => {
    expect(home).toContain("loadFollowingPosts");
    expect(home).toContain("SocialStoriesRail");
    expect(home).toContain("SocialHomeComposer");
    expect(home).toContain("SocialHomeTopics");
    expect(home.indexOf("<SocialHomeComposer")).toBeLessThan(home.indexOf("<SocialHomeTopics"));
    expect(home.indexOf("<SocialHomeTopics")).toBeLessThan(home.indexOf("<SocialStoriesRail"));
    expect(home.indexOf("<SocialStoriesRail")).toBeLessThan(home.indexOf("<SocialHomeTabs"));
    expect(home).toContain("SocialHomeTabs");
    expect(home).not.toContain("SocialProfileTabs");
    expect(home).not.toContain("creditsEmpty");
    expect(home).toContain("SocialForYouRail");
    expect(home).not.toContain("SocialRecentChats");
    expect(home).not.toContain("SocialHomeRecentChatsSlot");
    expect(home).not.toContain("loadDmInbox");
    expect(home).toContain("ensureOwnSocialProfile");
    expect(home).toContain("data-social-following-empty");
    expect(home).not.toContain("SocialLensRow");
    expect(home).not.toContain("SocialNeedProfile");
    expect(home).not.toContain("SocialPostCompose");
    expect(home).not.toContain("SocialCreateCompose");
    expect(home).not.toContain("loadVisiblePosts");
    expect(home).not.toContain("education");
    expect(SOCIAL.home.followingTab).toBe("Following");
    expect(SOCIAL.home.forYouTab).toBe("For you");
    expect(SOCIAL.home.composerPrompt).toBe("Write something");
    expect(SOCIAL.home.composerPromptNamed).toBe("Write something");
    expect(SOCIAL.forYou.topics).toBe("Topics.");
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
    expect(stories).toContain("SocialStoriesEmpty");
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
    expect(existsSync("src/components/social/social-mobile-dock.tsx")).toBe(false);
    expect(home).not.toContain("Reels");
    expect(explore).not.toContain("Reels");
  });

  it("locks Home chrome against Figma 176:1085 Circle-primary + compact composer", () => {
    const shell = readFileSync("src/components/chrome/app-shell.tsx", "utf8");
    const composer = readFileSync("src/components/social/social-home-composer.tsx", "utf8");
    const forYou = readFileSync("src/components/social/social-for-you.tsx", "utf8");
    const topics = readFileSync("src/components/social/social-home-topics.tsx", "utf8");
    const extras = readFileSync("src/components/social/social-rail-extras.tsx", "utf8");
    expect(rail).toContain("SOCIAL_ICON_SIZE_STORY_PLUS");
    expect(rail).toContain("SOCIAL_HOME_STORY_CARD_CLASS");
    expect(rail).toContain("data-social-stories-tall");
    expect(rail).toContain("data-social-story-media");
    expect(rail).toContain("bg-accent");
    expect(rail).toContain("bg-hairline");
    expect(rail).toContain("w-[112px]");
    expect(rail).not.toContain("size-10");
    expect(card).toContain("SOCIAL_FEED_ROW_CLASS");
    expect(card.slice(card.indexOf("export function SocialPostCard")).indexOf("SocialAvatar")).toBeLessThan(
      card.slice(card.indexOf("export function SocialPostCard")).indexOf("SocialPostMedia"),
    );
    expect(home).toContain('icon="users"');
    expect(home).toContain("SocialHomeTabs");
    expect(composer).toContain("data-social-home-composer");
    expect(composer).toContain("data-social-composer-media");
    expect(composer).toContain("SOCIAL_MEDIA_ACCEPT");
    expect(composer).toContain('socialCreateHref("text")');
    expect(composer).toContain("socialComposerPrompt(authorName)");
    expect(composer).not.toContain("md:hidden");
    expect(composer).not.toContain("What's on your mind");
    expect(composer).toContain("text-ink-2");
    expect(composer).not.toContain("text-accent");
    expect(composer).not.toContain("data-social-composer-action");
    expect(composer).not.toContain("ACTIONS");
    expect(extras).not.toContain("data-social-rail-create");
    expect(extras).toContain("data-social-rail-account");
    expect(forYou).toContain("SocialOnboardingChecklist");
    expect(forYou).toContain("SocialPersonRow");
    expect(forYou).not.toContain("SocialAvatar");
    expect(forYou).not.toContain("data-social-for-you-topics");
    expect(forYou).not.toContain("SOCIAL.forYou.topics");
    expect(forYou).not.toContain("SocialHomeTopics");
    expect(topics).toContain("data-social-home-topics");
    expect(topics).toContain("SOCIAL.forYou.topics");
    expect(topics).toContain("flex-wrap");
    expect(topics).not.toContain("truncate");
    expect(forYou).not.toContain("SOCIAL.forYou.native");
    expect(forYou).not.toContain("Social-native");
    expect(forYou).not.toContain("education");
    expect(forYou).not.toContain("Education");
    expect(empty).toContain("SOCIAL_EMPTY_ACTION_CLASS");
    expect(chrome).toContain("SOCIAL_FEED_ROW_CLASS");
    expect(chrome).toContain("p-[3px]");
    expect(icons).toContain("SOCIAL_ICON_SIZE_STORY_CREATE = 28");
    expect(icons).toContain('"users"');
    expect(icons).toContain('"share-network"');
    expect(icons).toContain('"link"');
    expect(icons).toContain('"download-simple"');
    expect(icons).toContain('"text-t"');
    expect(home).not.toContain("WorkspaceSwitcher");
    expect(home).not.toContain("SocialPostCompose");
    expect(home).not.toContain("SocialCreateCompose");
    expect(shell).toContain("data-social-workspace");
    expect(shell).not.toContain("Aggregation|Social");
    expect(chrome).toContain('SOCIAL_FIGMA_HOME = "176:1085"');
    expect(chrome).toContain('SOCIAL_FIGMA_HOME_EMPTY = "176:1346"');
    expect(chrome).toContain('SOCIAL_FIGMA_HOME_MOBILE = "169:1519"');
    expect(chrome).toContain('SOCIAL_FIGMA_HOME_MOBILE_SCROLL = "160:1129"');
    expect(chrome).toContain("169:964");
    expect(chrome).toContain("169:1281");
    expect(chrome).toContain("164:1136");
    expect(chrome).toContain("164:1360");
    expect(chrome).toContain("dest: 200");
    expect(chrome).not.toContain("chats: 200");
    expect(chrome).toContain("gutter: 16");
    expect(chrome).toContain("center: 892");
    expect(chrome).toContain("right: 300");
    expect(chrome).toContain("padR: 16");
    expect(chrome).toContain("w-[calc(200px-var(--chrome-gutter))]");
    expect(chrome).toContain("md:ml-[200px]");
    expect(chrome).toContain("lg:max-w-[892px]");
    expect(chrome).not.toContain("lg:max-w-[676px]");
    expect(chrome).toContain("SOCIAL_RAIL_PANEL_CLASS");
    expect(chrome).toContain("rounded-[16px]");
    expect(home).not.toContain("SocialRecentChats");
    expect(home).not.toContain("SocialHomeRecentChatsSlot");
    expect(existsSync("src/components/social/social-recent-chats.tsx")).toBe(false);
    expect(chrome).not.toContain("SOCIAL_CHATS_COLUMN_CLASS");
    expect(chrome).not.toContain("SOCIAL_CHATS_PANEL_CLASS");
    expect(home).not.toContain('"/messages"');
    expect(chrome).toContain("size-8");
    expect(chrome).toContain("h-16");
    expect(shell).toContain("SOCIAL_RAIL_PANEL_CLASS");
    expect(shell).toContain("HOUSE_RAIL_FLOAT_CLASS");
    expect(chrome).not.toContain("Inter");
    expect(chrome).not.toContain("#d1e0fa");
    expect(chrome).not.toContain("shadow-");
    expect(chrome).toContain("px-[var(--chrome-gutter)]");
    expect(chrome).toContain("gap-[16px]");
    expect(chrome).toContain("SOCIAL_COMPOSER_MEDIA_CLASS");
    expect(chrome).not.toContain("SOCIAL_COMPOSER_ACTION_CLASS");
    expect(home).not.toContain("SocialFirstWin");
    expect(home).toContain("checklist={profile ? checklist : []}");
    expect(home).toContain("data-social-home-setup");
    expect(home).toContain("lg:hidden");
    expect(home.indexOf("<SocialStoriesRail")).toBeLessThan(home.indexOf("data-social-home-setup"));
    expect(home.indexOf("data-social-home-setup")).toBeLessThan(home.indexOf("<SocialHomeTabs"));
    expect(home).toContain("SOCIAL.home.emptyQuiet");
    expect(home).toContain("md:hidden");
    expect(home).toContain("data-social-empty-lenses");
    expect(shell).not.toContain("Destinations");
    expect(shell).not.toContain("SocialRailCreateCta");
    expect(shell).not.toContain("SOCIAL_RAIL.workspace");
    expect(SOCIAL_DESKTOP_NAV.map((item) => item.label)).toEqual([
      "Home",
      "Profile",
      "Explore",
      "Messages",
    ]);
    expect(rail).toContain("data-social-stories-mobile");
    expect(chrome).toContain("129:215");
    expect(chrome).toContain("129:415");
    expect(chrome).toContain("129:615");
    expect(chrome).toContain("155:194");
    expect(chrome).toContain("155:372");
    expect(chrome).toContain("135:585");
    expect(chrome).toContain("135:1037");
    expect(chrome).toContain("135:1214");
    expect(create).toContain("SocialForYouRail");
    expect(create).toContain("SocialCreateCompose");
    expect(create).not.toContain("Riley Okonkwo");
    expect(create).not.toContain("MicroDramaPilot");
    expect(create).not.toContain("education");
    expect(chrome).toContain("138:163");
    expect(chrome).toContain("138:889");
    expect(chrome).toContain("138:943");
    expect(stories).toContain('surface="stories"');
    expect(stories).toContain("SocialForYouRail");
    expect(stories).toContain("SocialStoriesEmpty");
    expect(stories).not.toContain("education");
    expect(SOCIAL.stories.emptyHint).toBe(
      "When people you follow share stories, they show up here. Start with your own.",
    );
    expect(SOCIAL.stories.createCta).toBe("Create a story");
    expect(SOCIAL.stories.pickerHint).toBe("Video only");
    expect(SOCIAL.stories.recordHint).toBe("Open in-app studio");
    expect(SOCIAL.stories.studioTitle).toBe("Story studio");
    expect(chrome).toContain("146:230");
    expect(chrome).toContain("146:1125");
    expect(chrome).toContain("144:1218");
    expect(empty).toContain("SocialStoriesEmpty");
    expect(empty).toContain('name="image"');
    expect(empty).toContain("SOCIAL_STORIES_EMPTY_ACTION_CLASS");
    expect(rail).toContain('surface = "home"');
    expect(rail).toContain("w-[112px]");
    expect(rail).toContain("SOCIAL_STORIES_CARD_CLASS");
    expect(rail).toContain("SOCIAL_STORIES_PLUS_WELL_CLASS");
    expect(rail).toContain("SOCIAL_HOME_STORY_NAME_CLASS");
    expect(chrome).toContain("h-[168px]");
    expect(chrome).toContain("h-[192px]");
    expect(chrome).toContain("h-[200px]");
    expect(chrome).toContain("w-[112px]");
    expect(chrome).toContain("w-[108px]");
    expect(icons).toContain("SOCIAL_ICON_SIZE_STORY_PLUS = 20");
    expect(icons).toContain("SOCIAL_ICON_SIZE_TAB = 22");
    expect(icons).toContain("SOCIAL_ICON_SIZE_COMPOSER = 22");
    expect(icons).not.toContain("SOCIAL_ICON_SIZE_DOCK");
  });

  it("drops the Social floating tab bar and keeps the Mercury floating dock gone", () => {
    const shell = readFileSync("src/components/chrome/app-shell.tsx", "utf8");
    expect(existsSync("src/components/social/social-top-bar.tsx")).toBe(false);
    const dests = readFileSync("src/components/chrome/house-phone-dest-chips.tsx", "utf8");
    const storyViewer = readFileSync("src/app/(app)/social/stories/[id]/page.tsx", "utf8");
    expect(existsSync("src/components/social/social-mobile-dock.tsx")).toBe(false);
    expect(existsSync("src/components/social/social-mobile-tab-bar.tsx")).toBe(false);
    expect(existsSync("src/components/social/social-phone-dests.tsx")).toBe(false);
    expect(shell).not.toContain("SocialMobileDock");
    expect(shell).not.toContain("SocialMobileTabBar");
    expect(shell).not.toContain("SocialPhoneDests");
    expect(shell).toContain("HousePhoneDestChips");
    expect(shell).toContain("HousePhoneAppShell");
    expect(shell).not.toContain("data-social-mobile-pill");
    expect(shell).not.toContain("data-social-create-fab");
    expect(home).not.toContain("SocialMobileDock");
    expect(create).not.toContain("SocialMobileDock");
    expect(profile).not.toContain("SocialMobileDock");
    expect(stories).not.toContain("SocialMobileDock");
    expect(storyViewer).not.toContain("SocialMobileDock");
    expect(shell).not.toContain("data-social-header-tray");
    const leadSearch = readFileSync("src/components/chrome/house-lead-search.tsx", "utf8");
    expect(leadSearch).toContain("data-social-header-search");
    expect(leadSearch).toContain("SocialSearchSheet");
    expect(leadSearch).not.toContain("prefetch");
    expect(readFileSync("src/lib/nav.ts", "utf8")).not.toContain("SOCIAL_MOBILE_PILL");
    expect(dests).toContain("data-house-phone-dest-chips");
    expect(dests).toContain("housePhoneDestinations");
    expect(dests).toContain("prefetch");
    expect(dests).not.toContain("data-social-tab-bar");
    expect(dests).not.toContain("data-social-create-fab");
    expect(dests).not.toContain("data-social-mobile-pill");
    expect(SOCIAL_NAV.map((item) => item.label)).toEqual([
      "Home",
      "Profile",
      "Explore",
      "Create",
      "Messages",
    ]);
    expect(SOCIAL_PHONE_DESTS.map((item) => item.label)).toEqual([
      "Feed",
      "Profile",
      "Explore",
      "Create",
      "Messages",
    ]);
    expect(SOCIAL_PHONE_DESTS.map((item) => item.href)).toEqual([
      SOCIAL_ROUTES.home,
      SOCIAL_ROUTES.profile,
      SOCIAL_ROUTES.explore,
      SOCIAL_ROUTES.create,
      SOCIAL_ROUTES.dms,
    ]);
    expect(SOCIAL_PHONE_FEED_LABEL).toBe("Feed");
    expect(SOCIAL_PHONE_DESTS.map((item) => item.label)).not.toContain("Home");
    const feedItem = SOCIAL_PHONE_DESTS.find((item) => item.label === SOCIAL_PHONE_FEED_LABEL);
    expect(feedItem?.href).toBe(SOCIAL_ROUTES.home);
    expect(feedItem?.exact).toBe(true);
  });

  it("keeps Social nav prefetch on and destination pages parallel", () => {
    const sideNav = readFileSync("src/components/chrome/side-nav.tsx", "utf8");
    const dests = readFileSync("src/components/chrome/house-phone-dest-chips.tsx", "utf8");
    expect(existsSync("src/app/(app)/social/loading.tsx")).toBe(true);
    expect(existsSync("src/app/(app)/social/profile/loading.tsx")).toBe(true);
    expect(existsSync("src/app/(app)/social/profile/edit/loading.tsx")).toBe(true);
    expect(existsSync("src/app/(app)/social/profile/edit/bio/loading.tsx")).toBe(true);
    expect(existsSync("src/app/(app)/social/create/loading.tsx")).toBe(true);
    expect(existsSync("src/app/(app)/social/explore/loading.tsx")).toBe(true);
    expect(existsSync("src/app/(app)/social/dms/loading.tsx")).toBe(true);
    expect(existsSync("src/app/(app)/social/stories/loading.tsx")).toBe(true);
    expect(existsSync("src/app/(app)/social/layout.tsx")).toBe(true);
    expect(readFileSync("src/app/(app)/social/loading.tsx", "utf8")).toContain("SocialHomeSkeleton");
    expect(readFileSync("src/app/(app)/social/loading.tsx", "utf8")).not.toContain("DashboardSkeleton");
    expect(sideNav).toContain("prefetch={social}");
    expect(sideNav).toContain("useSocialNavPending");
    expect(dests).toContain("prefetch");
    expect(dests).toContain("housePhoneDestActive");
    expect(home).toContain("loadOwnPostFacts");
    expect(home).toContain("requireSocialSession");
    expect(home).toContain("Suspense");
    expect(home).toContain("Promise.all");
    expect(readFileSync("src/app/(app)/social/layout.tsx", "utf8")).toContain(
      "export default function SocialLayout",
    );
    expect(readFileSync("src/app/(app)/social/layout.tsx", "utf8")).not.toContain(
      "export default async function SocialLayout",
    );
    expect(readFileSync("src/app/(app)/social/layout.tsx", "utf8")).toContain("loadSocialSession()");
    expect(profile).toContain("Promise.all");
    expect(create).toContain("Promise.all");
    expect(stories).toContain("Promise.all");
    expect(explore).toContain("Promise.all");
    expect(messages).toContain("Promise.all");
    const layout = readFileSync("src/app/(app)/layout.tsx", "utf8");
    const shell = readFileSync("src/components/chrome/app-shell.tsx", "utf8");
    expect(layout).toContain("export default function AppLayout");
    expect(layout).not.toContain("export default async function AppLayout");
    expect(layout).toContain("loadAppShellChrome()");
    expect(layout).not.toMatch(/await hasAvatarObject/);
    expect(layout).not.toMatch(/await getActiveOrgTier/);
    expect(shell).toContain("HouseLeadChrome");
    expect(shell).not.toContain("SocialTopBarFromChrome");
    expect(shell).toContain("Do not use() this at the AppShell top");
  });

  it("puts Finish setting up on the desktop For you rail and mobile first feed card on 176:1346 / 169:1519", () => {
    const forYou = readFileSync("src/components/social/social-for-you.tsx", "utf8");
    const checklist = readFileSync("src/components/social/social-checklist.tsx", "utf8");
    expect(chrome).toContain('SOCIAL_FIGMA_HOME_EMPTY = "176:1346"');
    expect(chrome).toContain('SOCIAL_FIGMA_HOME_MOBILE = "169:1519"');
    expect(home).not.toContain("SocialFirstWin");
    expect(home).not.toContain("firstWinHint");
    expect(home).toContain("data-social-home-setup");
    expect(forYou).toContain("SocialOnboardingChecklist");
    expect(forYou).toContain("SocialPersonRow");
    expect(forYou).toContain('tone="nested"');
    expect(forYou).toContain("layout === \"rail\"");
    expect(checklist).toContain("data-social-checklist-dismiss");
    expect(checklist).toContain("SOCIAL.checklist.dismiss");
    expect(checklist).toContain("SOCIAL_CHECKLIST_TRACK_NESTED_CLASS");
    expect(chrome).toContain("SOCIAL_CHECKLIST_TRACK_NESTED_CLASS");
    expect(chrome).toContain("SOCIAL_CHECKLIST_TRACK_CLASS");
    expect(SOCIAL_DESKTOP_MEASURE).toEqual({
      dest: 200,
      gutter: 16,
      center: 892,
      right: 300,
      padR: 16,
    });
    expect(SOCIAL_DESKTOP_MEASURE).not.toHaveProperty("chats");
    expect(SOCIAL_DESKTOP_MEASURE.dest + SOCIAL_DESKTOP_MEASURE.gutter + SOCIAL_DESKTOP_MEASURE.center + SOCIAL_DESKTOP_MEASURE.gutter + SOCIAL_DESKTOP_MEASURE.right + SOCIAL_DESKTOP_MEASURE.padR).toBe(1440);
    expect(SOCIAL.home.emptyQuiet).toBe("No posts yet");
    expect(SOCIAL.checklist).not.toHaveProperty("firstWinHint");
    expect(SOCIAL.forYou).not.toHaveProperty("native");
    expect(chrome).not.toContain("119:112");
    expect(chrome).not.toContain("120:174");
  });

  it("keeps Social Figma and Settings Mercury on separate registers", () => {
    const settingsProfile = readFileSync("src/components/settings/profile-settings.tsx", "utf8");
    const settingsAggregation = readFileSync("src/components/settings/organization-settings.tsx", "utf8");
    const accountSheet = readFileSync("src/components/chrome/account-sheet.tsx", "utf8");
    const userMenu = readFileSync("src/components/chrome/user-menu.tsx", "utf8");
    const settingsRail = readFileSync("src/components/chrome/settings-rail.tsx", "utf8");
    const settingsLead = readFileSync("src/components/settings/settings-page-lead.tsx", "utf8");
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
    expect(settingsAggregation).toContain("CompanyProfileForm");
    expect(settingsLead).toContain("PageHeaderBackLink");
    expect(settingsLead).not.toContain("CaretLeft");
    expect(sideNav).toContain("SocialIcon");
    expect(sideNav).toContain("<NavGlyph item={item} active={active} />");
    expect(home).not.toContain("PageHeader");
    expect(create).not.toContain("PageHeader");
    expect(profile).not.toContain("PageHeader");
    expect(profile).not.toContain("AccountProfileForm");
    expect(profile).toContain("SocialProfileIdentity");
    expect(profile).toContain("SOCIAL.profile.edit");
    expect(profile).toContain("SOCIAL_ROUTES.profileEdit");
    expect(profile).not.toContain('href="#social-profile-edit"');
    expect(profile).not.toContain("<details");
    expect(profile).not.toContain("<summary");
    expect(profile).not.toContain("SocialProfilePhotoForm");
    expect(profile).not.toContain("SocialBioForm");
    expect(card).not.toContain("socialProfilePublicHost");
    expect(card).not.toContain("data-social-profile-url");
    expect(card).not.toContain("socialShareHint");
    expect(card).not.toContain("data-social-share-hint");
    expect(home).not.toContain("SocialShareButton");
    expect(profile).toContain("SocialProfileTabs");
    expect(profile).toContain("film-slate");
    expect(profile).toContain("creditsEmpty");
    expect(SOCIAL_PROFILE_TABS).toEqual(["posts", "highlights", "credits"]);
    expect(SOCIAL.profile.creditsTab).toBe("Credits");
    expect(SOCIAL.profile.creditsEmpty).toBe("No credits yet");
    expect(icons).toContain('"film-slate"');
    expect(home).not.toContain("creditsEmpty");
    expect(publicProfile).not.toContain("PageHeader");
    expect(publicProfile).toContain("SocialProfileTabs");
    expect(publicProfile).toContain("film-slate");
    expect(publicProfile).toContain("creditsEmpty");
    expect(socialStories).not.toContain("PageHeader");
    expect(SOCIAL_FIGMA_PROFILE_EDIT).toEqual(["180:206", "180:1946", "181:2184"]);
    expect(SOCIAL_FIGMA_PROFILE_BIO).toEqual(["180:2004", "180:2026"]);
    expect(SOCIAL_FIGMA_PROFILE_OWN).toEqual(["181:230", "181:2000"]);
    expect(chrome).toContain("180:206");
    expect(chrome).toContain("180:2004");
    expect(chrome).toContain("181:2184");
    expect(profile).not.toContain("Education");
  });
});
