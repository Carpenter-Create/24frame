import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({
    src,
    className,
  }: {
    src: string;
    className?: string;
  }) => createElement("img", { src, className, alt: "" }),
}));

vi.mock("next/dynamic", () => ({
  default: () =>
    function MuxPlayerStub() {
      return null;
    },
}));

import { HOUSE_CHIP_RAIL_CLASS } from "@/lib/house-chip-rail";
import { IDENTITY_AVATAR_CLASS } from "@/lib/house-sheet";
import {
  SocialAuthorHistory,
  SocialAvatar,
  SocialConversationFaces,
  SocialPersonRow,
  SocialPostCard,
  SocialProfileIdentity,
} from "./social-ui";
import { SOCIAL, socialPostHref, socialRelativeTime } from "@/lib/social";
import {
  SOCIAL_POST_TIME_CLASS,
  SOCIAL_AVATAR_PROFILE_CLASS,
  SOCIAL_EMPTY_PANEL_CLASS,
  SOCIAL_FEED_GUTTER_CLASS,
  SOCIAL_FEED_ROW_CLASS,
  SOCIAL_PROFILE_GRID_CLASS,
  SOCIAL_PROFILE_ACTIONS_CLASS,
  SOCIAL_PROFILE_HEAD_CLASS,
  SOCIAL_PROFILE_META_CLASS,
  SOCIAL_PROFILE_NAME_CLASS,
  SOCIAL_PROFILE_POSTS_EMPTY_CLASS,
  SOCIAL_PROFILE_ROLE_PILL_CLASS,
  SOCIAL_PROFILE_ROLES_RAIL_ROWS,
  SOCIAL_PROFILE_ROLES_ROW_CLASS,
  SOCIAL_PROFILE_STAT_CLASS,
  SOCIAL_PROFILE_STATS_CLASS,
  SOCIAL_PROFILE_STATS_GRID_CLASS,
  SOCIAL_PROFILE_TILE_CLASS,
} from "@/lib/social-chrome";

const here = dirname(fileURLToPath(import.meta.url));
const uiSrc = readFileSync(join(here, "social-ui.tsx"), "utf8");
const avatarSrc = readFileSync(join(here, "social-avatar.tsx"), "utf8");

describe("SocialAvatar", () => {
  it("renders a signed photo URL as an img on the house identity circle", () => {
    const html = renderToStaticMarkup(
      <SocialAvatar name="Ada Lovelace" photoUrl="https://s3.example/signed-avatar" />,
    );
    expect(html).toContain('data-social-avatar=""');
    expect(html).toContain(IDENTITY_AVATAR_CLASS);
    expect(html).toContain("overflow-hidden");
    expect(html).toContain('src="https://s3.example/signed-avatar"');
    expect(html).not.toContain("AL");
  });

  it("keeps initials when the signed URL is null", () => {
    const html = renderToStaticMarkup(<SocialAvatar name="Ada Lovelace" photoUrl={null} />);
    expect(html).toContain(IDENTITY_AVATAR_CLASS);
    expect(html).toContain("AL");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("overflow-hidden");
  });
});

describe("SocialPersonRow", () => {
  it("prints handle above a real name and never prints Member", () => {
    const named = renderToStaticMarkup(
      <SocialPersonRow handle="joshua" displayName="Joshua A" photoUrl={null} href="/social/u/joshua" />,
    );
    expect(named).toContain("data-social-person-row");
    expect(named).toContain("data-social-person-handle");
    expect(named).toContain("@joshua");
    expect(named).toContain("Joshua A");
    expect(named.indexOf("@joshua")).toBeLessThan(named.indexOf("Joshua A"));
    expect(named).toContain('href="/social/u/joshua"');
    expect(named).not.toContain("truncate");

    const sentinel = renderToStaticMarkup(
      <SocialPersonRow handle="joshua" displayName="Member" photoUrl={null} />,
    );
    expect(sentinel).toContain("@joshua");
    expect(sentinel).not.toContain("Member");
    expect(sentinel).not.toContain("data-social-person-name");
    expect(uiSrc).toContain("socialPersonIdentity");
  });
});

describe("SocialConversationFaces", () => {
  it("stacks two initials for a group room", () => {
    const html = renderToStaticMarkup(
      <SocialConversationFaces
        people={[
          { name: "Bob One", photoUrl: null },
          { name: "Carol One", photoUrl: null },
        ]}
      />,
    );
    expect(html).toContain("data-social-conversation-faces");
    expect(html).toContain("BO");
    expect(html).toContain("CO");
  });
});

