import { existsSync, readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  SocialCreateSkeleton,
  SocialDmsSkeleton,
  SocialExploreSkeleton,
  SocialHomeSkeleton,
  SocialProfileSkeleton,
  SocialStoriesSkeleton,
  SocialStoryViewerSkeleton,
} from "./social-skeletons";

const LOADING = [
  "src/app/(app)/social/loading.tsx",
  "src/app/(app)/social/create/loading.tsx",
  "src/app/(app)/social/profile/loading.tsx",
  "src/app/(app)/social/stories/loading.tsx",
  "src/app/(app)/social/stories/[id]/loading.tsx",
  "src/app/(app)/social/explore/loading.tsx",
  "src/app/(app)/social/dms/loading.tsx",
  "src/app/(app)/social/profile/edit/loading.tsx",
  "src/app/(app)/social/profile/edit/bio/loading.tsx",
] as const;

describe("Social loading skeletons", () => {
  it("ships Social-local loading.tsx and never paints DashboardSkeleton", () => {
    for (const path of LOADING) {
      expect(existsSync(path)).toBe(true);
      const src = readFileSync(path, "utf8");
      expect(src).not.toContain("DashboardSkeleton");
      expect(src).not.toContain("page-skeletons");
      expect(src).toContain("social-skeletons");
    }
    expect(readFileSync("src/app/(app)/loading.tsx", "utf8")).toContain("DashboardSkeleton");
  });

  it("mirrors Social chrome footprints without invented copy", () => {
    const home = renderToStaticMarkup(<SocialHomeSkeleton />);
    const profile = renderToStaticMarkup(<SocialProfileSkeleton />);
    const create = renderToStaticMarkup(<SocialCreateSkeleton />);
    const stories = renderToStaticMarkup(<SocialStoriesSkeleton />);
    const viewer = renderToStaticMarkup(<SocialStoryViewerSkeleton />);
    const explore = renderToStaticMarkup(<SocialExploreSkeleton />);
    const dms = renderToStaticMarkup(<SocialDmsSkeleton />);

    expect(home).toContain("data-social-home-skeleton");
    expect(home).toContain("data-social-stories-skeleton");
    expect(home).toContain("data-social-for-you-skeleton");
    expect(home).toContain("data-social-recent-chats-skeleton");
    expect(profile).toContain("data-social-profile-skeleton");
    expect(create).toContain("data-social-create-skeleton");
    expect(stories).toContain("data-social-stories-index-skeleton");
    expect(viewer).toContain("data-social-story-viewer-skeleton");
    expect(explore).toContain("data-social-explore-skeleton");
    expect(dms).toContain("data-social-dms-skeleton");

    for (const html of [home, profile, create, stories, viewer, explore, dms]) {
      expect(html).not.toContain("Education");
      expect(html).not.toContain("Riley");
      expect(html).not.toContain("Dashboard");
      expect(html).not.toContain("Following");
      expect(html).not.toContain("For you");
    }
  });
});
