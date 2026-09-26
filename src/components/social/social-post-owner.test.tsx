import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { SOCIAL } from "@/lib/social";
import { SocialPostCard } from "./social-ui";

const createdAt = "2020-01-01T00:00:00.000Z";

function card(owned: boolean) {
  return renderToStaticMarkup(
    <SocialPostCard
      post={{
        id: "p1",
        body: "hello",
        likeCount: 1,
        commentCount: 0,
        liked: false,
        createdAt,
        authorId: "u1",
        authorHandle: "ada",
        authorName: "Ada Lovelace",
        authorPhotoUrl: null,
        groupSlug: null,
        groupName: null,
        canLike: true,
        media: [{ kind: "image", url: "/api/social/media?key=a" }],
        owned,
      }}
    />,
  );
}

describe("owner post overflow", () => {
  it("shows Edit and Delete on the author row for the owner only", () => {
    const owned = card(true);
    const other = card(false);
    expect(owned).toContain('data-social-post-owner=""');
    expect(owned).toContain(SOCIAL.post.overflow);
    expect(owned.indexOf("data-social-post-owner")).toBeLessThan(owned.indexOf("data-social-post-actions"));
    const actions = owned.slice(owned.indexOf("data-social-post-actions"));
    expect(actions).not.toContain("data-social-post-owner");
    expect(other).not.toContain("data-social-post-owner");
    expect(owned).toContain("gap-3.5");
    const src = readFileSync("src/components/social/social-post-owner.tsx", "utf8");
    expect(src).toContain("ThreadPopoverContent");
    expect(src).toContain("THREAD_POPOVER_ICON_CLASS");
    expect(src).toContain("SOCIAL.post.edit");
    expect(src).toContain("SOCIAL.post.delete");
    expect(src).not.toContain("data-social-post-actions");
    const cardSrc = readFileSync("src/components/social/social-ui.tsx", "utf8");
    const postCard = cardSrc.slice(cardSrc.indexOf("export function SocialPostCard"));
    expect(postCard.indexOf("SocialPostOwnerMenu")).toBeLessThan(postCard.indexOf("data-social-post-actions"));
    expect(postCard).toContain('className="flex items-center gap-3.5"');
  });
});