describe("SocialPostCard faces", () => {
  it("shows the author photo when a signed URL is present", () => {
    const html = renderToStaticMarkup(
      <SocialPostCard
        post={{
          id: "p1",
          body: "hello",
          likeCount: 0,
          liked: false,
          createdAt: "2026-09-12T14:00:00.000Z",
          authorId: "u1",
          authorHandle: "ada",
          authorName: "Ada Lovelace",
          authorPhotoUrl: "https://s3.example/signed-avatar",
          groupSlug: null,
          groupName: null,
          canLike: false,
          media: [],
        }}
      />,
    );
    expect(html).toContain('src="https://s3.example/signed-avatar"');
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain('href="/social/u/ada"');
    expect(html).toContain("bg-surface");
    expect(html).toContain(SOCIAL_FEED_ROW_CLASS);
    expect(html).not.toContain("data-social-post-mobile");
    expect(html).not.toContain("hidden md:flex");
    expect(html).not.toContain("md:hidden");
    expect(SOCIAL_FEED_ROW_CLASS).toMatch(/(?:^|\s)bg-surface(?:\s|$)/);
    expect(SOCIAL_FEED_ROW_CLASS).not.toContain("bg-surface-muted");
    expect(html).not.toContain("/social/u/@");
    expect(html).not.toContain("AL");
    expect(html).not.toContain("data-social-avatar-ring");
    expect(html).not.toContain("ring-accent");
    expect(html).toContain("data-social-comment-open");
  });

  it("keeps author initials when the signed URL is null", () => {
    const html = renderToStaticMarkup(
      <SocialPostCard
        post={{
          id: "p1",
          body: "hello",
          likeCount: 0,
          liked: false,
          createdAt: "2026-09-12T14:00:00.000Z",
          authorId: "u1",
          authorHandle: "ada",
          authorName: "Ada Lovelace",
          authorPhotoUrl: null,
          groupSlug: null,
          groupName: null,
          canLike: false,
          media: [],
        }}
      />,
    );
    expect(html).toContain("AL");
    expect(html).not.toContain("<img");
  });

  it("reuses signed account faces and does not add a second upload", () => {
    expect(uiSrc).toContain('from "./social-avatar"');
    expect(avatarSrc).toContain("IDENTITY_AVATAR_CLASS");
    expect(avatarSrc).toContain("photoUrl");
    expect(uiSrc).toContain("photoUrl");
    expect(uiSrc).not.toContain("signedAvatarUrl");
    expect(uiSrc).not.toContain("putAvatarObject");
    expect(uiSrc).not.toContain("uploadAccountPhoto");
    expect(uiSrc).not.toContain("type=\"file\"");
    expect(uiSrc).not.toContain("S3_BUCKET");
    expect(uiSrc).not.toContain("24frame-media");
    expect(avatarSrc).not.toContain("signedAvatarUrl");
    expect(avatarSrc).toContain("onError");
    expect(avatarSrc).toContain("SocialMediaImage");
    expect(avatarSrc).not.toContain("<img");
    expect(uiSrc).toContain("SocialMediaImage");
    expect(uiSrc).toContain("SocialFeedVideo");
    expect(uiSrc).not.toContain("<img");
    expect(uiSrc).not.toContain("@next/next/no-img-element");
  });
});

