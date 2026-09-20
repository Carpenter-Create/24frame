import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
}));

import {
  SOCIAL_CHECKLIST_CLASS,
  SOCIAL_CHECKLIST_TRACK_CLASS,
  SOCIAL_CHECKLIST_TRACK_NESTED_CLASS,
  SOCIAL_COMPOSER_CLASS,
  SOCIAL_FOR_YOU_CARD_CLASS,
  SOCIAL_COMPOSER_FIELD_CLASS,
  SOCIAL_COMPOSER_MEDIA_CLASS,
  SOCIAL_EMPTY_ACTION_CLASS,
  SOCIAL_EMPTY_PANEL_CLASS,
  SOCIAL_STORIES_EMPTY_ACTION_CLASS,
  SOCIAL_TOPIC_CHIP_ROW_CLASS,
  SOCIAL_TOPIC_RAIL_CHIP_CLASS,
  SOCIAL_TOPIC_RAIL_CLASS,
} from "@/lib/social-chrome";
import { HOUSE_SCROLL_ROW_CLASS, HOUSE_SEGMENTED_ITEM_BASE_CLASS } from "@/lib/house-shell";
import { socialInterestTopics } from "@/lib/social-role-affinity";
import { SOCIAL_ICON_SIZE_COMPOSER, SOCIAL_ICON_SIZE_STORY_PLUS } from "@/lib/social-icons";
import { SOCIAL_MEDIA_ACCEPT } from "@/lib/social-media";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import { SocialEmpty, SocialStoriesEmpty } from "./social-empty";
import { SocialHomeComposer } from "./social-home-composer";
import { SocialHomeTopics } from "./social-home-topics";
import { SocialOnboardingChecklist } from "./social-checklist";
import { SocialStoriesRail } from "./social-stories-rail";

const authors = new Map([["u2", { display_name: "Maya Chen", handle: "maya" }]]);
const faces = new Map([["u2", "https://s3.example/signed-avatar"]]);

