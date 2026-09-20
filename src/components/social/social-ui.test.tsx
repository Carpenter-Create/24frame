import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

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

const here = dirname(fileURLToPath(import.meta.url));
const uiSrc = readFileSync(join(here, "social-ui.tsx"), "utf8");

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
    expect(uiSrc).toContain("IDENTITY_AVATAR_CLASS");
    expect(uiSrc).toContain("photoUrl");
    expect(uiSrc).not.toContain("signedAvatarUrl");
    expect(uiSrc).not.toContain("putAvatarObject");
    expect(uiSrc).not.toContain("uploadAccountPhoto");
    expect(uiSrc).not.toContain("type=\"file\"");
    expect(uiSrc).not.toContain("S3_BUCKET");
    expect(uiSrc).not.toContain("24frame-media");
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
      />,
    );
    expect(identity).toContain("data-social-profile-identity");
    expect(identity).toContain("Ada Lovelace");
    expect(identity).toContain("@ada");
    expect(identity).not.toContain("data-social-profile-url");
    expect(identity).not.toContain("24frame.co/@ada");
    expect(identity).not.toContain("https://24frame.co/@ada");
    expect(identity).not.toContain("Copies ");
    expect(identity).not.toContain("data-social-share-hint");
    expect(uiSrc).not.toContain("socialProfilePublicHost");
    expect(uiSrc).not.toContain("socialShareHint");
    expect(identity).toContain("Writes engines.");
    expect(identity).toContain('src="https://s3.example/signed-avatar"');

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
    expect(html).toContain('src="https://cf.example/signed-video"');
  });
});