describe("Social profile public face", () => {
  it("renders identity, bio, and author history through PostCard", () => {
    const identity = renderToStaticMarkup(
      <SocialProfileIdentity
        name="Ada Lovelace"
        handle="ada"
        photoUrl="https://s3.example/signed-avatar"
        bio="Writes engines."
        actions={<button type="button">Edit profile</button>}
      />,
    );
    expect(identity).toContain("Edit profile");
    expect(uiSrc).toContain("actions?: ReactNode");
    expect(uiSrc).not.toContain("actions?: () => ReactNode");
    expect(uiSrc).not.toContain("{actions()}");
    expect(identity).toContain("data-social-profile-identity");
    expect(identity).toContain("data-social-profile-cover");
    expect(identity).toContain("data-social-profile-cover-empty");
    expect(identity.indexOf("data-social-profile-cover")).toBeLessThan(
      identity.indexOf("data-social-profile-head"),
    );
    expect(identity).toContain("data-social-profile-head");
    expect(identity).toContain("data-social-profile-face");
    expect(identity).toContain("data-social-profile-name");
    expect(identity).toContain("Ada Lovelace");
    expect(identity).not.toContain("data-social-profile-handle");
    expect(identity).not.toContain("@ada");
    expect(identity.indexOf("data-social-profile-head")).toBeLessThan(
      identity.indexOf("data-social-profile-name"),
    );
    const identityHead = identity.slice(
      identity.indexOf("data-social-profile-head"),
      identity.indexOf("data-social-profile-face"),
    );
    expect(identityHead).toContain("-mt-[29px]");
    expect(identityHead).toContain("md:-mt-[35px]");
    expect(identityHead).toContain("border-2 border-surface");
    expect(identityHead).toContain("data-social-avatar");
    expect(identityHead).toContain("data-social-profile-meta");
    expect(identityHead).toContain("data-social-profile-name");
    expect(identityHead).toContain("Ada Lovelace");
    expect(identity).not.toContain("data-social-profile-stats");
    expect(identity).not.toContain("data-social-profile-mutuals");
    expect(identity).not.toContain("data-social-profile-url");
    expect(identity).not.toContain("24frame.co/@ada");
    expect(identity).not.toContain("https://24frame.co/@ada");
    expect(identity).not.toContain("Copies ");
    expect(identity).not.toContain("data-social-share-hint");
    expect(uiSrc).not.toContain("socialProfilePublicHost");
    expect(uiSrc).not.toContain("socialShareHint");
    expect(uiSrc).toContain("data-social-profile-head");
    expect(uiSrc).toContain("SocialProfileBanner");
    expect(uiSrc).toContain("SOCIAL_PROFILE_COVER_STACK_CLASS");
    expect(uiSrc).toContain("SOCIAL_PROFILE_HEAD_OVERLAP_CLASS");
    expect(uiSrc).toContain("SOCIAL_PROFILE_HEAD_CLASS");
    expect(uiSrc).toContain("SOCIAL_PROFILE_META_CLASS");
    expect(uiSrc).toContain("SOCIAL_PROFILE_ACTIONS_CLASS");
    const identityMarkup = uiSrc.slice(
      uiSrc.indexOf("data-social-profile-identity"),
      uiSrc.indexOf("export function SocialHighlights"),
    );
    expect(identityMarkup.indexOf("data-social-profile-head")).toBeLessThan(
      identityMarkup.indexOf("data-social-profile-meta"),
    );
    expect(identityMarkup.indexOf("data-social-profile-meta")).toBeLessThan(
      identityMarkup.indexOf("data-social-profile-name"),
    );
    expect(identityMarkup.indexOf("data-social-profile-name")).toBeLessThan(
      identityMarkup.indexOf("SocialProfileStats"),
    );
    expect(identityMarkup.indexOf("data-social-profile-head")).toBeLessThan(
      identityMarkup.indexOf("data-social-profile-face"),
    );
    expect(identityMarkup.indexOf("data-social-profile-face")).toBeLessThan(
      identityMarkup.indexOf("data-social-profile-bio"),
    );
    expect(identityMarkup.indexOf("HouseChipRail")).toBeLessThan(
      identityMarkup.indexOf("<SocialProfileLinkRow"),
    );
    expect(identityMarkup.indexOf("<SocialProfileLinkRow")).toBeLessThan(
      identityMarkup.indexOf("{actionRow}"),
    );
    expect(uiSrc).not.toContain("data-social-profile-handle");
    expect(identity).toContain("Writes engines.");
    expect(identity).toContain('src="https://s3.example/signed-avatar"');
    expect(identity).not.toContain("data-social-profile-roles");
    expect(identity).not.toContain("data-social-profile-topics");
    expect(identity).not.toContain("data-social-profile-links");
    expect(identity).not.toContain("data-social-profile-imdb");

    const withRoles = renderToStaticMarkup(
      <SocialProfileIdentity
        name="Ada Lovelace"
        handle="ada"
        photoUrl={null}
        roles={["actor", "producer", "screenwriter", "investor"]}
      />,
    );
    expect(withRoles).toContain("data-social-profile-roles");
    expect(withRoles).toContain('data-social-profile-role="actor"');
    expect(withRoles).toContain('data-social-profile-role="producer"');
    expect(withRoles).toContain('data-social-profile-role="screenwriter"');
    expect(withRoles).toContain('data-social-profile-role="investor"');
    expect(withRoles).toContain("Actor");
    expect(withRoles).toContain("Producer");
    expect(withRoles).toContain("Screenwriter");
    expect(withRoles).toContain("Investor");
    expect(withRoles).not.toContain("Actor · Producer");
    expect(withRoles).not.toContain(" · ");
    expect(withRoles).not.toContain("data-social-profile-roles-more");
    expect(withRoles).not.toContain("+1");
    expect(withRoles).not.toContain("Roles:");
    expect(withRoles).not.toContain("Professions:");
    expect(withRoles).not.toContain("Topics:");
    expect(withRoles).toContain(SOCIAL_PROFILE_ROLES_ROW_CLASS);
    expect(withRoles).toContain(SOCIAL_PROFILE_ROLE_PILL_CLASS);
    expect(SOCIAL_PROFILE_ROLES_RAIL_ROWS).toBe(1);
    expect(SOCIAL_PROFILE_ROLES_ROW_CLASS).toBe(HOUSE_CHIP_RAIL_CLASS);
    expect(SOCIAL_PROFILE_ROLES_ROW_CLASS).toContain("overflow-x-auto");
    expect(SOCIAL_PROFILE_ROLES_ROW_CLASS).toContain("no-scrollbar");
    expect(SOCIAL_PROFILE_ROLES_ROW_CLASS).not.toContain("flex-wrap");
    expect(withRoles).toContain("data-house-chip-rail");
    expect(withRoles).toContain('data-house-chip-rail-row="0"');
    expect(withRoles).not.toContain('data-house-chip-rail-row="1"');
    expect(withRoles).toContain("overflow-x-auto");
    expect(withRoles).toContain("no-scrollbar");
    expect(withRoles).not.toContain("flex-wrap");
    expect(withRoles).toContain("bg-surface-muted");
    expect(withRoles).toContain("rounded-full");
    expect(withRoles).toContain("t-body-sm");
    expect(withRoles).toContain("py-[var(--space-2)]");
    expect(withRoles).not.toContain("text-[11px]");
    expect(withRoles).not.toContain("truncate");
    expect(withRoles.indexOf("data-social-profile-name")).toBeLessThan(
      withRoles.indexOf("data-social-profile-roles"),
    );
    expect(withRoles.indexOf("Ada Lovelace")).toBeLessThan(
      withRoles.indexOf('data-social-profile-role="actor"'),
    );
    expect(withRoles.indexOf('data-social-profile-role="actor"')).toBeLessThan(
      withRoles.indexOf('data-social-profile-role="screenwriter"'),
    );
    expect(withRoles.indexOf('data-social-profile-role="screenwriter"')).toBeLessThan(
      withRoles.indexOf('data-social-profile-role="investor"'),
    );

    const adamDesktop = renderToStaticMarkup(
      <SocialProfileIdentity
        name="Adam Carpenter"
        handle="adam"
        photoUrl={null}
        bio="Founder · Investor · Music Executive"
        roles={[
          "executive_producer",
          "music_supervisor",
          "composer",
          "musician",
          "music_director",
        ]}
      />,
    );
    expect(adamDesktop).toContain('data-social-profile-role="executive_producer"');
    expect(adamDesktop).toContain('data-social-profile-role="music_supervisor"');
    expect(adamDesktop).toContain('data-social-profile-role="composer"');
    expect(adamDesktop).toContain('data-social-profile-role="musician"');
    expect(adamDesktop).toContain('data-social-profile-role="music_director"');
    expect(adamDesktop).toContain("Executive Producer");
    expect(adamDesktop).toContain("Music Supervisor");
    expect(adamDesktop).toContain("Composer");
    expect(adamDesktop).toContain("Musician");
    expect(adamDesktop).toContain("Music Director");
    expect(adamDesktop).not.toContain("data-social-profile-roles-more");
    expect(adamDesktop).not.toContain("+2");
    expect(adamDesktop).not.toContain("Executive Producer · Music Supervisor · Composer +2");
    expect(adamDesktop).not.toContain("Executive Producer · Music Supervisor");
    expect(adamDesktop).toContain("Founder · Investor · Music Executive");
    expect(adamDesktop.indexOf("Adam Carpenter")).toBeLessThan(
      adamDesktop.indexOf("Founder · Investor · Music Executive"),
    );
    expect(adamDesktop.indexOf("Founder · Investor · Music Executive")).toBeLessThan(
      adamDesktop.indexOf('data-social-profile-role="executive_producer"'),
    );
    const adamRoles = adamDesktop.slice(
      adamDesktop.indexOf("data-social-profile-roles"),
      adamDesktop.indexOf('data-social-profile-role="music_director"') + 280,
    );
    expect(adamRoles).toContain("data-house-chip-rail");
    expect(adamRoles).toContain('data-house-chip-rail-row="0"');
    expect(adamRoles).not.toContain('data-house-chip-rail-row="1"');
    expect(adamRoles).toContain("overflow-x-auto");
    expect(adamRoles).toContain("no-scrollbar");
    expect(adamRoles).not.toContain("flex-wrap");
    expect(adamRoles).toContain("Executive Producer");
    expect(adamRoles).toContain("Music Supervisor");
    expect(adamRoles).toContain("Composer");
    expect(adamRoles).toContain("Musician");
    expect(adamRoles).toContain("Music Director");
    expect(adamRoles).not.toContain("+2");
    expect(adamRoles).not.toContain("data-social-profile-roles-more");

    const withTopics = renderToStaticMarkup(
      <SocialProfileIdentity
        name="Ada Lovelace"
        handle="ada"
        photoUrl={null}
        topics={["Acting", "Financing"]}
      />,
    );
    expect(withTopics).toContain("data-social-profile-topics");
    expect(withTopics).toContain('data-social-profile-topic="Acting"');
    expect(withTopics).toContain("Acting");
    expect(withTopics).toContain("Financing");
    expect(withTopics).not.toContain("Actor");
    expect(withTopics).not.toContain("Topics:");

    const withStats = renderToStaticMarkup(
      <SocialProfileIdentity
        name="Ada Lovelace"
        handle="ada"
        photoUrl={null}
        bio="Writes engines."
        stats={{ posts: 12, followers: 4, following: 7 }}
        roles={["actor"]}
        actions={<button type="button">Edit profile</button>}
      />,
    );
    expect(withStats).toContain("data-social-profile-head");
    expect(withStats).toContain(SOCIAL_PROFILE_HEAD_CLASS);
    expect(withStats).toContain(SOCIAL_PROFILE_META_CLASS);
    expect(SOCIAL_PROFILE_HEAD_CLASS).toContain("items-center");
    expect(SOCIAL_PROFILE_HEAD_CLASS).not.toContain("items-start");
    expect(SOCIAL_PROFILE_META_CLASS).toContain("flex-col");
    expect(SOCIAL_PROFILE_META_CLASS).toContain("min-w-0");
    expect(SOCIAL_PROFILE_META_CLASS).not.toContain("truncate");
    expect(withStats).toContain(SOCIAL_AVATAR_PROFILE_CLASS);
    expect(withStats).toContain("size-[72px]");
    expect(withStats).toContain("md:size-[88px]");
    expect(withStats).not.toContain("size-24");
    expect(withStats).toContain("data-social-profile-stats");
    expect(withStats).toContain(SOCIAL_PROFILE_STATS_CLASS);
    expect(withStats).toContain(SOCIAL_PROFILE_STATS_GRID_CLASS);
    expect(SOCIAL_PROFILE_STATS_CLASS).toContain("w-fit");
    expect(SOCIAL_PROFILE_STATS_CLASS).not.toContain("flex-1");
    expect(SOCIAL_PROFILE_STATS_CLASS).not.toContain("w-full");
    expect(SOCIAL_PROFILE_STATS_CLASS).not.toContain("max-w-xs");
    expect(SOCIAL_PROFILE_STATS_GRID_CLASS).toContain("inline-flex");
    expect(SOCIAL_PROFILE_STATS_GRID_CLASS).toContain("gap-x-[var(--space-4)]");
    expect(SOCIAL_PROFILE_STATS_GRID_CLASS).not.toContain("w-full");
    expect(SOCIAL_PROFILE_STATS_GRID_CLASS).not.toContain("grid-cols-3");
    expect(withStats).not.toContain("grid w-full grid-cols-3");
    expect(withStats).not.toContain("flex min-w-0 max-w-xs flex-1 items-center");
    expect(withStats).toContain(SOCIAL_PROFILE_STAT_CLASS);
    expect(withStats).toContain("flex-col");
    expect(withStats).toContain('data-social-profile-stat="posts"');
    expect(withStats).toContain('data-social-profile-stat="followers"');
    expect(withStats).toContain('data-social-profile-stat="following"');
    expect(withStats).toContain('href="/social/u/ada/follows"');
    expect(withStats).toContain('href="/social/u/ada/follows?tab=following"');
    expect(withStats).not.toContain("/social/u/ada/follows?tab=followers");
    const postsStat = withStats.slice(
      withStats.indexOf('data-social-profile-stat="posts"'),
      withStats.indexOf('data-social-profile-stat="followers"'),
    );
    expect(postsStat.indexOf(">12<")).toBeLessThan(postsStat.indexOf(`>${SOCIAL.profile.postsStat}<`));
    const head = withStats.slice(
      withStats.indexOf("data-social-profile-head"),
      withStats.indexOf("data-social-profile-face"),
    );
    expect(head).toContain("data-social-avatar");
    expect(head).toContain("data-social-profile-meta");
    expect(head).toContain("data-social-profile-name");
    expect(head).toContain("data-social-profile-stats");
    expect(head).not.toContain("data-social-profile-handle");
    expect(head).not.toContain("data-social-profile-roles");
    expect(head).not.toContain("data-social-profile-bio");
    expect(head).not.toContain("@ada");
    const meta = head.slice(head.indexOf("data-social-profile-meta"));
    expect(meta.indexOf("data-social-profile-name")).toBeLessThan(
      meta.indexOf("data-social-profile-stats"),
    );
    expect(head.indexOf("data-social-avatar")).toBeLessThan(
      head.indexOf("data-social-profile-meta"),
    );
    expect(withStats.indexOf("data-social-profile-name")).toBeLessThan(
      withStats.indexOf("data-social-profile-stats"),
    );
    expect(withStats.indexOf("data-social-profile-stats")).toBeLessThan(
      withStats.indexOf("data-social-profile-bio"),
    );
    expect(withStats.indexOf("data-social-profile-bio")).toBeLessThan(
      withStats.indexOf("data-social-profile-roles"),
    );
    expect(withStats.indexOf("data-social-profile-roles")).toBeLessThan(
      withStats.indexOf("data-social-profile-actions"),
    );
    expect(withStats.indexOf("data-social-profile-actions")).toBeLessThan(
      withStats.indexOf("Edit profile"),
    );
    expect(withStats).toContain(SOCIAL_PROFILE_ACTIONS_CLASS);
    expect(SOCIAL_PROFILE_ACTIONS_CLASS).toContain("mt-[var(--space-3)]");
    expect(SOCIAL_PROFILE_ACTIONS_CLASS).not.toContain("mt-[12px]");
    expect(SOCIAL_PROFILE_ACTIONS_CLASS).not.toContain("mt-[16px]");
    expect(SOCIAL_PROFILE_NAME_CLASS).toContain("break-words");
    expect(SOCIAL_PROFILE_NAME_CLASS).not.toContain("truncate");
    expect(withStats).not.toContain("truncate");
    expect(withStats).toContain("Actor");
    expect(withStats).not.toContain("flex-wrap gap-4");
    expect(withStats).not.toContain("data-social-profile-copy");

    const withMutuals = renderToStaticMarkup(
      <SocialProfileIdentity
        name="Ada Lovelace"
        handle="ada"
        photoUrl={null}
        mutuals={{
          people: [
            { id: "u3", handle: "carol", displayName: "Carol King", label: "Carol King" },
            { id: "u4", handle: "dan", displayName: "Dan", label: "Dan" },
          ],
          extra: 3,
        }}
      />,
    );
    expect(withMutuals).toContain("data-social-profile-mutuals");
    expect(withMutuals).toContain("Followed by Carol King, Dan +3 more");
    expect(withMutuals).not.toContain("data-social-profile-bio");

    const withImdb = renderToStaticMarkup(
      <SocialProfileIdentity
        name="Ada Lovelace"
        handle="ada"
        photoUrl={null}
        imdbUrl="https://www.imdb.com/name/nm0000158/"
      />,
    );
    expect(withImdb).toContain("data-social-profile-imdb");
    expect(withImdb).toContain('data-social-profile-link="imdb"');
    expect(withImdb).toContain('href="https://www.imdb.com/name/nm0000158/"');
    expect(withImdb).toContain("imdb.com/name/nm0000158");
    expect(withImdb).not.toContain(SOCIAL.profile.imdb);
    expect(withImdb).not.toContain(">https://www.imdb.com/name/nm0000158/<");

    const withLinks = renderToStaticMarkup(
      <SocialProfileIdentity
        name="Ada Lovelace"
        handle="ada"
        photoUrl={null}
        websiteUrl="https://instagram.com/ada"
      />,
    );
    expect(withLinks).toContain("data-social-profile-links");
    expect(withLinks).toContain('data-social-profile-link="instagram"');
    expect(withLinks).toContain('href="https://instagram.com/ada"');
    expect(withLinks).toContain(">instagram.com/ada<");
    expect(withLinks).not.toContain(">https://instagram.com/ada<");
    expect(withLinks).not.toContain('aria-label="Instagram"');
    expect(withLinks).toContain('rel="noopener noreferrer"');
    expect(withLinks).not.toContain("data-social-profile-links-more");

    const unknownHost = renderToStaticMarkup(
      <SocialProfileIdentity
        name="Ada Lovelace"
        handle="ada"
        photoUrl={null}
        websiteUrl="https://ada.example/press"
      />,
    );
    expect(unknownHost).toContain('data-social-profile-link="website"');
    expect(unknownHost).toContain('href="https://ada.example/press"');
    expect(unknownHost).toContain(">website<");
    expect(unknownHost).not.toContain('aria-label="Website"');
    expect(unknownHost).not.toContain(">https://ada.example/press<");

    const overflow = renderToStaticMarkup(
      <SocialProfileIdentity
        name="Ada Lovelace"
        handle="ada"
        photoUrl={null}
        websiteUrl={JSON.stringify([
          "https://instagram.com/ada",
          "https://youtube.com/@ada",
          "https://x.com/ada",
        ])}
      />,
    );
    expect(overflow).toContain(">instagram.com/ada<");
    expect(overflow).toContain(">youtube.com/@ada<");
    expect(overflow).toContain("data-social-profile-links-more");
    expect(overflow).toContain(">+1<");
    expect(overflow).not.toContain(">x.com/ada<");
    expect(overflow).not.toContain("data-social-profile-links-sheet");
    expect(uiSrc).not.toContain("socialProfileRolesLine");
    expect(uiSrc).toContain("socialProfileRolesRailItems");
    expect(uiSrc).toContain("HouseChipRail");
    expect(uiSrc).toContain("SOCIAL_PROFILE_ROLES_RAIL_ROWS");
    expect(uiSrc).not.toContain("data-social-profile-roles-more");
    expect(uiSrc).not.toContain('item.kind === "more"');
    expect(
      uiSrc.slice(
        uiSrc.indexOf("export function SocialPersonRow"),
        uiSrc.indexOf("export function SocialConversationFaces"),
      ),
    ).not.toContain("socialProfileRolesRailItems");

    const history = renderToStaticMarkup(
      <SocialAuthorHistory
        truncated={false}
        posts={[
          {
            id: "p1",
            body: "hello",
            likeCount: 0,
            liked: false,
            createdAt: "2026-09-13T12:00:00.000Z",
            authorId: "u1",
            authorHandle: "ada",
            authorName: "Ada Lovelace",
            authorPhotoUrl: null,
            groupSlug: null,
            groupName: null,
            canLike: false,
            media: [],
          },
        ]}
      />,
    );
    expect(history).toContain("data-social-author-history");
    expect(history).toContain("data-social-author-posts");
    expect(history).toContain(SOCIAL_FEED_GUTTER_CLASS);
    expect(SOCIAL_FEED_GUTTER_CLASS).toBe(
      "flex flex-col gap-[var(--space-2)] bg-surface-muted py-[var(--space-2)]",
    );
    expect(SOCIAL_FEED_GUTTER_CLASS).toContain("py-[var(--space-2)]");
    expect(SOCIAL_FEED_GUTTER_CLASS).not.toContain("bg-bg");
    expect(history).toContain(SOCIAL_FEED_ROW_CLASS);
    expect(history).toContain("border border-hairline bg-surface");
    expect(SOCIAL_FEED_ROW_CLASS).toMatch(/(?:^|\s)bg-surface(?:\s|$)/);
    expect(SOCIAL_FEED_ROW_CLASS).not.toContain("bg-surface-muted");
    expect(uiSrc).not.toContain('className="flex flex-col bg-surface md:hidden"');
    expect(uiSrc).not.toContain("data-social-post-mobile");
    expect(history).toContain('data-social-post="p1"');
    expect(history).toContain("hello");
    expect(history).not.toContain("data-social-profile-grid");
  });

  it("renders media and text posts as chronological feed cards, not an IG grid", () => {
    const html = renderToStaticMarkup(
      <SocialAuthorHistory
        truncated={false}
        posts={[
          {
            id: "clip",
            body: "Mux smoke",
            likeCount: 0,
            liked: false,
            createdAt: "2026-09-20T12:00:00.000Z",
            authorId: "u1",
            authorHandle: "ada",
            authorName: "Ada Lovelace",
            authorPhotoUrl: null,
            groupSlug: null,
            groupName: null,
            canLike: false,
            media: [{ kind: "video", url: "", playbackId: "uNbxnGLKJ00yfbijDO8COxT" }],
          },
          {
            id: "note",
            body: "First caption post test",
            likeCount: 0,
            liked: false,
            createdAt: "2026-09-20T12:01:00.000Z",
            authorId: "u1",
            authorHandle: "ada",
            authorName: "Ada Lovelace",
            authorPhotoUrl: null,
            groupSlug: null,
            groupName: null,
            canLike: false,
            media: [],
          },
        ]}
      />,
    );
    expect(html).not.toContain("data-social-profile-grid");
    expect(html).not.toContain(SOCIAL_PROFILE_GRID_CLASS);
    expect(html).not.toContain(SOCIAL_PROFILE_TILE_CLASS);
    expect(html).not.toContain("aspect-square");
    expect(html).not.toContain("data-social-profile-play");
    expect(html).toContain(SOCIAL_FEED_GUTTER_CLASS);
    expect(html).toContain("aspect-video");
    expect(html).toContain('data-social-post="clip"');
    expect(html).toContain("Mux smoke");
    expect(html).not.toContain(SOCIAL.home.videoKind);
    expect(html).not.toContain(SOCIAL.home.photoKind);
    expect(html).toContain('data-social-post="note"');
    expect(html).toContain("First caption post test");
    expect(html).not.toContain("View comments");
    expect(html).not.toContain("data-social-comment-trail");
    expect(html.indexOf('data-social-post="clip"')).toBeLessThan(html.indexOf('data-social-post="note"'));
  });

  it("shows an honest empty state and names the bound when truncated", () => {
    const empty = renderToStaticMarkup(<SocialAuthorHistory posts={[]} truncated={false} />);
    expect(empty).toContain("data-social-author-empty");
    expect(empty).toContain(SOCIAL.profile.postsEmpty);
    expect(empty).toContain(SOCIAL_PROFILE_POSTS_EMPTY_CLASS);
    expect(empty).not.toContain(SOCIAL_EMPTY_PANEL_CLASS);
    expect(empty).not.toContain("py-[var(--space-12)]");
    expect(empty).not.toContain(SOCIAL.profile.edit);
    expect(empty).not.toContain(SOCIAL.profile.completeIdentity);
    expect(empty).not.toContain(SOCIAL.profile.postsEmptyHint);
    expect(empty).not.toContain(SOCIAL.profile.postsEmptyOwnHint);

    const withCreate = renderToStaticMarkup(
      <SocialAuthorHistory
        posts={[]}
        truncated={false}
        emptyAction={{ href: "/social/create?kind=media", label: SOCIAL.profile.sharePost }}
      />,
    );
    expect(withCreate).toContain(SOCIAL.profile.sharePost);
    expect(withCreate).toContain("/social/create?kind=media");
    expect(withCreate).not.toContain(SOCIAL.profile.edit);
    expect(withCreate).not.toContain(SOCIAL.profile.completeIdentity);
    expect(withCreate).not.toContain("/social/profile/edit");
    expect(uiSrc).toContain("SocialProfilePostsEmpty");
    expect(uiSrc).not.toContain("emptySecondary");
    expect(uiSrc).not.toContain("emptyHint");

    const truncated = renderToStaticMarkup(<SocialAuthorHistory posts={[]} truncated />);
    expect(truncated).toContain("data-social-author-truncated");
    expect(truncated).toContain(SOCIAL.profile.postsTruncated);
  });
});

