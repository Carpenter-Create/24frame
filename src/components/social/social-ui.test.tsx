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

import { IDENTITY_AVATAR_CLASS } from "@/lib/house-sheet";
import {
  SocialAuthorHistory,
  SocialAvatar,
  SocialConversationFaces,
  SocialPersonRow,
  SocialPostCard,
  SocialProfileIdentity,
} from "./social-ui";
import { SOCIAL } from "@/lib/social";
import {
  SOCIAL_AVATAR_PROFILE_CLASS,
  SOCIAL_EMPTY_PANEL_CLASS,
  SOCIAL_FEED_GUTTER_CLASS,
  SOCIAL_FEED_ROW_CLASS,
  SOCIAL_PROFILE_GRID_CLASS,
  SOCIAL_PROFILE_HEAD_CLASS,
  SOCIAL_PROFILE_PLAY_CLASS,
  SOCIAL_PROFILE_POSTS_EMPTY_CLASS,
  SOCIAL_PROFILE_ROLE_PILL_CLASS,
  SOCIAL_PROFILE_ROLES_ROW_CLASS,
  SOCIAL_PROFILE_STAT_CLASS,
  SOCIAL_PROFILE_STATS_CLASS,
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
    expect(html).toContain(SOCIAL_FEED_ROW_CLASS);
    expect(html).toContain("bg-surface");
    expect(html).toContain("data-social-post-mobile");
    expect(SOCIAL_FEED_ROW_CLASS).toContain("bg-surface");
    expect(html).not.toContain("/social/u/@");
    expect(html).not.toContain("AL");
    expect(html).not.toContain("data-social-avatar-ring");
    expect(html).not.toContain("ring-accent");
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
    expect(identity).toContain("data-social-profile-head");
    expect(identity).toContain("data-social-profile-face");
    expect(identity).toContain("data-social-profile-name");
    expect(identity).toContain("Ada Lovelace");
    expect(identity).not.toContain("data-social-profile-handle");
    expect(identity).not.toContain("@ada");
    expect(identity.indexOf("data-social-profile-head")).toBeLessThan(
      identity.indexOf("data-social-profile-name"),
    );
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
    expect(uiSrc).toContain("SOCIAL_PROFILE_HEAD_CLASS");
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
    expect(withRoles).not.toContain('data-social-profile-role="investor"');
    expect(withRoles).toContain("Actor");
    expect(withRoles).toContain("Producer");
    expect(withRoles).toContain("Screenwriter");
    expect(withRoles).not.toContain("Actor · Producer");
    expect(withRoles).not.toContain(" · ");
    expect(withRoles).toContain("data-social-profile-roles-more");
    expect(withRoles).toContain("+1");
    expect(withRoles).not.toContain("Investor");
    expect(withRoles).not.toContain("Roles:");
    expect(withRoles).not.toContain("Professions:");
    expect(withRoles).not.toContain("Topics:");
    expect(withRoles).toContain(SOCIAL_PROFILE_ROLES_ROW_CLASS);
    expect(withRoles).toContain(SOCIAL_PROFILE_ROLE_PILL_CLASS);
    expect(withRoles).toContain("flex-wrap");
    expect(withRoles).toContain("bg-surface-muted");
    expect(withRoles).toContain("rounded-full");
    expect(withRoles).toContain("t-body-sm");
    expect(withRoles).toContain("py-[var(--space-2)]");
    expect(withRoles).not.toContain("text-[11px]");
    expect(withRoles).not.toContain("truncate");
    expect(withRoles).not.toContain("overflow-x-auto");
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
      withRoles.indexOf("data-social-profile-roles-more"),
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
    expect(adamDesktop).toContain("Executive Producer");
    expect(adamDesktop).toContain("Music Supervisor");
    expect(adamDesktop).toContain("Composer");
    expect(adamDesktop).toContain("data-social-profile-roles-more");
    expect(adamDesktop).toContain("+2");
    expect(adamDesktop).not.toContain("Executive Producer · Music Supervisor · Composer +2");
    expect(adamDesktop).not.toContain("Executive Producer · Music Supervisor");
    expect(adamDesktop).toContain("Founder · Investor · Music Executive");
    expect(adamDesktop.indexOf("Adam Carpenter")).toBeLessThan(
      adamDesktop.indexOf("Founder · Investor · Music Executive"),
    );
    expect(adamDesktop.indexOf("Founder · Investor · Music Executive")).toBeLessThan(
      adamDesktop.indexOf('data-social-profile-role="executive_producer"'),
    );

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
    expect(SOCIAL_PROFILE_HEAD_CLASS).toContain("items-center");
    expect(SOCIAL_PROFILE_HEAD_CLASS).not.toContain("items-start");
    expect(withStats).toContain(SOCIAL_AVATAR_PROFILE_CLASS);
    expect(withStats).toContain("size-[72px]");
    expect(withStats).toContain("md:size-[88px]");
    expect(withStats).not.toContain("size-24");
    expect(withStats).toContain("data-social-profile-stats");
    expect(withStats).toContain(SOCIAL_PROFILE_STATS_CLASS);
    expect(SOCIAL_PROFILE_STATS_CLASS).toContain("max-w-xs");
    expect(SOCIAL_PROFILE_STATS_CLASS).toContain("flex-1");
    expect(SOCIAL_PROFILE_STATS_CLASS).toContain("items-center");
    expect(SOCIAL_PROFILE_STATS_CLASS).not.toBe("flex min-w-0 flex-1 items-center");
    expect(withStats).not.toContain("flex min-w-0 flex-1 items-center");
    expect(withStats).toContain("grid-cols-3");
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
      withStats.indexOf("data-social-profile-name"),
    );
    expect(head).toContain("data-social-avatar");
    expect(head).toContain("data-social-profile-stats");
    expect(head).not.toContain("data-social-profile-handle");
    expect(head).not.toContain("data-social-profile-name");
    expect(head).not.toContain("data-social-profile-roles");
    expect(head).not.toContain("@ada");
    expect(withStats.indexOf("data-social-profile-stats")).toBeLessThan(
      withStats.indexOf("data-social-profile-name"),
    );
    expect(withStats.indexOf("data-social-profile-name")).toBeLessThan(
      withStats.indexOf("data-social-profile-bio"),
    );
    expect(withStats.indexOf("data-social-profile-bio")).toBeLessThan(
      withStats.indexOf("data-social-profile-roles"),
    );
    expect(withStats.indexOf("data-social-profile-roles")).toBeLessThan(
      withStats.indexOf("Edit profile"),
    );
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
    expect(withImdb).toContain(SOCIAL.profile.imdb);
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
    expect(withLinks).not.toContain(">https://instagram.com/ada<");
    expect(withLinks).toContain('aria-label="Instagram"');
    expect(withLinks).toContain('rel="noopener noreferrer"');

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
    expect(unknownHost).toContain('aria-label="Website"');
    expect(unknownHost).not.toContain(">https://ada.example/press<");
    expect(uiSrc).not.toContain("socialProfileRolesLine");
    expect(uiSrc).toContain("socialProfileRolesFace");
    expect(uiSrc).toContain("socialProfileRolesMoreLabel");
    expect(
      uiSrc.slice(
        uiSrc.indexOf("export function SocialPersonRow"),
        uiSrc.indexOf("export function SocialConversationFaces"),
      ),
    ).not.toContain("socialProfileRolesFace");

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
    expect(SOCIAL_FEED_GUTTER_CLASS).toBe("flex flex-col gap-[var(--space-2)] bg-surface-muted");
    expect(SOCIAL_FEED_GUTTER_CLASS).not.toContain("bg-bg");
    expect(history).toContain(SOCIAL_FEED_ROW_CLASS);
    expect(SOCIAL_FEED_ROW_CLASS).toMatch(/(?:^|\s)bg-surface(?:\s|$)/);
    expect(SOCIAL_FEED_ROW_CLASS).not.toContain("bg-surface-muted");
    expect(uiSrc).toContain('className="flex flex-col bg-surface md:hidden"');
    expect(history).toContain('data-social-post="p1"');
    expect(history).toContain("hello");
    expect(history).not.toContain("data-social-profile-grid");
  });

  it("keeps media posts on the IG square grid and text cards below with FB gutters", () => {
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
    expect(html).toContain("data-social-profile-grid");
    expect(html).toContain(SOCIAL_PROFILE_GRID_CLASS);
    expect(html).toContain(SOCIAL_PROFILE_TILE_CLASS);
    expect(html).toContain("aspect-square");
    expect(html).toContain("grid-cols-3");
    expect(html).toContain("gap-px");
    expect(html).toContain("data-social-profile-play");
    expect(html).toContain(SOCIAL_PROFILE_PLAY_CLASS);
    expect(html).toContain('data-social-icon="play"');
    expect(html).toContain(SOCIAL_FEED_GUTTER_CLASS);
    expect(html).toContain('data-social-post="note"');
    expect(html).toContain("First caption post test");
    const grid = html.slice(
      html.indexOf("data-social-profile-grid"),
      html.indexOf('data-social-post="note"'),
    );
    expect(grid).toContain('data-social-post="clip"');
    expect(grid).not.toContain("Mux smoke");
    expect(grid).not.toContain(SOCIAL.home.videoKind);
    expect(grid).not.toContain("line-clamp-2");
    expect(SOCIAL_PROFILE_TILE_CLASS).toContain("aspect-square");
    expect(SOCIAL_PROFILE_TILE_CLASS).not.toContain("h-[140px]");
    expect(SOCIAL_PROFILE_TILE_CLASS).not.toContain("p-2.5");
    expect(SOCIAL_PROFILE_GRID_CLASS).not.toContain("gap-1.5");
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
    expect(postCard).toContain("<SocialPostMedia items={post.media} />");
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
