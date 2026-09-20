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
  SOCIAL_PROFILE_HEAD_CLASS,
  SOCIAL_PROFILE_ROLES_LINE_CLASS,
  SOCIAL_PROFILE_STAT_CLASS,
  SOCIAL_PROFILE_STATS_CLASS,
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
    expect(identity).toContain("data-social-profile-handle");
    expect(identity).toContain("data-social-profile-name");
    expect(identity).toContain("Ada Lovelace");
    expect(identity).toContain("@ada");
    expect(identity.indexOf("data-social-profile-handle")).toBeLessThan(
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
    expect(withRoles).toContain("Actor · Producer · Screenwriter +1");
    expect(withRoles).not.toContain("Investor");
    expect(withRoles).not.toContain("Roles:");
    expect(withRoles).not.toContain("Professions:");
    expect(withRoles).not.toContain("Topics:");
    expect(withRoles).toContain(SOCIAL_PROFILE_ROLES_LINE_CLASS);
    expect(withRoles).not.toContain("overflow-x-auto");
    expect(withRoles).not.toContain("whitespace-nowrap");
    expect(withRoles).not.toContain("data-social-profile-role=");
    expect(withRoles).not.toContain("text-[11px]");
    expect(withRoles).not.toContain("truncate");
    expect(withRoles.indexOf("data-social-profile-name")).toBeLessThan(
      withRoles.indexOf("data-social-profile-roles"),
    );
    expect(withRoles.indexOf("data-social-profile-copy")).toBeLessThan(
      withRoles.indexOf("data-social-profile-roles"),
    );
    expect(withRoles.indexOf("Ada Lovelace")).toBeLessThan(
      withRoles.indexOf("Actor · Producer · Screenwriter +1"),
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
    expect(withStats).toContain("data-social-profile-copy");
    expect(withStats).toContain(SOCIAL_PROFILE_HEAD_CLASS);
    expect(withStats).toContain(SOCIAL_AVATAR_PROFILE_CLASS);
    expect(withStats).toContain("size-[72px]");
    expect(withStats).toContain("md:size-[88px]");
    expect(withStats).not.toContain("size-24");
    expect(withStats).toContain("data-social-profile-stats");
    expect(withStats).toContain(SOCIAL_PROFILE_STATS_CLASS);
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
    expect(withStats.indexOf("data-social-profile-head")).toBeLessThan(
      withStats.indexOf("data-social-profile-copy"),
    );
    expect(withStats.indexOf("data-social-profile-name")).toBeLessThan(
      withStats.indexOf("data-social-profile-stats"),
    );
    expect(withStats.indexOf("data-social-profile-stats")).toBeLessThan(
      withStats.indexOf("data-social-profile-roles"),
    );
    expect(withStats.indexOf("data-social-profile-roles")).toBeLessThan(
      withStats.indexOf("data-social-profile-bio"),
    );
    expect(withStats.indexOf("data-social-profile-bio")).toBeLessThan(
      withStats.indexOf("Edit profile"),
    );
    expect(withStats).toContain("Actor");
    expect(withStats).not.toContain("flex-wrap gap-4");

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
    expect(uiSrc).toContain("socialProfileRolesLine");
    expect(
      uiSrc.slice(
        uiSrc.indexOf("export function SocialPersonRow"),
        uiSrc.indexOf("export function SocialConversationFaces"),
      ),
    ).not.toContain("socialProfileRolesLine");

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
    expect(history).toContain('data-social-post="p1"');
    expect(history).toContain("hello");
  });

  it("shows an honest empty state and names the bound when truncated", () => {
    const empty = renderToStaticMarkup(<SocialAuthorHistory posts={[]} truncated={false} />);
    expect(empty).toContain("data-social-author-empty");
    expect(empty).toContain(SOCIAL.profile.postsEmpty);

    const truncated = renderToStaticMarkup(<SocialAuthorHistory posts={[]} truncated />);
    expect(truncated).toContain("data-social-author-truncated");
    expect(truncated).toContain(SOCIAL.profile.postsTruncated);
  });
});

describe("SocialPostCard media", () => {
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