describe("SocialPostCard media", () => {
  it("keeps feed media on the 4:5 / 16:9 frame SoT, never aspect-square", () => {
    const still = renderToStaticMarkup(
      <SocialPostCard
        post={{
          id: "p1",
          body: "hello",
          likeCount: 0,
          liked: false,
          createdAt: "2026-09-12T14:00:00.000Z",
          authorId: "u1",
          authorHandle: "ada",
          authorName: "Ada Lovelace",
          authorPhotoUrl: null,
          groupSlug: null,
          groupName: null,
          canLike: false,
          media: [{ kind: "image", url: "https://cf.example/signed-image" }],
        }}
      />,
    );
    expect(still).toContain("aspect-[4/5]");
    expect(still).toContain("object-cover");
    expect(still).not.toContain("aspect-square");

    const clip = renderToStaticMarkup(
      <SocialPostCard
        post={{
          id: "p2",
          body: "clip",
          likeCount: 0,
          liked: false,
          createdAt: "2026-09-12T14:00:00.000Z",
          authorId: "u1",
          authorHandle: "ada",
          authorName: "Ada Lovelace",
          authorPhotoUrl: null,
          groupSlug: null,
          groupName: null,
          canLike: false,
          media: [{ kind: "video", url: "", playbackId: "uNbxnGLKJ00yfbijDO8COxT" }],
        }}
      />,
    );
    expect(clip).toContain("aspect-video");
    expect(clip).toContain("object-cover");
    expect(clip).not.toContain("aspect-square");

    const portrait = renderToStaticMarkup(
      <SocialPostCard
        post={{
          id: "p3",
          body: "tall",
          likeCount: 0,
          liked: false,
          createdAt: "2026-09-12T14:00:00.000Z",
          authorId: "u1",
          authorHandle: "ada",
          authorName: "Ada Lovelace",
          authorPhotoUrl: null,
          groupSlug: null,
          groupName: null,
          canLike: false,
          media: [{ kind: "video", url: "", playbackId: "uNbxnGLKJ00yfbijDO8COxT", width: 1080, height: 1350 }],
        }}
      />,
    );
    expect(portrait).toContain("aspect-[4/5]");
    expect(portrait).not.toContain("aspect-square");

    const postCard = uiSrc.slice(uiSrc.indexOf("export function SocialPostCard"));
    const postMedia = uiSrc.slice(
      uiSrc.indexOf("export function SocialPostMedia"),
      uiSrc.indexOf("export function SocialProfileIdentity"),
    );
    expect(postCard).not.toContain("aspect-square");
    expect(postMedia).not.toContain("aspect-square");
    expect(postMedia).toContain("socialMediaFrameClass");
    expect(postCard).toContain("<SocialPostMedia items={post.media} href={permalink ? href : undefined} />");
  });

  it("leads hairline rows with author, then media and copy", () => {
    const html = renderToStaticMarkup(
      <SocialPostCard
        post={{
          id: "p1",
          body: "hello",
          likeCount: 0,
          liked: false,
          createdAt: "2026-09-12T14:00:00.000Z",
          authorId: "u1",
          authorHandle: "ada",
          authorName: "Ada Lovelace",
          authorPhotoUrl: null,
          groupSlug: null,
          groupName: null,
          canLike: false,
          media: [{ kind: "image", url: "https://cf.example/signed-image" }],
        }}
      />,
    );
    expect(html.indexOf("Ada Lovelace")).toBeGreaterThan(-1);
    expect(html.indexOf("Ada Lovelace")).toBeLessThan(html.indexOf("data-social-post-media"));
    expect(html.indexOf("data-social-post-media")).toBeLessThan(html.indexOf("hello"));
  });

  it("renders signed image and video URLs", () => {
    const html = renderToStaticMarkup(
      <SocialPostCard
        post={{
          id: "p1",
          body: "hello",
          likeCount: 0,
          liked: false,
          createdAt: "2026-09-12T14:00:00.000Z",
          authorId: "u1",
          authorHandle: "ada",
          authorName: "Ada Lovelace",
          authorPhotoUrl: null,
          groupSlug: null,
          groupName: null,
          canLike: false,
          media: [
            { kind: "image", url: "https://cf.example/signed-image" },
            { kind: "video", url: "https://cf.example/signed-video" },
          ],
        }}
      />,
    );
    expect(html).toContain("data-social-post-media");
    expect(html).toContain('data-social-post-image=""');
    expect(html).toContain('src="https://cf.example/signed-image"');
    expect(html).toContain("data-social-post-video");
    expect(html).toContain('src="https://cf.example/signed-video#t=0.1"');

    const mux = renderToStaticMarkup(
      <SocialPostCard
        post={{
          id: "p2",
          body: "clip",
          likeCount: 0,
          liked: false,
          createdAt: "2026-09-12T14:00:00.000Z",
          authorId: "u1",
          authorHandle: "ada",
          authorName: "Ada Lovelace",
          authorPhotoUrl: null,
          groupSlug: null,
          groupName: null,
          canLike: false,
          media: [{ kind: "video", url: "", playbackId: "uNbxnGLKJ00yfbijDO8COxT" }],
        }}
      />,
    );
    expect(mux).toContain('data-social-mux-player="uNbxnGLKJ00yfbijDO8COxT"');
    expect(uiSrc).toContain("SocialFeedVideo");
  });
});

