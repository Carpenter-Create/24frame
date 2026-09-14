import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SOCIAL_CHECKLIST_CLASS, SOCIAL_EMPTY_ACTION_CLASS, SOCIAL_EMPTY_PANEL_CLASS } from "@/lib/social-chrome";
import { SOCIAL_ICON_SIZE_STORY_CREATE } from "@/lib/social-icons";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import { SocialEmpty } from "./social-empty";
import { SocialOnboardingChecklist } from "./social-checklist";
import { SocialStoriesRail } from "./social-stories-rail";

const authors = new Map([["u2", { display_name: "Maya Chen", handle: "maya" }]]);
const faces = new Map([["u2", "https://s3.example/signed-avatar"]]);

describe("Social Home craft (Figma 130:215)", () => {
  it("renders portrait story tiles with a 28px create control and muted/unseen rings", () => {
    const html = renderToStaticMarkup(
      <SocialStoriesRail
        canCreate
        authors={authors}
        faces={faces}
        cards={[
          {
            authorId: "u2",
            storyIds: ["s1"],
            unseen: true,
            latest: {
              id: "s1",
              author_id: "u2",
              body: null,
              media: [],
              expires_at: "2099-01-01T00:00:00.000Z",
              created_at: "2026-09-14T12:00:00.000Z",
            },
          },
        ]}
      />,
    );
    expect(html).toContain("data-social-story-create");
    expect(html).toContain(`width="${SOCIAL_ICON_SIZE_STORY_CREATE}"`);
    expect(html).toContain(`height="${SOCIAL_ICON_SIZE_STORY_CREATE}"`);
    expect(html).toContain(SOCIAL.stories.create);
    expect(html).toContain(SOCIAL.stories.you);
    expect(html).toContain("data-social-story-unseen");
    expect(html).toContain("data-social-story-media");
    expect(html).toContain('src="https://s3.example/signed-avatar"');
    expect(html).toContain("Maya C.");
    expect(html).toContain("w-[96px]");
    expect(html).toContain("h-[144px]");
    expect(html).toContain("p-[3px]");
    expect(html).toContain("bg-accent");
    expect(html.indexOf("Maya C.")).toBeGreaterThan(html.indexOf("data-social-story-media"));
  });

  it("uses Phosphor users, 8px empty panel, and Sporty Blue empty CTA", () => {
    const html = renderToStaticMarkup(
      <SocialEmpty
        icon="users"
        title={SOCIAL.home.empty}
        hint={SOCIAL.home.emptyHint}
        action={{ href: SOCIAL_ROUTES.explore, label: SOCIAL.home.goExplore }}
      />,
    );
    expect(html).toContain('data-social-icon="users"');
    expect(html).toContain('width="40"');
    expect(html).toContain('height="40"');
    expect(html).toContain(SOCIAL.home.empty);
    expect(html).toContain(SOCIAL.home.goExplore);
    expect(html).toContain(SOCIAL_EMPTY_PANEL_CLASS);
    expect(html).toContain(SOCIAL_EMPTY_ACTION_CLASS);
    expect(SOCIAL_EMPTY_PANEL_CLASS).toContain("rounded-[8px]");
    expect(SOCIAL_EMPTY_ACTION_CLASS).toContain("bg-accent");
  });

  it("keeps finish-setup on the 8/16 density", () => {
    const html = renderToStaticMarkup(
      <SocialOnboardingChecklist
        items={[
          {
            id: "photo",
            label: SOCIAL.checklist.photo,
            href: SOCIAL_ROUTES.profile,
            cta: SOCIAL.checklist.photoCta,
            done: false,
          },
        ]}
      />,
    );
    expect(html).toContain("data-social-checklist");
    expect(html).toContain(SOCIAL_CHECKLIST_CLASS);
    expect(SOCIAL_CHECKLIST_CLASS).toContain("gap-[var(--space-2)]");
    expect(SOCIAL_CHECKLIST_CLASS).toContain("p-[var(--space-4)]");
    expect(html).toContain(SOCIAL.checklist.title);
    expect(html).toContain(SOCIAL.checklist.photoCta);
  });
});