describe("Social Home craft (Figma 160:482 / 160:964)", () => {
  it("renders the compact composer as avatar | field | media, no Photo|Video|Text pills", () => {
    const html = renderToStaticMarkup(
      <SocialHomeComposer authorName="Adam Carpenter" />,
    );
    expect(html).toContain("data-social-home-composer");
    expect(html).toContain("data-social-composer-prompt");
    expect(html).toContain("data-social-composer-media");
    expect(html).toContain(SOCIAL_COMPOSER_CLASS);
    expect(html).toContain(SOCIAL_COMPOSER_FIELD_CLASS);
    expect(html).toContain(SOCIAL_COMPOSER_MEDIA_CLASS);
    expect(html).toContain("/social/create?kind=text");
    expect(html).toContain("Write something");
    expect(html).not.toContain("What&#x27;s on your mind");
    expect(html.split("Write something").length - 1).toBe(1);
    expect(html).toContain(SOCIAL.home.attach);
    expect(html).toContain(`accept="${SOCIAL_MEDIA_ACCEPT}"`);
    expect(html).toContain('data-social-icon="image"');
    expect(html).toContain(`width="${SOCIAL_ICON_SIZE_COMPOSER}"`);
    expect(html).toContain("text-ink-2");
    expect(html).not.toContain("data-social-composer-action");
    expect(html).not.toContain(SOCIAL.create.photo);
    expect(html).not.toContain(SOCIAL.create.video);
    expect(html).not.toContain(`>${SOCIAL.create.text}<`);
    expect(html).toContain("data-social-avatar");
    expect(html).toContain("AC");
    expect(html).not.toContain("<img");
    expect(SOCIAL_COMPOSER_CLASS).toContain("h-16");
    expect(SOCIAL_COMPOSER_CLASS).toContain("rounded-[var(--radius-lg)]");
    expect(SOCIAL_COMPOSER_FIELD_CLASS).not.toContain("bg-surface-muted");
  });

  it("shows the composer author photo when a signed URL exists", () => {
    const html = renderToStaticMarkup(
      <SocialHomeComposer
        authorName="Adam Carpenter"
        authorPhotoUrl="https://s3.example/adam-face"
      />,
    );
    expect(html).toContain("data-social-avatar");
    expect(html).toContain('src="https://s3.example/adam-face"');
    expect(html).not.toContain("AC");
  });

  it("renders Topics. as a two-row house chip rail, not a wrapping card", () => {
    const html = renderToStaticMarkup(<SocialHomeTopics />);
    expect(html).toContain("data-social-home-topics");
    expect(html).toContain("data-social-home-topics-rail");
    expect(html).toContain("data-house-chip-rail");
    expect(html).toContain('data-house-chip-rail-row="0"');
    expect(html).toContain('data-house-chip-rail-row="1"');
    expect(html).toContain(SOCIAL.forYou.topics);
    expect(html).toContain(SOCIAL_TOPIC_RAIL_CLASS);
    expect(html).toContain(SOCIAL_TOPIC_CHIP_ROW_CLASS);
    expect(html).toContain(SOCIAL_TOPIC_RAIL_CHIP_CLASS);
    expect(SOCIAL_TOPIC_RAIL_CHIP_CLASS).toContain(HOUSE_SEGMENTED_ITEM_BASE_CLASS);
    expect(html).toContain(HOUSE_SEGMENTED_ITEM_BASE_CLASS);
    expect(html).not.toContain("text-[11px]");
    expect(html).not.toContain("py-[5px]");
    expect(SOCIAL_TOPIC_RAIL_CLASS).toBe(HOUSE_SCROLL_ROW_CLASS);
    expect(SOCIAL_TOPIC_RAIL_CLASS).toContain("overflow-x-auto");
    expect(html.match(/overflow-x-auto/g)?.length).toBe(1);
    expect(SOCIAL_TOPIC_RAIL_CLASS).not.toContain("flex-wrap");
    expect(SOCIAL_TOPIC_CHIP_ROW_CLASS).not.toContain("flex-wrap");
    expect(html).not.toContain(SOCIAL_FOR_YOU_CARD_CLASS);
    expect(html).not.toContain("flex-wrap");
    expect(html).toContain("Cinematography");
    expect(html).toContain("Vertical micro dramas");
    expect(html).not.toContain("Topics for you");
    expect(html).not.toContain("Trending topics");
    expect(html).not.toContain("truncate");
    expect(html).not.toContain("data-social-for-you-topics");
    expect(SOCIAL.forYou.topics).toBe("Topics.");
    expect(socialInterestTopics({})).toHaveLength(15);
    const top = html.slice(
      html.indexOf('data-house-chip-rail-row="0"'),
      html.indexOf('data-house-chip-rail-row="1"'),
    );
    const bottom = html.slice(html.indexOf('data-house-chip-rail-row="1"'));
    expect(top).toContain("Acting");
    expect(top).not.toContain("AI filmmaking");
    expect(bottom).toContain("AI filmmaking");
  });

  it("renders tall FB-style story tiles with a plus well and unseen face rings", () => {
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
    expect(html).toContain(`width="${SOCIAL_ICON_SIZE_STORY_PLUS}"`);
    expect(html).toContain(`height="${SOCIAL_ICON_SIZE_STORY_PLUS}"`);
    expect(html).toContain(SOCIAL.stories.create);
    expect(html).not.toContain(SOCIAL.stories.yourStory);
    expect(html).toContain("data-social-stories-tall");
    expect(html).toContain("data-social-story-unseen");
    expect(html).toContain("data-social-story-media");
    expect(html).toContain('src="https://s3.example/signed-avatar"');
    expect(html).toContain("data-social-avatar");
    expect(html).toContain("Maya C.");
    expect(html).toContain("w-[108px]");
    expect(html).toContain("h-[192px]");
    expect(html).toContain("md:w-[112px]");
    expect(html).toContain("md:h-[200px]");
    expect(html).toContain("rounded-[var(--radius-lg)]");
    expect(html).toContain("bg-accent");
    expect(html).toContain("bg-band/55");
    expect(html).toContain("md:h-[120px]");
    expect(html).toContain("md:h-20");
    expect(html).toContain("md:top-[100px]");
    expect(html).toContain("md:size-10");
    expect(html).toContain("font-medium");
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
    expect(SOCIAL_EMPTY_PANEL_CLASS).toContain("rounded-[var(--radius-lg)]");
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
    expect(html).toContain(SOCIAL_CHECKLIST_TRACK_CLASS);
  });

  it("keeps the nested For you setup track on surface so the unfilled bar reads", () => {
    const html = renderToStaticMarkup(
      <SocialOnboardingChecklist
        tone="nested"
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
    expect(html).toContain('data-social-checklist-tone="nested"');
    expect(html).toContain(SOCIAL_FOR_YOU_CARD_CLASS);
    expect(html).toContain(SOCIAL_CHECKLIST_TRACK_NESTED_CLASS);
    expect(html).not.toContain(SOCIAL_CHECKLIST_TRACK_CLASS);
    expect(SOCIAL_FOR_YOU_CARD_CLASS).toContain("bg-surface-muted");
    expect(SOCIAL_CHECKLIST_TRACK_NESTED_CLASS).toContain("bg-surface");
    expect(SOCIAL_CHECKLIST_TRACK_NESTED_CLASS).not.toContain("bg-surface-muted");
  });
});

describe("Social Stories craft (Figma 138:163 / 138:889 / 138:943)", () => {
  it("sizes the Stories rail at 112×168 with a 36px plus well", () => {
    const html = renderToStaticMarkup(
      <SocialStoriesRail
        canCreate
        surface="stories"
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
    expect(html).toContain('data-social-stories-surface="stories"');
    expect(html).toContain("w-[112px]");
    expect(html).toContain("h-[168px]");
    expect(html).toContain("size-9");
    expect(html).toContain(`width="${SOCIAL_ICON_SIZE_STORY_PLUS}"`);
    expect(html).toContain(SOCIAL.stories.create);
    expect(html).toContain(SOCIAL.stories.you);
    expect(html).not.toContain(SOCIAL.stories.yourStory);
    expect(html).toContain("bg-hairline");
    expect(html).toContain("bg-accent");
    expect(html).toContain("p-[3px]");
  });

  it("keeps Home rail tall FB-style and Create story when surface is home", () => {
    const html = renderToStaticMarkup(
      <SocialStoriesRail canCreate createName="Adam Carpenter" authors={authors} faces={faces} cards={[]} />,
    );
    expect(html).toContain('data-social-stories-surface="home"');
    expect(html).toContain("data-social-stories-tall");
    expect(html).toContain("w-[108px]");
    expect(html).toContain("h-[192px]");
    expect(html).toContain(`width="${SOCIAL_ICON_SIZE_STORY_PLUS}"`);
    expect(html).toContain(SOCIAL.stories.create);
    expect(html).toContain("data-social-avatar");
    expect(html).toContain("AC");
    expect(html).not.toContain("<img");
    expect(html).not.toContain(SOCIAL.stories.yourStory);
    expect(html).not.toContain("w-[68px]");
  });

  it("shows the story create face photo when a signed URL exists", () => {
    const html = renderToStaticMarkup(
      <SocialStoriesRail
        canCreate
        createName="Adam Carpenter"
        createPhotoUrl="https://s3.example/adam-face"
        authors={authors}
        faces={faces}
        cards={[]}
      />,
    );
    expect(html).toContain("data-social-story-create");
    expect(html).toContain("data-social-avatar");
    expect(html).toContain('src="https://s3.example/adam-face"');
    expect(html).not.toContain("AC");
  });

  it("renders the Stories empty panel with image 40 and a rounded-full Create a story CTA", () => {
    const html = renderToStaticMarkup(<SocialStoriesEmpty />);
    expect(html).toContain("data-social-stories-empty");
    expect(html).toContain('data-social-icon="image"');
    expect(html).toContain('width="40"');
    expect(html).toContain(SOCIAL.stories.emptyRail);
    expect(html).toContain(SOCIAL.stories.emptyHint);
    expect(html).toContain(SOCIAL.stories.createCta);
    expect(html).toContain(SOCIAL_STORIES_EMPTY_ACTION_CLASS);
    expect(SOCIAL_STORIES_EMPTY_ACTION_CLASS).toContain("rounded-full");
    expect(html).toContain('data-social-icon="plus"');
  });
});