describe("SocialPostCard 24Frame blend", () => {
  const createdAt = "2026-09-12T14:00:00.000Z";

  function cardPost(overrides: Partial<Parameters<typeof SocialPostCard>[0]["post"]> = {}) {
    return {
      id: "p1",
      body: "hello",
      likeCount: 4,
      commentCount: 2,
      liked: false,
      createdAt,
      authorId: "u1",
      authorHandle: "ada",
      authorName: "Ada Lovelace",
      authorPhotoUrl: null,
      groupSlug: null,
      groupName: null,
      canLike: true,
      media: [] as { kind: "image"; url: string }[],
      ...overrides,
    };
  }

  it("uses one card structure: header time, then icons, likes, caption, quiet comments", () => {
    const html = renderToStaticMarkup(
      <SocialPostCard
        post={cardPost({
          media: [{ kind: "image", url: "https://cf.example/signed-image" }],
        })}
      />,
    );
    expect(html).toContain(SOCIAL_FEED_ROW_CLASS);
    expect(html).toContain('data-social-post-time=""');
    expect(html).toContain(socialRelativeTime(createdAt));
    expect(html).toContain(SOCIAL_POST_TIME_CLASS);
    expect(html).not.toMatch(/data-social-post-time=""[^>]*\bt-label\b/);
    expect(html).toContain(`href="${socialPostHref("p1")}"`);
    expect(html).toContain(`data-social-post-href="${socialPostHref("p1")}"`);
    expect(html).toContain("data-social-like-count");
    expect(html).toContain('data-social-post-actions=""');
    expect(html).toContain('data-social-icon="heart"');
    expect(html).toContain('data-social-icon="chat-circle"');
    expect(html).toContain('data-social-post-share=""');
    expect(html).toContain('data-social-icon="paper-plane-tilt"');
    expect(html).toContain(`4 ${SOCIAL.post.likes}`);
    expect(html).toContain('data-social-post-caption=""');
    expect(html).toContain("ada");
    expect(html).toContain("hello");
    expect(html).toContain(`2 ${SOCIAL.post.comments}`);
    expect(html).toContain("data-social-comment-trail");
    expect(html).toContain("self-start text-left");
    expect(html.indexOf("Ada Lovelace")).toBeLessThan(html.indexOf("data-social-post-time"));
    expect(html.indexOf("data-social-post-time")).toBeLessThan(html.indexOf("data-social-post-media"));
    expect(html.indexOf("data-social-post-media")).toBeLessThan(html.indexOf("data-social-post-actions"));
    expect(html.indexOf("data-social-post-actions")).toBeLessThan(html.indexOf(`4 ${SOCIAL.post.likes}`));
    expect(html.indexOf(`4 ${SOCIAL.post.likes}`)).toBeLessThan(html.indexOf("data-social-post-caption"));
    expect(html.indexOf("data-social-post-caption")).toBeLessThan(html.indexOf("data-social-comment-trail"));
    expect(html).not.toContain("data-social-post-mobile");
    expect(html).not.toContain("hidden md:flex");
    expect(html).not.toContain("md:hidden");
    expect(html).not.toContain("text-[10px]");
    expect(html).not.toContain("uppercase");
    expect(html).not.toContain(SOCIAL.home.videoKind);
    expect(html).not.toContain(SOCIAL.home.photoKind);
    expect(html).not.toContain(SOCIAL.follow.following);
    expect(html).not.toContain("truncate");
  });

  it("keeps the same stack for text-only posts and hides the trail when N is 0", () => {
    const html = renderToStaticMarkup(
      <SocialPostCard post={cardPost({ commentCount: 0, media: [] })} />,
    );
    expect(html).not.toContain("data-social-post-media");
    expect(html.indexOf("data-social-post-time")).toBeLessThan(html.indexOf("data-social-post-actions"));
    expect(html.indexOf("data-social-post-actions")).toBeLessThan(html.indexOf(`4 ${SOCIAL.post.likes}`));
    expect(html.indexOf(`4 ${SOCIAL.post.likes}`)).toBeLessThan(html.indexOf("data-social-post-caption"));
    expect(html).toContain('data-social-icon="chat-circle"');
    expect(html.match(/data-social-comment-open/g)?.length).toBe(1);
    expect(html).not.toContain("data-social-comment-trail");
    expect(html).not.toContain("View comments");
    expect(html).not.toContain(`0 ${SOCIAL.post.comments}`);
    expect(html).toContain("hello");
    expect(html).not.toContain(SOCIAL.create.text);
  });

  it("shows a left muted N comments trail only when N > 0", () => {
    const quiet = renderToStaticMarkup(<SocialPostCard post={cardPost({ commentCount: 0 })} />);
    expect(quiet.match(/data-social-comment-open/g)?.length).toBe(1);
    expect(quiet).not.toContain("data-social-comment-trail");
    expect(quiet).not.toContain("View comments");
    expect(quiet).not.toContain(`0 ${SOCIAL.post.comments}`);

    const active = renderToStaticMarkup(<SocialPostCard post={cardPost({ commentCount: 3 })} />);
    expect(active).toContain("data-social-comment-trail");
    expect(active).toContain("self-start text-left t-body-sm text-ink-2");
    expect(active).toContain(`3 ${SOCIAL.post.comments}`);
    expect(active.match(/data-social-comment-open/g)?.length).toBe(2);
    expect(active.indexOf("data-social-post-caption")).toBeLessThan(
      active.indexOf("data-social-comment-trail"),
    );
    expect(active).not.toContain("View comments");
    expect(active).not.toContain("text-center");
  });

  it("does not fork desktop meta-row chrome in source", () => {
    const postCard = uiSrc.slice(uiSrc.indexOf("export function SocialPostCard"));
    expect(postCard).toContain("SOCIAL_FEED_ROW_CLASS");
    expect(postCard).toContain("data-social-post-time");
    expect(postCard).toContain("SOCIAL_POST_TIME_CLASS");
    expect(postCard).not.toContain("data-social-post-time=\"\" className=\"t-label");
    expect(postCard).toContain("socialPostHref");
    expect(postCard).toContain("SocialLikeButton");
    expect(postCard).toContain("SocialLikeCount");
    expect(postCard).toContain("SocialCommentTrigger");
    expect(postCard).toContain("paper-plane-tilt");
    expect(postCard.split("<SocialCommentTrigger").length - 1).toBe(2);
    expect(postCard).not.toContain("viewComments");
    expect(postCard).not.toContain("View comments");
    expect(postCard).not.toContain("hidden md:flex");
    expect(postCard).not.toContain("md:hidden");
    expect(postCard).not.toContain("data-social-post-mobile");
    expect(postCard).not.toContain("text-[10px]");
    expect(postCard).not.toContain("SOCIAL.home.videoKind");
    expect(postCard).not.toContain("SOCIAL.home.photoKind");
    expect(postCard).not.toContain("SOCIAL.create.text");
    expect(postCard).not.toContain("SOCIAL.follow.following");
  });
});
